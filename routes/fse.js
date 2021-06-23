const express = require('express');
const fs = require('fs');
const multer = require('multer');
const path = require('path');
const config = require('../config/config');
const { Payment } = require('../models/payment');
const { User } = require('../models/user');
const { FSE } = require('../models/business/fse');
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

router.route('/dashboard')
  .get(isValidUser, (req, res) => {
    const code = req.user.role == 'admin' ? req.query.code : req.user.fseCode;
    const date = new Date();
    const firstDay = new Date(date.getFullYear(), date.getMonth(), 1);
    const lastDay = new Date(date.getFullYear(), date.getMonth() + 1, 0);
    const startYear = new Date(date.getFullYear(), 0, 1);
    const endYear = new Date(date.getFullYear(), 12, 0);

    Payment.aggregate([
      { $match: { $and: [{ bcCode: { $ne: null } }, { bcCode: code }] } },
      {
        $facet: {
          monthPayments: [
            {
              $match: {
                $and: [
                  { createdAt: { $lte: lastDay } },
                  { createdAt: { $gte: firstDay } }
                ]
              }
            }
          ],
          yearPayments: [
            {
              $match: {
                $and: [
                  { createdAt: { $lte: endYear } },
                  { createdAt: { $gte: startYear } }
                ]
              }
            }
          ]
        }
      },
      {
        $lookup: {
          from: User.collection.name,
          let: {},
          pipeline: [
            { $match: { $expr: { $eq: ['$addedByCode', code] } } },
            {
              $project: {
                seeker: { $cond: [{ $eq: ['$seeker.status', true] }, 1, 0] },
                recruiter: { $cond: [{ $eq: ['$recruiter.status', true] }, 1, 0] },
                customer: { $cond: [{ $eq: ['$customer.status', true] }, 1, 0] },
                provider: { $cond: [{ $eq: ['$provider.status', true] }, 1, 0] },
                hunar: { $cond: [{ $eq: ['$hunar.status', true] }, 1, 0] },
                subscriptions: {
                  seeker: { $cond: [{ $and: [{ $gte: ['$plan.expiryDate', date] }, { $eq: ['$seeker.status', true] }] }, 1, 0] },
                  customer: { $cond: [{ $and: [{ $gte: ['$plan.expiryDate', date] }, { $eq: ['$customer.status', true] }] }, 1, 0] },
                  provider: { $cond: [{ $and: [{ $gte: ['$plan.expiryDate', date] }, { $eq: ['$provider.status', true] }] }, 1, 0] },
                  hunar: { $cond: [{ $and: [{ $gte: ['$plan.expiryDate', date] }, { $eq: ['$hunar.status', true] }] }, 1, 0] },
                  recruiter: { $cond: [{ $and: [{ $gte: ['$recruiter.plan.expiryDate', date] }, { $eq: ['$recruiter.status', true] }] }, 1, 0] },
                }
              }
            }
          ],
          as: 'user'
        }
      },
      {
        $project: {
          earning: {
            year: { $sum: '$yearPayments.amount' },
            month: { $sum: '$monthPayments.amount' }
          },
          users: {
            seeker: { $sum: '$user.seeker' },
            recruiter: { $sum: '$user.recruiter' },
            customer: { $sum: '$user.customer' },
            provider: { $sum: '$user.provider' },
            hunar: { $sum: '$user.hunar' },
          },
          subscriptions: {
            seekers: { $sum: '$user.subscriptions.seeker' },
            customers: { $sum: '$user.subscriptions.customer' },
            providers: { $sum: '$user.subscriptions.provider' },
            hunars: { $sum: '$user.subscriptions.hunar' },
            recruiters: { $sum: '$user.subscriptions.recruiter' }
          }
        }
      }
    ]).exec((err, payments) => {
      if (err) return res.status(400).json(err);
      if (payments.length == 0) return res.status(404).json({ message: 'Fse not found!' });
      res.status(200).json(payments[0]);
    });
  });

var fseUpload = upload.fields([
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
    const filter = '-password -passwordResetToken -passwordResetExpires -cmCode';

    FSE.findById({ _id: id }, filter).exec((err, fse) => {
      if (err) return res.status(400).json(err);
      res.status(200).json(fse);
    })
  })
  .put(fseUpload, isValidUser, (req, res) => {
    const id = req.user._id;
    var body = req.body;
    const options = {
      projection: {
        password: 0, passwordResetToken: 0, passwordResetExpires: 0, cmCode: 0
      }, new: true
    };

    const aadharF = req.files['documents[aadharCard][aadharF]'];
    const aadharB = req.files['documents[aadharCard][aadharB]'];
    const panCard = req.files['documents[panCard][image]'];
    const residential = req.files['documents[residentialProof][proofImage]'];
    const bank = req.files['documents[bank][passbook]'];
    const photo = req.files['photo'];

    if (aadharF != undefined && aadharB != undefined) {
      body['documents']['aadharCard']['aadharF'] = config.pathImages + aadharF[0].filename;
      body['documents']['aadharCard']['aadharB'] = config.pathImages + aadharB[0].filename;
    }

    if (panCard != undefined) {
      body['documents']['panCard']['image'] = config.pathImages + panCard[0].filename;
    }

    if (residential != undefined) {
      body['documents']['residentialProof']['proofImage'] = config.pathImages + residential[0].filename;
    }

    if (bank != undefined) {
      body['documents']['bank']['passbook'] = config.pathImages + bank[0].filename;
    }

    if (photo != undefined) {
      body['photo'] = config.pathImages + photo[0].filename
    }

    FSE.findByIdAndUpdate({ _id: id }, body, options).exec((err, fse) => {
      if (err) return res.status(400).json(err);
      res.status(200).json({ message: 'Profile successfully updated!', user: fse });
    })
  })

router.get('/users', isValidUser, (req, res) => {
  const code = req.user.fseCode;
  const user = req.query.user;
  const type = req.query.type;

  const filter = 'name mobile photo address plan';
  var query = type == 'subscribed' ? { 'plan.currentPlan': { $ne: null }, 'plan.expiryDate': { $gte: new Date() } }
    : type == 'active' ? { 'plan.expiryDate': { $gte: new Date() } }
      : type == 'inactive' ? {
        $or: [{ 'plan.expiryDate': { $lte: new Date() } }, { 'plan.expiryDate': null }]
      } : {};

  query['addedByCode'] = code;
  query[`${user}.status`] = true;

  User.find(query, filter).exec((err, users) => {
    if (err) return res.status(400).json(err);
    res.status(200).json(users);
  });
});

function isValidUser(req, res, next) {
  if (req.isAuthenticated()) next();
  else return res.status(401).json({ message: 'Unauthorized' });
}

module.exports = router;