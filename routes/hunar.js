const express = require('express');
const multer = require('multer');
const mongoose = require('mongoose');
const ObjectId = mongoose.mongo.ObjectID;
const path = require('path');
const config = require('../config/config');
const user = require('../models/user').User;
const router = express.Router();

const storageV = multer.diskStorage({
  destination: function (req, file, cb) {
    const path = 'public/videos/local-hunar/';
    fs.mkdirSync(path, { recursive: true });
    cb(null, path)
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

  var update = { 'hunar.status': true, $push: { 'hunar.videos': video } }

  user.findByIdAndUpdate({ _id: localHunarId },
    update, { upsert: true, new: true }, (err, doc) => {
      if (err) return res.status(400).json(err);
      res.status(200).json({ message: 'Video successfully uploaded!' });
    });
});

router.route('/video')
  .get(isValidUser, (req, res) => {
    const localHunarId = req.user._id;
    user.findById({ _id: localHunarId }, { hunar: 1 }).exec((err, results) => {
      if (err) return res.status(400).json(err);
      res.status(200).json(results.hunar.videos);
    })
  })
  .put(isValidUser, (req, res) => {
    const localHunarId = req.user._id;
    const videoId = req.query.videoId;
    const description = req.body.description;

    user.findOneAndUpdate({
      _id: ObjectId(localHunarId),
      'hunar.videos': { $elemMatch: { _id: ObjectId(videoId) } }
    },
      { $set: { "hunar.videos.$.description": description } },
      { upsert: true, new: true }, (err, _) => {
        if (err) return res.status(400).json(err);
        res.status(200).json({ message: 'Video successfully updated!' });
      });
  })
  .delete(isValidUser, (req, res) => {
    const localHunarId = req.user._id;
    const videoId = req.query.videoId;

    user.findByIdAndUpdate({ _id: ObjectId(localHunarId) },
      { $pull: { 'hunar.videos': { _id: ObjectId(videoId) } } }, (err, _) => {
        if (err) return res.status(400).json(err);
        res.status(200).json({ message: 'Video successfully removed!' });
      });
  });

function isValidUser(req, res, next) {
  if (req.isAuthenticated()) next();
  else return res.status(401).json({ message: 'Unauthorized' });
}

module.exports = router;