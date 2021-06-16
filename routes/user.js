const express = require('express');
const multer = require('multer');
const ObjectId = require('mongodb').ObjectID;
const fs = require('fs');
const path = require('path');
const config = require('../config/config');
const { User } = require('../models/user');
const Notification = require('../models/notification');
const router = express.Router();

const docStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    const path = 'public/documents/';
    fs.mkdirSync(path, { recursive: true });
    cb(null, path)
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + path.extname(file.originalname))
  }
})

const picStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    const path = 'public/images/';
    fs.mkdirSync(path, { recursive: true });
    cb(null, path)
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + path.extname(file.originalname))
  }
})

let docUpload = multer({ storage: docStorage });
let picUpload = multer({ storage: picStorage });

router.route('/profile')
  .get(isValidUser, (req, res) => {
    const id = req.user._id;
    const filter = {
      password: 0,
      passwordResetToken: 0,
      passwordResetExpires: 0
    };

    User.findById({ _id: id }, filter)
      .populate('recruiter.company')
      .exec((err, doc) => {
        if (err) return res.status(400).json(err);
        if (!doc) return res.status(404).json({ message: 'Profile not found!' });
        res.status(200).json(doc);
      });
  })
  .put(isValidUser, (req, res) => {
    const id = req.user._id;
    const body = req.body;

    User.findByIdAndUpdate({ _id: id }, body, { new: true }, (err, doc) => {
      if (err) return res.status(400).json({ message: 'Bad Request', error: err });
      res.status(200).json({ message: 'Profile successfully updated!', user: doc });
    });
  });

router.put('/photo', picUpload.single('photo'), isValidUser, (req, res) => {
  const id = req.user._id;

  if (req.file == undefined) {
    return res.status(400).json({ message: 'Image not received!' });
  }

  User.findByIdAndUpdate({ _id: id },
    { photo: '/images/' + req.file.filename }, { new: true }
  ).exec((err, doc) => {
    if (err) return res.status(400).json({ message: 'Bad Request', error: err });
    res.status(200).json({ message: 'Photo successfully updated!', user: doc });
  })
})

router.route('/document')
  .put(docUpload.any('docs', 2), isValidUser, (req, res) => {
    const id = req.user.role == 'admin' ? req.query.id : req.user._id;
    const body = req.body;
    const docs = req.files;
    var files = [];

    if (docs != undefined) {
      docs.map(file => {
        files.push(config.pathDocuments + file.filename);
      });
    }

    const update = {
      $addToSet: {
        documents: {
          type: body.type,
          files: files,
          number: body.number
        }
      }
    }

    User.findByIdAndUpdate({ _id: id }, update,
      { new: true, upsert: true }, (err, doc) => {
        if (err) return res.status(400).json({ message: 'Bad Request', error: err });
        res.status(200).json({ message: 'Documents successfully updated!', user: doc });
      })

  })
  .delete(isValidUser, (req, res) => {
    const userId = req.user._id;
    const docId = req.query.docId;

    const update = { $pull: { documents: { _id: docId } } };
    const options = { safe: true, upsert: true, new: true };

    User.findByIdAndUpdate({ _id: userId }, update, options)
      .exec((err, doc) => {
        if (err) return res.status(400).json(err);
        if (!doc) return res.status(404).json({ message: 'User not found!' });
        res.status(200).json(doc);
      })
  });

router.route('/education')
  .post(isValidUser, (req, res) => {
    const userId = req.user.role == 'admin' ? req.query.id : req.user._id;
    const body = req.body;

    const update = { $push: { educations: body } };
    const options = { safe: true, upsert: true, new: true };

    User.findByIdAndUpdate({ _id: userId }, update, options)
      .exec((err, doc) => {
        if (err) return res.status(400).json(err);
        if (!doc) return res.status(404).json({ message: 'User not found!' });
        res.status(200).json({ message: 'Education successfully updated!', user: doc });
      })
  })
  .delete(isValidUser, (req, res) => {
    const userId = req.user._id;
    const eduId = req.query.eduId;

    const update = { $pull: { educations: { _id: eduId } } };
    const options = { safe: true, upsert: true, new: true };

    User.findByIdAndUpdate({ _id: userId }, update, options)
      .exec((err, doc) => {
        if (err) return res.status(400).json(err);
        if (!doc) return res.status(404).json({ message: 'User not found!' });
        res.status(200).json(doc);
      })
  })

// Notifications
router.route('/notifications')
  .get(isValidUser, (req, res) => {
    const id = req.user._id;

    Notification.find({ userId: ObjectId(id) }, (err, notifications) => {
      if (err) return res.status(400).json(err);
      res.status(200).json(notifications);
    });
  })
  .delete(isValidUser, (req, res) => {
    const id = req.user._id;

    Notification.deleteMany({ userId: ObjectId(id) })
      .exec((err, _) => {
        if (err) return res.status(400).json(err);
        res.status(200).json({ message: 'Notifications successfully deleted!' });
      })
  });

// Wallet
router.get('/wallet', isValidUser, (req, res) => {
  const userId = req.user._id;

  User.findById({ _id: userId }, { wallet: 1 }, (err, user) => {
    if (err) return res.status(400).json(err);
    res.status(200).json(user);
  });
});

function isValidUser(req, res, next) {
  if (req.isAuthenticated()) next();
  else return res.status(401).json({ message: 'Unauthorized' });
}

module.exports = router;