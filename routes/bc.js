const express = require('express');
const { Payment } = require('../models/payment');
const { User } = require('../models/user');
const router = express.Router();
const { BC, CM } = require('../models/business/business');

router.route('/profile')
  .get(isValidUser, (req, res) => {
    const userId = req.user._id;
    if (userId != undefined) {
      BC.findById({ _id: userId }).exec((err, users) => {
        if (err) return res.status(400).json(err);
        res.status(200).json(users);
      });
    }
  });


router.route('/dashboard')
  .get(isValidUser, (req, res) => {
    const code = req.user.bcCode;
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
                  users: { $cond: [{ $gte: ['$plan.expiryDate', date] }, 1, 0] },
                  recruiters: { $cond: [{ $gte: ['$recruiter.plan.expiryDate', date] }, 1, 0] }
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
            users: { $sum: '$user.subscriptions.users' },
            recruiters: { $sum: '$user.subscriptions.recruiters' }
          }
        }
      }
    ]).exec((err, payments) => {
      if (err) return res.status(400).json(err);
      if (payments.length == 0) return res.status(404).json({ message: 'Fse not found!' });
      res.status(200).json(payments[0]);
    });
  });

router.get('/users', isValidUser, (req, res) => {
  const code = req.user.bcCode;
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