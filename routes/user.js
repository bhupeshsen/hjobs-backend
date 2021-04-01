const express = require('express');
const multer = require('multer');
const path = require('path');
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

let docUpload = multer({ storage: docStorage });

router.put('/profile/:id', isValidUser, (req, res) => {
  const id = req.params.id;
  const body = req.body;

  user.findByIdAndUpdate({ _id: id }, body, { new: true }, (err, doc) => {
    if (err) return res.status(400).json({ message: 'Bad Request', error: err });
    res.status(200).json({ message: 'Profile successfully updated!', user: doc });
  });
});

router.put('/add-document/:id', docUpload.array('docs', 2), isValidUser, (req, res) => {
  const id = req.params.id;
  const body = req.body;
  const docs = req.files;
  var files = [];

  if (docs != undefined) {
    docs.map(file => {
      files.push(file.filename);
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