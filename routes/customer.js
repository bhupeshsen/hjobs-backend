const express = require('express');
const multer = require('multer');
const ObjectId = require('mongodb').ObjectID;
const { User } = require('../models/user');
const { Service } = require('../models/provider/service');
const { Order } = require('../models/provider/order');
const router = express.Router();

// Update Profile
router.put('/profile', isValidUser, (req, res) => {
  const userId = req.user._id;
  var body = req.body;
  body["customer.status"] = true;

  const options = { new: true, safe: true, upsert: true };

  User.findByIdAndUpdate({ _id: userId }, body, options)
    .exec((err, user) => {
      if (err) return res.status(400).json(err);
      if (!user) return res.status(404).json({ message: 'User not found!' });
      res.status(200).json({ message: 'Profile successfully updated!', user: user });
    });
});

// Search
router.get('/search', isValidUser, (req, res) => {
  const userId = req.user._id;
  const search = req.query.q;

  const query = {
    user: { $ne: userId },
    serviceName: { $regex: '.*' + search + '.*', $options: 'i' }
  };
  const filter = 'name provider.disability address provider.experience photo';

  Service.find(query).populate('user', filter).exec((err, providers) => {
    if (err) return res.status(400).json(err);
    res.status(200).json(providers);
  });
});

// Provider
router.get('/providers', isValidUser, (req, res) => {
  const userId = req.user._id;
  const category = req.query.category;
  const users = [];

  const query = { categoryName: category };
  const filter = 'name mobile gender address photo provider.experience provider.disability provider.gallery';

  Service.find(query)
    .populate({ path: 'user', select: filter, match: { _id: { $ne: userId } } })
    .exec((err, services) => {
      if (err) return res.status(400).json(err);
      if (services == 0) return res.status(200).json([]);

      services = services.filter(m => m.user != null);
      services.map(m => users.push(m.user));
      const unique = [...new Set(users)]
      res.status(200).json(unique)
    });
});

// Services
router.get('/services', isValidUser, (req, res) => {
  const category = req.query.category;
  const providerId = req.query.providerId;

  var services = [];

  Service.find({ user: ObjectId(providerId) }, (err, doc) => {
    if (err) return res.status(400).json(err);
    if (doc == null) return res.status(200).json([]);

    doc.forEach(element => {
      if (element.categoryName == category) {
        services.push(element);
      }
    });

    res.status(200).json(services);
  });

});

// Orders
router.route('/order')
  .get(isValidUser, (req, res) => {
    const userId = req.user._id;
    const orderId = req.query.orderId;

    const query = orderId != null
      ? { _id: orderId, customer: ObjectId(userId) }
      : { customer: ObjectId(userId) };
    const model = orderId != null ? Order.findOne(query) : Order.find(query);

    model.populate('provider', 'name photo address mobile -_id')
      .populate('services')
      .sort({ createdAt: -1 })
      .exec((err, orders) => {
        if (err) return res.status(400).json(err);
        res.status(200).json(orders);
      });
  })
  .post(isValidUser, (req, res) => {
    const userId = req.user._id;
    var body = req.body;
    body.customer = userId;

    const order = new Order(body);

    order.save((err) => {
      if (err) return res.status(400).json(err);
      res.status(200).json({ message: 'Order successfully created!' });
    });
  })

// Tutor

function isValidUser(req, res, next) {
  if (req.isAuthenticated()) next();
  else return res.status(401).json({ message: 'Unauthorized' });
}

module.exports = router;