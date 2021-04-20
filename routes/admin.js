const express = require('express');
const multer = require('multer');
const ObjectId = require('mongodb').ObjectID;
const config = require('../config/config');
const { Company } = require('../models/company');
const { User } = require('../models/user');
const { GovtJob } = require('../models/govt-job');
const { Payment } = require('../models/payment');
const { Job } = require('../models/job');
const { Blog } = require('../models/blog');
const Plan = require('../models/plan');
const router = express.Router();

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const path = 'public/images/';
    fs.mkdirSync(path, { recursive: true });
    cb(null, path)
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + path.extname(file.originalname))
  }
});
let upload = multer({ storage: storage });

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

router.route('/govt-job')
  .post(isValidUser, upload.single('image'), (req, res) => {
    const body = req.body;

    if (req.file != undefined) {
      body.image = config.pathImages + req.file.filename;
    } else {
      body.image = null;
    }

    const govtJob = new GovtJob(body);
    govtJob.save((err) => {
      if (err) return res.status(400).json(err);
      res.status(200).json({ message: 'Govt. Job successfully posted!', data: govtJob });
    })
  })
  .put(isValidUser, (req, res) => {
    const jobId = req.query.jobId;
    const update = req.body;

    if (req.file != undefined) {
      body.image = config.pathImages + req.file.filename;
    } else {
      body.image = null;
    }

    GovtJob.findByIdAndUpdate({ _id: jobId }, update).exec((err, job) => {
      if (err) return res.status(400).json(err);
      res.status(200).json({ message: 'Govt. Job successfully updated!', data: job });
    })
  })
  .delete(isValidUser, (req, res) => {
    const jobId = req.query.jobId;

    GovtJob.findByIdAndDelete({ _id: jobId }).exec((err) => {
      if (err) return res.status(400).json(err);
      res.status(200).json({ message: 'Govt. Job successfully deleted!' });
    })
  })

/// User
router.route('/user')
  .get(isValidUser, (req, res) => {
    User.find({}, { recruiter: 0, password: 0 })
      .populate('plan.currentPlan')
      .populate('plan.payment')
      .populate('provider.services')
      .sort({ createdAt: -1 })
      .exec((err, users) => {
        if (err) return res.status(400).json(err);
        res.status(200).json(users);
      })
  })
  .put(isValidUser, (req, res) => { })
  .delete(isValidUser, (req, res) => { });

/// Recruiter
router.route('/recruiter')
  .get(isValidUser, (req, res) => {
    Company.find()
      .populate({
        path: 'user',
        model: 'User',
        select: 'recruiter name email mobile photo gender',
        populate: [{
          path: 'recruiter.plan.currentPlan',
          model: 'Plan',
        }, {
          path: 'recruiter.plan.payment',
          model: 'Payment',
        }]
      })
      .sort({ createdAt: -1 })
      .exec((err, companies) => {
        if (err) return res.status(400).json(err);
        res.status(200).json(companies);
      })
  })

/// Local Hunar
router.put('/video', isValidUser, (req, res) => {
  const userId = req.query.id;
  const videoId = req.query.videoId;
  const status = req.body.status;

  const message = status == '1'
    ? 'Video successfully approved.'
    : 'Video successfully rejected!';

  User.findOneAndUpdate({
    _id: ObjectId(userId),
    'hunar.videos': { $elemMatch: { _id: ObjectId(videoId) } }
  },
    { $set: { "hunar.videos.$.status": status } },
    { upsert: true, new: true }, (err, _) => {
      if (err) return res.status(400).json(err);
      res.status(200).json({ message: message });
    });
});

/// Blogs
router.route('/blog')
  .get(isValidUser, (_, res) => {
    Blog.find({}, { content: 0 }).exec((err, blogs) => {
      if (err) return res.status(400).json(err);
      res.status(200).json(blogs);
    });
  })
  .post(isValidUser, (req, res) => {
    var body = req.body;
    body.postedBy = req.user._id;

    const blog = new Blog(body);
    blog.save((err) => {
      if (err) return res.status(400).json(err);
      res.status(200).json({ message: 'Blog successfully posted!' });
    });
  })
  .put(isValidUser, (req, res) => {

  })
  .delete(isValidUser, (req, res) => { })

function isValidUser(req, res, next) {
  if (req.isAuthenticated()) next();
  else return res.status(401).json({ message: 'Unauthorized' });
}

module.exports = router;