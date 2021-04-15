const express = require('express');
const multer = require('multer');
const ObjectId = require('mongodb').ObjectID;
const Company = require('../models/company');
const { User } = require('../models/user');
const { GovtJob } = require('../models/govt-job');
const { Payment } = require('../models/payment');
const Job = require('../models/job');
const Plan = require('../models/plan');
const router = express.Router();

router.get('/dashboard', isValidUser, (req, res) => {
  const role = req.user.role;

  User.aggregate([
    {
      $facet: {
        _seeker: [
          { $match: { 'seeker.status': true } },
          {
            $project: {
              subscribed: { $cond: [{ $gte: ['$plan.expiryDate', new Date()] }, 1, 0] },
            }
          }
        ],
        _recruiter: [
          { $match: { 'recruiter.status': true } },
          {
            $project: {
              subscribed: { $cond: [{ $gte: ['$recruiter.plan.expiryDate', new Date()] }, 1, 0] },
            }
          }
        ],
        _customer: [
          { $match: { 'customer.status': true } }
        ],
        _provider: [
          { $match: { 'provider.status': true } },
          {
            $project: {
              subscribed: { $cond: [{ $gte: ['$plan.expiryDate', new Date()] }, 1, 0] },
            }
          }
        ],
        _hunar: [
          { $match: { 'hunar.status': true } }
        ],
      }
    },
    {
      $lookup: {
        from: Job.collection.name,
        let: {},
        pipeline: [
          {
            $project: {
              _id: 1,
              boosting: { $cond: [{ $gte: ['$boost.expiryDate', new Date()] }, 1, 0] },
              multiState: {
                $cond: [{
                  $and: [
                    { $gte: ['$boost.expiryDate', new Date()] },
                    { $eq: ['$boost.multiState', true] },
                  ]
                }, 1, 0]
              }
            }
          }
        ],
        as: 'jobs'
      }
    },
    {
      $lookup: {
        from: GovtJob.collection.name,
        let: {},
        pipeline: [{ $project: { _id: 1 } }],
        as: 'govtJobs'
      }
    },
    {
      $lookup: {
        from: Payment.collection.name,
        let: {},
        pipeline: [{ $project: { _id: 1, amount: 1 } }],
        as: 'payments'
      }
    },
    {
      $project: {
        seeker: {
          total: { $size: '$_seeker' },
          unsubscribed: { $subtract: [{ $size: '$_seeker' }, { $sum: '$_seeker.subscribed' }] },
          subscribed: { $sum: '$_seeker.subscribed' }
        },
        recruiter: {
          total: { $size: '$_recruiter' },
          unsubscribed: { $subtract: [{ $size: '$_recruiter' }, { $sum: '$_recruiter.subscribed' }] },
          subscribed: { $sum: '$_recruiter.subscribed' }
        },
        provider: {
          total: { $size: '$_provider' },
          unsubscribed: { $subtract: [{ $size: '$_provider' }, { $sum: '$_provider.subscribed' }] },
          subscribed: { $sum: '$_provider.subscribed' }
        },
        customer: {
          total: { $size: '$_customer' },
        },
        hunar: {
          total: { $size: '$_hunar' },
        },
        jobs: { $size: '$jobs' },
        govtJobs: { $size: '$govtJobs' },
        jobBoosting: {
          total: { $sum: '$jobs.boosting' },
          single: { $subtract: [{ $sum: '$jobs.boosting' }, { $sum: '$jobs.multiState' }] },
          multi: { $sum: '$jobs.multiState' }
        },
        jobBranding: '0',
        earning: { $sum: '$payments.amount' }
      }
    }
  ]).exec((err, data) => {
    if (err) return res.status(400).json(err);
    res.status(200).json(data[0])
  })
});

function isValidUser(req, res, next) {
  if (req.isAuthenticated()) next();
  else return res.status(401).json({ message: 'Unauthorized' });
}

module.exports = router;