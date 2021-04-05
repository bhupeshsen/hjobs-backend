const express = require('express');
const multer = require('multer');
const path = require('path');
const config = require('../config/config');
const user = require('../models/user');
const router = express.Router();

const storageV = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'public/videos/local-hunar/');
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + '.mp4');
  }
});

let vidUpload = multer({ storage: storageV });

router.post('/video', vidUpload.single('video'), isValidUser, (req, res) => {
  const localHunarId = req.user._id;

  var video = {};

  if (req.file != undefined) {
    video.url = config.pathVideosLH + req.file.filename;
    video.description = req.body.description;
  } else {
    return res.status(400).json({ message: 'File not received!' });
  }

  var update = { $push: { 'hunar.videos': video } }

  user.findByIdAndUpdate({ _id: localHunarId },
    update, { upsert: true, new: true }, (err, result) => {
      if (err) return res.status(400).json(err);
      res.status(200).json(result);
    });
});

function isValidUser(req, res, next) {
  if (req.isAuthenticated()) next();
  else return res.status(401).json({ message: 'Unauthorized' });
}

module.exports = router;