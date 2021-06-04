const express = require('express');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const ObjectId = require('mongodb').ObjectID;
const config = require('../config/config');
const mail = require('../helper/mail');
const mailScript = require('../helper/mail-script');
const { User } = require('../models/user');
const { Order } = require('../models/provider/order');
const { Service } = require('../models/provider/service');
const { providerOrder } = require('../helper/notification');
const router = express.Router();

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const path = 'public/images/provider';
    fs.mkdirSync(path, { recursive: true });
    cb(null, path);
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});

let upload = multer({ storage: storage });

// Update Profile
router.put('/profile', isValidUser, (req, res) => {
  const userId = req.user._id;
  var body = req.body;
  body["provider.status"] = true;

  const options = { new: true, safe: true, upsert: true };

  User.findByIdAndUpdate({ _id: userId }, body, options)
    .exec((err, user) => {
      if (err) return res.status(400).json(err);
      if (!user) return res.status(404).json({ message: 'User not found!' });
      res.status(200).json({ message: 'Profile successfully updated!', user: user });

      // send mail
      const htmlMessage = '';
      const subject = '';
      mail.sendMail(user.email, user.name, subject, '', htmlMessage);
    });
});

// GET /provider/service
// POST /provider/service {categoryName:'A', serviceName: 'B', price: 0}
// DELETE /provider/service?serviceId=123
router.route('/service')
  .get(isValidUser, (req, res) => {
    const userId = req.user._id;

    Service.find({ user: userId })
      .sort({ createdAt: -1 })
      .exec((err, services) => {
        if (err) return res.status(400).json(err);
        res.status(200).json(services);
      });
  })
  .post(isValidUser, async (req, res) => {
    const userId = req.user._id;
    const body = req.body;

    const service = new Service({
      user: userId,
      categoryName: body.categoryName,
      serviceName: body.serviceName,
      price: body.price
    });

    const options = { upsert: true, new: true };

    service.save(function (err) {
      if (err) return res.status(400).json(err);

      const update = { $addToSet: { 'provider.services': service._id } };

      User.findByIdAndUpdate({ _id: userId }, update, options)
        .exec((err, _) => {
          if (err) return res.status(400).json(err);
          res.status(200).json({ message: 'Service successfully added!' });

          // send mail
          const htmlMessage = '';
          const subject = '';
          mail.sendMail('email all customer', 'name all customer', subject, '', htmlMessage);
        });
    });
  })
  .delete(isValidUser, (req, res) => {
    const userId = req.user._id;
    const serviceId = req.query.serviceId;

    const update = { $pull: { 'provider.services': ObjectId(serviceId) } };
    const options = { upsert: true, new: true };

    Service.findByIdAndDelete({ _id: ObjectId(serviceId) })
      .exec((err, _) => {
        if (err) return res.status(400).json(err);

        User.findByIdAndUpdate({ _id: userId }, update, options)
          .exec((err, _) => {
            if (err) return res.status(400).json(err);
            res.status(200).json({ message: 'Service successfully deleted!' });
          });
      })
  });

// Gallery
router.route('/gallery')
  .get(isValidUser, (req, res) => {
    const userId = req.user._id;

    User.findById({ _id: userId }, { 'provider.gallery': 1 })
      .exec((err, user) => {
        if (err) return res.status(400).json(err);
        if (!user) return res.status(404).json({ message: 'User not found!' });

        const gallery = user.provider != null ? user.provider.gallery : [];

        res.status(200).json(gallery);
      })
  })
  .post(isValidUser, upload.single('image'), (req, res) => {
    const userId = req.user._id;

    const options = { safe: true, upsert: true, new: true };
    var update = {};

    if (req.file != undefined) {
      const image = config.pathProvider + req.file.filename;
      update = { $push: { "provider.gallery": image } };

      User.findByIdAndUpdate({ _id: userId }, update,
        options, (err, _) => {
          if (err) return res.status(400).json(err);
          res.status(200).json({ message: 'Image successfully added.', image: image });
        });

    } else {
      return res.status(400).json({ message: 'File not received!' });
    }
  })
  .delete(isValidUser, (req, res) => {
    const userId = req.user._id;
    const image = req.query.image;

    var update = { $pull: { "provider.gallery": image } }

    User.findByIdAndUpdate({ _id: userId }, update,
      { safe: true, upsert: true, new: true }, (err, _) => {
        if (err) return res.status(400).json(err);
        res.status(200).json({ message: 'Image successfully removed.' });
      });
  });

// Orders
router.route('/order')
  .get(isValidUser, (req, res) => {
    const userId = req.user._id;
    const orderId = req.query.orderId;

    const query = orderId != undefined
      ? { _id: ObjectId(orderId), provider: ObjectId(userId) }
      : { provider: ObjectId(userId) };
    const filter = 'name mobile address customer.telephone';
    const model = orderId != undefined ? Order.findOne(query) : Order.find(query);

    model.populate('customer', filter)
      .populate('services')
      .sort({ createdAt: -1 })
      .exec((err, order) => {
        if (err) return res.status(400).json(err);
        res.status(200).json(order);
      });
  })
  .put(isValidUser, (req, res) => {
    const orderId = req.query.orderId;
    const status = req.body.status;

    // [Status] 0 => Created; 1 => Accepted; 2 => Rejected;
    const update = status == 'accept' ? { status: 1 } : status == 'reject' ? { status: 2 } : {}

    Order.findByIdAndUpdate({ _id: orderId }, update, { new: true })
      .populate('customer', 'fcmToken')
      .exec((err, doc) => {
        if (err) return res.status(400).json(err);
        res.status(200).json({ message: `Order successfully ${status}ed.` });

        providerOrder(doc.fcmToken, status);
      });
  });

function isValidUser(req, res, next) {
  if (req.isAuthenticated()) next();
  else return res.status(401).json({ message: 'Unauthorized' });
}

module.exports = router;