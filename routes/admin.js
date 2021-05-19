const express = require('express');
const multer = require('multer');
const fs = require('fs');
const path = require('path')
const jwt = require('jsonwebtoken');
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
const { Advisor } = require('../models/business/advisor');
const { BC, CM } = require('../models/business/business');
const Plan = require('../models/plan');
const mail = require('../helper/mail');
const states = require('../helper/states');
const router = express.Router();

// PRIVATE and PUBLIC key
const privateKEY = fs.readFileSync(__dirname + '/../config/jwt.key', 'utf8');
const issuer = 'admin.hindustaanjobs.com';        // Issuer
const audience = 'hindustaanjobs.com';            // Audience

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const userType = req.params.user;
    const path = `public/images/`;
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
  const today = new Date();
  const lastWeek = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

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
      $lookup: {
        from: CM.collection.name,
        let: {},
        pipeline: [{
          $project: {
            _id: 1,
            active: { $cond: [{ $gte: ['$expiryDate', new Date()] }, 1, 0] },
            pending: { $cond: [{ $eq: ['$approved', false] }, 1, 0] },
            sinceWeek: { $cond: [{ $lte: ['$createdAt', lastWeek] }, 1, 0] }
          }
        }],
        as: 'cms'
      }
    },
    {
      $lookup: {
        from: BC.collection.name,
        let: {},
        pipeline: [{
          $project: {
            _id: 1,
            active: { $cond: [{ $gte: ['$expiryDate', new Date()] }, 1, 0] },
            pending: { $cond: [{ $eq: ['$approved', false] }, 1, 0] },
            sinceWeek: { $cond: [{ $lte: ['$createdAt', lastWeek] }, 1, 0] }
          }
        }],
        as: 'bcs'
      }
    },
    {
      $lookup: {
        from: Advisor.collection.name,
        let: {},
        pipeline: [{ $project: { _id: 1 } }],
        as: 'advisors'
      }
    },
    {
      $lookup: {
        from: FSE.collection.name,
        let: {},
        pipeline: [{ $project: { _id: 1 } }],
        as: 'fses'
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
        business: {
          cm: {
            total: { $size: '$cms' },
            inactive: { $subtract: [{ $size: '$cms' }, { $sum: '$cms.active' }] },
            active: { $sum: '$cms.active' },
            pending: { $sum: '$cms.pending' },
            sinceWeek: { $sum: '$cms.sinceWeek' }
          },
          bc: {
            total: { $size: '$bcs' },
            inactive: { $subtract: [{ $size: '$bcs' }, { $sum: '$bcs.active' }] },
            active: { $sum: '$bcs.active' },
            pending: { $sum: '$bcs.pending' },
            sinceWeek: { $sum: '$bcs.sinceWeek' }
          },
          advisor: { $size: '$advisors' },
          fse: { $size: '$fses' },
        },
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
  .post(isValidUser, upload.single('photo'), (req, res) => {
    var body = req.body;

    if (req.file != undefined) {
      body.photo = config.pathImages + req.file.filename;
    }

    const JWTToken = jwt.sign({
      name: body.name,
      email: body.email,
      addedByCode: body.addedByCode
    }, privateKEY, {
      issuer: issuer, audience: audience,
      algorithm: 'RS256', expiresIn: '24h'
    });

    const today = new Date()
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)

    body.referralCode = generateReferralCode()
    body.passwordResetToken = JWTToken;
    body.passwordResetExpires = tomorrow;

    const user = new User(body);
    user.save((err) => {
      if (err) return res.status(400).json(err);
      res.status(200).json({ message: 'User successfully registered.' })
    });
  })
  .put(isValidUser, (req, res) => {
    const id = req.query.id;
    const body = req.body;

    User.findByIdAndUpdate({ _id: id }, body, { new: true }, (err, doc) => {
      if (err) return res.status(400).json({ message: 'Bad Request', error: err });
      res.status(200).json({ message: 'Profile successfully updated!', user: doc });
    });
  })
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

/// Business Partner
/// user => cm, bc, ba, fse
const businessUpload = upload.fields([
  { name: 'documents[aadharCard][aadharF]', maxCount: 1 },
  { name: 'documents[aadharCard][aadharB]', maxCount: 1 },
  { name: 'documents[panCard][image]', maxCount: 1 },
  { name: 'documents[residentialProof][proofImage]', maxCount: 1 },
  { name: 'documents[bank][passbook]', maxCount: 1 },
  { name: 'photo', maxCount: 1 }
]);
router.route('/business/:user')
  .get(isValidUser, (req, res) => {
    const user = req.params.user;
    const userId = req.query.id;

    const model = user == 'fse' ? FSE
      : user == 'ba' ? Advisor : user == 'bc' ? BC
        : user == 'cm' ? CM : null;

    if (userId != undefined) {
      model.findById({ _id: userId }).exec((err, users) => {
        if (err) return res.status(400).json(err);
        res.status(200).json(users);
      });
    } else {
      model.find().exec((err, users) => {
        if (err) return res.status(400).json(err);
        res.status(200).json(users);
      });
    }
  })
  .post(isValidUser, businessUpload, (req, res) => {
    const user = req.params.user;
    var body = req.body;

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

    const name = user == 'bc' ? body.name : body.firstName;
    if (body.password == undefined || body.password == '') {
      mail.passwordMail(req, name, body.email, user);
    }

    const model = user == 'fse' ? FSE
      : user == 'ba' ? Advisor : user == 'bc' ? BC
        : user == 'cm' ? CM : null;

    const data = new model(body);
    data.save((err) => {
      if (err) return res.status(400).json(err);
      res.status(200).json({ message: 'Successfully registered!' })
    })
  })
  .put(isValidUser, businessUpload, async (req, res) => {
    const user = req.params.user;
    const userId = req.query.id;
    const status = req.query.status;

    var update = {};

    const aadharF = req.files['documents[aadharCard][aadharF]'];
    const aadharB = req.files['documents[aadharCard][aadharB]'];
    const panCard = req.files['documents[panCard][image]'];
    const residential = req.files['documents[residentialProof][proofImage]'];
    const bank = req.files['documents[bank][passbook]'];
    const photo = req.files['photo'];

    if (aadharF != undefined && aadharB != undefined) {
      update.documents.aadharCard = {};
      update.documents.aadharCard.aadharF = config.pathImages + aadharF[0].filename;
      update.documents.aadharCard.aadharB = config.pathImages + aadharB[0].filename;
    }

    if (panCard != undefined) {
      update.documents.panCard = {};
      update.documents.panCard.image = config.pathImages + panCard[0].filename;
    }

    if (residential != undefined) {
      update.documents.residentialProof = {};
      update.documents.residentialProof.proofImage = config.pathImages + residential[0].filename;
    }

    if (bank != undefined) {
      update.documents.bank = {};
      update.documents.bank.passbook = config.pathImages + bank[0].filename;
    }

    if (photo != undefined) {
      update.photo = config.pathImages + photo[0].filename
    }

    const currentDate = new Date();
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const day = currentDate.getDate();
    const nextDate = new Date(year + 5, month, day);

    if (status == 'approve') {
      const state = req.body.state;
      const stateCode = states.getStateCodeByStateName(state);
      const code = await generatedCode('fse');

      update = {
        approved: true,
        updatedAt: currentDate,
        approvedDate: currentDate,
        expiryDate: nextDate,
        code: parseInt(code)
      }
      const codeType = user == 'fse' ? 'FSE' : user == 'ba' ? 'AD' : user == 'bc' ? 'BC' : null;
      update[`${user}Code`] = `${codeType}${stateCode}${code}`;
    } else {
      update = req.body;
    }

    const model = user == 'fse' ? FSE
      : user == 'ba' ? Advisor : user == 'bc' ? BC
        : user == 'cm' ? CM : null;

    model.findByIdAndUpdate({ _id: userId }, update, { new: true })
      .exec((err, fse) => {
        if (err) return res.status(400).json(err);

        if (status == 'approve') {
          const htmlMessage = user == 'fse' ? mailScript.fseApprove(fse.firstName, fse.email, fse.fseCode)
            : '';
          const name = user == 'fse' ? doc.firstName : doc.name;
          mail.sendMail(doc.email, name, `${user.toLocaleUpperCase()} Code`, '', htmlMessage);
        }
        res.status(200).json({ message: 'Successfully updated!', data: fse });
      })
  })
  .delete(isValidUser, (req, res) => {
    const user = req.params.user;
    const userId = req.query.id;

    const model = user == 'fse' ? FSE
      : user == 'ba' ? Advisor : user == 'bc' ? BC
        : user == 'cm' ? CM : null;

    model.findByIdAndDelete({ _id: userId })
      .exec((err, _) => {
        if (err) return res.status(400).json(err);
        res.status(200).json({ message: 'Successfully deleted!' });
      });
  });

/// Business Dashboard
// router.get('/business/dashboard');

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

// Generate BC Code     {MP0001}
// Generate BA Code     {ADMP0001}
const generatedCode = async (type) => {
  var model = type == 'bc' ? BC : type == 'ba' ? Advisor : FSE;
  var bc = await model.findOne().sort({ code: -1 }).exec();
  var _code = bc.code == undefined ? 0 : bc.code;
  var len = 5 - ('' + parseInt(_code) + 1).length;
  var code = (len > 0 ? new Array(++len).join('0') : '') + (parseInt(_code) + 1);
  return code;
};

function generateReferralCode() {
  const alpha = 'abcdefghijklmnopqrstuvwxyz0123456789'
  var code = '';

  for (var i = 0; i < 6; i++) {
    code += alpha.charAt(Math.floor(Math.random() * alpha.length))
  }
  code = `${code.toUpperCase()}`
  return code;
};

function isValidUser(req, res, next) {
  if (req.isAuthenticated()) next();
  else return res.status(401).json({ message: 'Unauthorized' });
}

module.exports = router;