const express = require('express');
const multer = require('multer');
const path = require('path');
const config = require('../config/config');
const user = require('../models/user');
const router = express.Router();

const docStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'public/documents/')
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + path.extname(file.originalname))
  }
})

const picStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'public/images/')
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

    user.findById({ _id: id }, filter)
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

    user.findByIdAndUpdate({ _id: id }, body, { new: true }, (err, doc) => {
      if (err) return res.status(400).json({ message: 'Bad Request', error: err });
      res.status(200).json({ message: 'Profile successfully updated!', user: doc });
    });
  });

router.put('/photo', picUpload.single('photo'), isValidUser, (req, res) => {
  const id = req.user._id;

  if (req.file == undefined) {
    return res.status(400).json({ message: 'Image not received!' });
  }

  user.findByIdAndUpdate({ _id: id },
    { photo: '/images/' + req.file.filename }
  ).exec((err, doc) => {
    if (err) return res.status(400).json({ message: 'Bad Request', error: err });
    res.status(200).json({ message: 'Photo successfully updated!', user: doc });
  })
})

router.put('/add-document', docUpload.array('docs', 2), isValidUser, (req, res) => {
  const id = req.user._id;
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

  user.findByIdAndUpdate({ _id: id }, update,
    { new: true, upsert: true }, (err, doc) => {
      if (err) return res.status(400).json({ message: 'Bad Request', error: err });
      res.status(200).json({ message: 'Documents successfully updated!', user: doc });
    })

});

function isValidUser(req, res, next) {
  if (req.isAuthenticated()) next();
  else return res.status(401).json({ message: 'Unauthorized' });
}

module.exports = router;