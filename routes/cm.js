const express = require('express');
const ObjectId = require('mongodb').ObjectID;
const fs = require('fs');
const multer = require('multer');
const path = require('path');
const config = require('../config/config');
const { User } = require('../models/user');
const { CM } = require('../models/business/business');
const router = express.Router();

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    let path = `public/images`;
    cb(null, path);
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});

let upload = multer({ storage: storage });

var cmUpload = upload.fields([
  { name: 'documents[aadharCard][aadharF]', maxCount: 1 },
  { name: 'documents[aadharCard][aadharB]', maxCount: 1 },
  { name: 'documents[panCard][image]', maxCount: 1 },
  { name: 'documents[residentialProof][proofImage]', maxCount: 1 },
  { name: 'documents[bank][passbook]', maxCount: 1 },
  { name: 'photo', maxCount: 1 }
]);
router.route('/profile')
  .get(isValidUser, (req, res) => {
    const id = req.user._id;
    const filter = '-password -passwordResetToken -passwordResetExpires';

    CM.findById({ _id: id }, filter).exec((err, cm) => {
      if (err) return res.status(400).json(err);
      res.status(200).json(cm);
    })
  })
  .put(cmUpload, isValidUser, (req, res) => {
    const id = req.user._id;
    var body = req.body;
    const options = {
      projection: {
        password: 0, passwordResetToken: 0, passwordResetExpires: 0
      }, new: true
    };

    const aadharF = req.files['documents[aadharCard][aadharF]'];
    const aadharB = req.files['documents[aadharCard][aadharB]'];
    const panCard = req.files['documents[panCard][image]'];
    const residential = req.files['documents[residentialProof][proofImage]'];
    const bank = req.files['documents[bank][passbook]'];
    const photo = req.files['photo'];

    if (aadharF != undefined && aadharB != undefined) {
      body.documents.aadharCard = {};
      body.documents.aadharCard.aadharF = config.pathImages + aadharF[0].filename;
      body.documents.aadharCard.aadharB = config.pathImages + aadharB[0].filename;
    }

    if (panCard != undefined) {
      body.documents.panCard = {};
      body.documents.panCard.image = config.pathImages + panCard[0].filename;
    }

    if (residential != undefined) {
      body.documents.residentialProof = {};
      body.documents.residentialProof.proofImage = config.pathImages + residential[0].filename;
    }

    if (bank != undefined) {
      body.documents.bank = {};
      body.documents.bank.passbook = config.pathImages + bank[0].filename;
    }

    if (photo != undefined) {
      body.photo = config.pathImages + photo[0].filename
    }

    CM.findByIdAndUpdate({ _id: id }, body, options).exec((err, cm) => {
      if (err) return res.status(400).json(err);
      res.status(200).json({ message: 'Profile successfully updated!', user: cm });
    })
  })

function isValidUser(req, res, next) {
  if (req.isAuthenticated()) next();
  else return res.status(401).json({ message: 'Unauthorized' });
}

module.exports = router;