const express = require('express');
const multer = require('multer');
const fs = require('fs');
const path = require('path')
const ObjectId = require('mongodb').ObjectID;
const config = require('../config/config');
const mailScript = require('../helper/mail-script');
const { Admin } = require('../models/admin');
const { Company } = require('../models/company');
const { User } = require('../models/user');
const { GovtJob } = require('../models/govt-job');
const { Payment } = require('../models/payment');
const { Job } = require('../models/job');
const { Blog } = require('../models/blog');
const { FSE } = require('../models/business/fse');
const Plan = require('../models/plan');
const mail = require('../helper/mail');
const states = require('../helper/states');
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

router.route('/token')
  .put(isValidUser, (req, res) => {
    const user = req.user;
    const body = req.body;

    Admin.findByIdAndUpdate({ _id: user._id },
      { fcmToken: body.token })
      .exec((err, _) => {
        if (err) return res.status(400).json(err);
        res.status(200).json({ message: 'Token successfully updated!' });
      })
  });

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
  .delete(isValidUser, (req, res) => {
    const userId = req.query.id;
    User.findByIdAndDelete({ _id: userId })
      .exec((err, _) => {
        if (err) return res.status(400).json(err);
        res.status(200).json({ message: 'User successfully deleted!' });
      });
  });

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

/// FSE
const fseUpload = upload.fields([
  { name: 'documents[aadharCard][aadharF]', maxCount: 1 },
  { name: 'documents[aadharCard][aadharB]', maxCount: 1 },
  { name: 'documents[panCard][image]', maxCount: 1 },
  { name: 'photo', maxCount: 1 }
]);
router.route('/fse')
  .get(isValidUser, (req, res) => {
    const userId = req.query.id;

    if (userId != undefined) {
      FSE.findById({ _id: userId }).exec((err, users) => {
        if (err) return res.status(400).json(err);
        res.status(200).json(users);
      });
    } else {
      FSE.find().exec((err, users) => {
        if (err) return res.status(400).json(err);
        res.status(200).json(users);
      });
    }
  })
  .post(fseUpload, isValidUser, (req, res) => {
    var body = req.body;

    const aadharF = req.files['documents[aadharCard][aadharF]'];
    const aadharB = req.files['documents[aadharCard][aadharB]'];
    const panCard = req.files['documents[panCard][image]'];
    const photo = req.files['photo'];

    if (aadharF != undefined && aadharB != undefined) {
      body.documents.aadharCard.aadharF = config.pathImages + aadharF[0].filename;
      body.documents.aadharCard.aadharB = config.pathImages + aadharB[0].filename;
    }

    if (panCard != undefined) {
      body.documents.panCard.image = config.pathImages + panCard[0].filename
    }

    if (photo != undefined) {
      body.photo = config.pathImages + photo[0].filename
    }

    if (body.password == undefined || body.password == '') {
      mail.passwordMail(req, body.firstName, body.email, 'fse');
    }

    const fse = new FSE(body);
    fse.save((err) => {
      if (err) return res.status(400).json(err);
      res.status(200).json({ message: 'FSE successfully registered!' })
    })
  })
  .put(isValidUser, async (req, res) => {
    const userId = req.query.id;
    const status = req.query.status;
    const state = req.body.state;

    var update = {};

    const currentDate = new Date();
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const day = currentDate.getDate();
    const nextDate = new Date(year + 5, month, day);

    const stateCode = states.getStateCodeByStateName(state);
    const code = await generatedCode('fse');

    if (status == 'approve') {
      update = {
        approved: true,
        updatedAt: currentDate,
        approvedDate: currentDate,
        expiryDate: nextDate,
        fseCode: `FSE${stateCode}${code}`,
        code: parseInt(code)
      }
    } else {
      update = req.body;
    }

    FSE.findByIdAndUpdate({ _id: userId }, update, { new: true })
      .exec((err, _) => {
        if (err) return res.status(400).json(err);

        if (status == 'approve') {
          const htmlMessage = mailScript.fseApprove(fse.firstName, fse.email, fse.fseCode);
          mail.sendMail(doc.email, doc.firstName, 'FSE Code', '', htmlMessage);
        }
        res.status(200).json({ message: 'FSE successfully updated!' });
      })
  })
  .delete(isValidUser, (req, res) => {
    const userId = req.query.id;
    FSE.findByIdAndDelete({ _id: userId })
      .exec((err, _) => {
        if (err) return res.status(400).json(err);
        res.status(200).json({ message: 'FSE successfully deleted!' });
      });
  });

/// Blogs
router.route('/blog')
  .get(isValidUser, (req, res) => {
    const blogId = req.query.id;

    const model = blogId != undefined ? Blog.findById({ _id: blogId }) : Blog.find({}, { content: 0 })

    model.exec((err, blogs) => {
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
  .delete(isValidUser, (req, res) => {
    const blogId = req.query.id;
    Blog.findByIdAndDelete({ _id: blogId })
      .exec((err, _) => {
        if (err) return res.status(400).json(err);
        res.status(200).json({ message: 'Blog successfully deleted!' });
      });
  })

function isValidUser(req, res, next) {
  if (req.isAuthenticated()) next();
  else return res.status(401).json({ message: 'Unauthorized' });
}

module.exports = router;