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
const { Feedback } = require('../models/feedback');
const Plan = require('../models/plan');
const mail = require('../helper/mail');
const states = require('../helper/states');
const router = express.Router();

// PRIVATE and PUBLIC key
const privateKEY = fs.readFileSync(__dirname + '/../config/jwt.key', 'utf8');
const issuer = 'admin.hindustaanjobs.com';        // Issuer
const audience = 'hindustaanjobs.com';            // Audience

const imagePath = 'public/images/';
const recruiterPath = 'public/images/company/';

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    fs.mkdirSync(imagePath, { recursive: true });
    fs.mkdirSync(recruiterPath, { recursive: true });

    if (file.fieldname === 'company[logo]') {
      cb(null, recruiterPath);
    } else {
      cb(null, imagePath)
    }
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
  const time = req.query.time;

  const today = new Date();
  var lastDay = new Date(today.getFullYear(), today.getMonth(), today.getDate() - 1);
  var lastWeek = new Date(today.getFullYear(), today.getMonth(), today.getDate() - 7);
  var lastMonth = new Date(today.getFullYear(), today.getMonth() - 1, today.getDate());
  var lastYear = new Date(today.getFullYear() - 1, today.getMonth(), today.getDate());

  const filterDate = time == 'Today' ? lastDay
    : time == 'Week' ? lastWeek : time == 'Month' ? lastMonth
      : time == 'Year' ? lastYear : undefined;

  User.aggregate([
    {
      $facet: {
        _seeker: [
          { $match: { 'seeker.status': true } },
          {
            $project: {
              subscribed: { $cond: [{ $gte: ['$plan.expiryDate', new Date()] }, 1, 0] },
              last: { $cond: [{ $gte: ['$createdAt', filterDate] }, 1, 0] }
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
          subscribed: { $sum: '$_seeker.subscribed' },
          last: { $sum: '$_seeker.last' }
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

/// Govt. Jobs
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

/// Private Jobs
router.route('/job')
  .get(isValidUser, (_, res) => {
    const filter = 'name logo officialEmail phone address'
    Job.find().populate('postedBy', filter)
      .sort({ createdAt: -1 })
      .exec((err, jobs) => {
        if (err) return res.status(400).json(err);
        res.status(200).json(jobs);
      });
  })
  .delete(isValidUser, (req, res) => {
    const jobId = req.query.id;
    Job.findByIdAndDelete({ _id: jobId })
      .exec((err, _) => {
        if (err) return res.status(400).json(err);
        res.status(200).json({ message: 'Job successfully deleted!' });
      });
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

router.put('/photo', upload.single('photo'), (req, res) => {
  const id = req.query.id;
  var update = {};

  console.log(req.file)

  if (req.file != undefined) {
    update.photo = config.pathImages + req.file.filename;
  }

  User.findByIdAndUpdate({ _id: id }, update, { new: true }, (err, doc) => {
    if (err) return res.status(400).json({ message: 'Bad Request', error: err });
    res.status(200).json({ message: 'Photo successfully updated!', user: doc });
  });
})

/// Recruiter
const recUpload = upload.fields([
  { name: 'user[photo]', maxCount: 1 },
  { name: 'company[logo]', maxCount: 1 }
]);
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
  .post(isValidUser, recUpload, (req, res) => {
    const body = req.body;

    const photo = req.files['user[photo]'];
    const logo = req.files['company[logo]'];

    if (photo != undefined && logo != undefined) {
      body.user.photo = config.pathImages + photo[0].filename;
      body.company.logo = config.pathCompany + logo[0].filename;
    }

    const user = new User(body.user);
    user.save((err) => {
      if (err) return res.status(400).json(err);
      body.company.user = ObjectId(user._id);

      const company = new Company(body.company);
      company.save((err) => {
        if (err) return res.status(400).json(err);
        res.status(200).json({ message: 'Recruiter successfully added!' });
      })
    })
  });

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
    const date = new Date();
    const firstDay = new Date(date.getFullYear(), date.getMonth(), 1);
    const lastDay = new Date(date.getFullYear(), date.getMonth() + 1, 0);
    const startYear = new Date(date.getFullYear(), 0, 1);
    const endYear = new Date(date.getFullYear(), 12, 0);

    const model = user == 'fse' ? FSE
      : user == 'ba' ? Advisor : user == 'bc' ? BC
        : user == 'cm' ? CM : null;

    if (userId != undefined) {
      model.findById({ _id: userId }).exec((err, users) => {
        if (err) return res.status(400).json(err);
        res.status(200).json(users);
      });
    } else {
      const code = `$${user}Code`;
      model.aggregate([
        {
          $lookup: {
            from: Payment.collection.name,
            let: { code: code },
            pipeline: [
              { $match: { $expr: { $eq: ['$bcCode', '$$code'] } } },
              {
                $project: {
                  month: {
                    $cond: [{
                      $and: [
                        { $lte: ["$createdAt", lastDay] },
                        { $gte: ["$createdAt", firstDay] }
                      ]
                    }, '$amount', 0]
                  },
                  year: {
                    $cond: [{
                      $and: [
                        { $lte: ["$createdAt", endYear] },
                        { $gte: ["$createdAt", startYear] }
                      ]
                    }, '$amount', 0]
                  }
                }
              }
            ],
            as: 'payments'
          }
        },
        {
          $addFields: {
            earning: {
              month: { $sum: '$payments.month' },
              year: { $sum: '$payments.year' }
            }
          }
        },
        { $project: { payments: 0 } }
      ]).exec((err, users) => {
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
      const token = jwt.sign({
        name: name,
        email: body.email,
        userType: user
      }, privateKEY, {
        issuer: issuer, audience: audience,
        algorithm: 'RS256', expiresIn: '24h'
      });

      body.passwordResetToken = token;
    }

    const model = user == 'fse' ? FSE
      : user == 'ba' ? Advisor : user == 'bc' ? BC
        : user == 'cm' ? CM : null;

    const data = new model(body);
    data.save((err) => {
      if (err) return res.status(400).json(err);
      res.status(200).json({ message: 'Successfully registered!' });

      // Send Email
      if (body.password == undefined || body.password == '') {
        const baseUrl = `${req.protocol}://${req.get('host')}`;
        const htmlMessage = mailScript.businessPartnerPassword(baseUrl, user.name, email, token);
        mail.sendMail(email, user.name, 'Create new password', '', htmlMessage);
      }
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

/// Resume
router.get('/resume', isValidUser, (req, res) => {
  const query = { 'seeker.status': true, documents: { $elemMatch: { type: 'Resume' } } };
  const filter = 'photo name mobile documents seeker.iAm seeker.prefWorkLocation seeker.desiredSalary';

  User.find(query, filter)
    .exec((err, users) => {
      if (err) return res.status(400).json(err);
      res.status(200).json(users);
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
  .post(isValidUser, upload.single('thumbnail'), (req, res) => {
    var body = req.body;
    body.postedBy = req.user._id;

    console.log(req.file);

    if (req.file != undefined) {
      body.thumbnail = config.pathImages + req.file.filename;
    }

    const blog = new Blog(body);
    blog.save((err) => {
      if (err) return res.status(400).json(err);
      res.status(200).json({ message: 'Blog successfully posted!' });
    });
  })
  .put(isValidUser, multer().array(), (req, res) => {
    const id = req.query.id;
    const body = req.body;

    // if (req.file != undefined) {
    //   body.thumbnail = config.pathImages + req.file.filename;
    // }

    Blog.findByIdAndUpdate({ _id: id }, body).exec((err, _) => {
      if (err) return res.status(400).json(err);
      res.status(200).json({ message: 'Blog successfully updated!' });
    });
  })
  .delete(isValidUser, (req, res) => {
    const blogId = req.query.id;
    Blog.findByIdAndDelete({ _id: blogId })
      .exec((err, _) => {
        if (err) return res.status(400).json(err);
        res.status(200).json({ message: 'Blog successfully deleted!' });
      });
  })

/// Feedback
router.route('/feedback')
  .get(isValidUser, (_, res) => {
    Feedback.find().exec((err, feedbacks) => {
      if (err) return res.status(400).json(err);
      res.status(200).json(feedbacks);
    });
  })
  .post(isValidUser, (req, res) => {

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