const express = require('express');
const ObjectId = require('mongodb').ObjectID;
const { Payment } = require('../models/payment');
const { FSE } = require('../models/business/fse');
const router = express.Router();

router.route('/dashboard')
  .get(isValidUser, (req, res) => {
    const code = req.user.fseCode;
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
        $project: {
          earning: {
            year: { $sum: '$yearPayments.amount' },
            month: { $sum: '$monthPayments.amount' }
          }
        }
      }
    ]).exec((err, payments) => {
      if (err) return res.status(400).json(err);
      if (payments.length == 0) return res.status(404).json({ message: 'Fse not found!' });
      res.status(200).json(payments);
    });
  });

function isValidUser(req, res, next) {
  if (req.isAuthenticated()) next();
  else return res.status(401).json({ message: 'Unauthorized' });
}

module.exports = router;