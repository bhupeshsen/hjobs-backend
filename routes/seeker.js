const express = require('express');
const multer = require('multer');
const pug = require('pug');
const puppeteer = require('puppeteer');
const ObjectId = require('mongodb').ObjectID;
const { User } = require('../models/user');
const { Job } = require('../models/job');
const CustomAlert = require('../models/custom-alert');
const { Company } = require('../models/company');
const { Conversation } = require('../models/conversation');
const { sendMail } = require('../helper/mail');
const { } = require('../helper/mail-script');
const router = express.Router();

const compiledFunction = pug.compileFile(__dirname + '/../views/resume.pug');

router.get('/dashboard', isValidUser, (req, res) => {
  const userId = req.user._id;
  const today = new Date();
  const newDate = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 0, 0, 0);

  User.findById({ _id: userId }).exec((err, user) => {
    if (err) return res.status(400).json(err);

    const appliedJobs = user.seeker.appliedJobs;
    const savedCompany = user.seeker.savedCompany;
    const savedJobs = user.seeker.savedJobs;

    Job.find({
      skills: { $in: user.seeker.skills },
      deadline: { $gte: newDate }
    }, { _id: 1 })
      .exec((err, rJobs) => {
        if (err) return res.status(400).json(err);
        const response = {
          applied: appliedJobs != null ? appliedJobs.length : 0,
          savedCompany: savedCompany != null ? savedCompany.length : 0,
          recommendedJobs: rJobs != null ? rJobs.length : 0,
          savedJobs: savedJobs != null ? savedJobs.length : 0
        }

        res.status(200).json(response);
      })
  });
});

// Update Profile
router.put('/profile', isValidUser, (req, res) => {
  const userId = req.user._id;
  var body = req.body;
  body["seeker.status"] = true;

  const options = { new: true, safe: true, upsert: true };

  User.findByIdAndUpdate({ _id: userId }, { $set: body }, options)
    .exec((err, user) => {
      if (err) return res.status(400).json(err);
      if (!user) return res.status(404).json({ message: 'User not found!' });
      res.status(200).json({ message: 'Profile successfully updated!', user: user });
    });
});

// Apply Job
router.put('/apply-job/:jobId', isValidUser, (req, res) => {
  const jobId = req.params.jobId;
  const userId = req.user._id;
  const scrQuest = req.body.scrQuest;

  const today = new Date();
  const newDate = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 0, 0, 0);

  const query = { _id: jobId, 'appliedBy.user': { $ne: ObjectId(userId) }, deadline: { $gte: newDate } };
  const update = { $addToSet: { appliedBy: { user: ObjectId(userId), scrQuest: scrQuest } } };
  const updateUser = { $addToSet: { 'seeker.appliedJobs': jobId } };

  Job.findOneAndUpdate(query, update)
    .populate('postedBy', 'name officialEmail')
    .exec(async (err, job) => {
      if (err) return res.status(400).json(err);
      if (!job) return res.status(404).json({ message: 'Job is expired or already applied!' });

      await User.findByIdAndUpdate({ _id: userId }, updateUser).exec();
      res.status(200).json({ message: 'Job is successfully applied!' });

      // send mail
      const htmlMessage = '';
      const subject = '';
      sendMail(job.postedBy.officialEmail, job.postedBy.name, subject, '', htmlMessage);
    });
});

// Applied Jobs
router.get('/applied-jobs', isValidUser, (req, res) => {
  const userId = req.user._id;
  const query = { 'appliedBy.user': ObjectId(userId) };
  const filter = { appliedBy: 0, hiredCandidates: 0, shortLists: 0 };

  Job.find(query, filter)
    .populate('postedBy', 'name photo')
    .sort({ createdAt: -1 })
    .exec((err, jobs) => {
      if (err) return res.status(400).json(err);
      res.status(200).json(jobs);
    })
});

// Saved Jobs
router.route('/saved-jobs')
  .get(isValidUser, (req, res) => {
    const userId = req.user._id;
    const filter = '-hiredCandidates -appliedBy -shortLists';

    User.findById({ _id: userId })
      .populate({
        path: 'seeker.savedJobs',
        select: filter,
        populate: {
          path: 'postedBy',
          select: 'name photo'
        }
      })
      .exec((err, user) => {
        if (err) return res.status(400).json(err);
        res.status(200).json(user.seeker.savedJobs);
      });
  })
  .put(isValidUser, (req, res) => {
    const userId = req.user._id;
    const jobId = req.body.jobId;

    const query = { _id: userId, 'seeker.savedJobs': { $nin: [ObjectId(jobId)] } };
    const update = { $addToSet: { 'seeker.savedJobs': ObjectId(jobId) } };
    const filter = {
      password: 0,
      passwordResetToken: 0,
      passwordResetExpires: 0,
      new: true
    };

    User.findOneAndUpdate(query, update, filter).exec((err, user) => {
      if (err) return res.status(400).json(err);
      if (!user) return res.status(404).json(
        { message: 'User not found or already saved this job.' });
      res.status(200).json(user);
    });
  });

// Saved Company
router.route('/saved-company')
  .get(isValidUser, (req, res) => {
    const userId = req.user._id;
    const filter = 'name logo';

    User.findById({ _id: userId })
      .populate('seeker.savedCompany', filter)
      .exec((err, user) => {
        if (err) return res.status(400).json(err);
        res.status(200).json(user.seeker.savedCompany);
      });
  })
  .put(isValidUser, (req, res) => {
    const userId = req.user._id;
    const companyId = req.body.companyId;

    const query = { _id: userId, 'seeker.savedCompany': { $nin: [ObjectId(companyId)] } };
    const update = { $addToSet: { 'seeker.savedCompany': ObjectId(companyId) } };
    const filter = {
      password: 0,
      passwordResetToken: 0,
      passwordResetExpires: 0,
      new: true
    };

    User.findOneAndUpdate(query, update, filter).exec((err, user) => {
      if (err) return res.status(400).json(err);
      if (!user) return res.status(404).json(
        { message: 'User not found or already saved this company.' });

      // send mail
      Company.findById({ _id: companyId }).exec((_, company) => {
        const htmlMessage = '';
        const subject = '';
        sendMail(company.officialEmail, company.name, subject, '', htmlMessage);
      })

      res.status(200).json(user);
    });

  });

// All Jobs       ==>  GET /seeker/job
// Company's Jobs ==>  GET /seeker/job?companyId=<Company Id>&skills=<Skills>
// View Job       ==>  GET /seeker/job?jobId=<Job Id>
router.get('/job', isValidUser, (req, res) => {
  const userId = req.user._id;
  const companyId = req.query.companyId;
  const jobId = req.query.jobId;
  const skills = req.query.skills;

  const query = jobId == undefined
    ? companyId != undefined
      ? { postedBy: companyId, skills: { $regex: '.*' + skills + '.*', $options: 'i' } } : {}
    : { _id: jobId };
  const filter = { hiredCandidates: 0, shortLists: 0, appliedBy: 0 };
  const filter1 = { projection: { hiredCandidates: 0, shortLists: 0 }, new: true };
  const update = { $inc: { views: 1 } };
  const model = jobId == undefined ? Job.find(query, filter) : Job.findByIdAndUpdate(query, update, filter1);
  const filter2 = jobId == undefined ? 'name logo' : 'name logo about perks gallery';

  model
    .populate({ path: 'appliedBy.user', match: userId, select: '_id' })
    .populate('postedBy', filter2)
    .sort({ createdAt: -1 })
    .exec((err, jobs) => {
      if (err) return res.status(401).json(err);
      if (jobId != undefined) {
        jobs.appliedBy = jobs.appliedBy.length > 0 ? jobs.appliedBy.find(m => m.user != null) : {};
      }
      res.status(200).json(jobs);
    });
});

// Recommended Jobs
router.get('/recommended-jobs', (req, res) => {
  const userId = req.user._id;

  const today = new Date();
  const newDate = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 0, 0, 0);

  const filter = { hiredCandidates: 0, appliedBy: 0, shortLists: 0 };

  User.findById({ _id: userId }, { 'seeker.skills': 1 }).exec((err, user) => {
    if (err) return res.status(400).json(err);
    if (!user) return res.status(200).json({ message: 'User not found!' });

    Job.find({
      skills: { $in: user.seeker.skills },
      deadline: { $gte: newDate }
    }, filter)
      .populate('postedBy', 'name logo')
      .exec((err, jobs) => {
        if (err) return res.status(400).json(err);
        res.status(200).json(jobs);
      });
  });
});

// Companies
router.get('/companies', isValidUser, (req, res) => {
  const query = req.query.q;
  const filter = { name: 1, officialEmail: 1, logo: 1 };

  if (query == null) {
    return res.status(400).json({ message: 'Company or Sector name missing!' });
  }

  Company.find({
    $or: [
      { name: { $regex: query, $options: 'i' } },
      { sector: { $regex: query, $options: 'i' } }
    ]
  }, filter, (err, companies) => {
    if (err) return res.status(400).json(err);
    res.status(200).json(companies);
  });
});

// Company Details
router.get('/company', isValidUser, (req, res) => {
  const companyId = req.query.companyId;

  Company.findById({ _id: companyId }, { user: 0 }).exec((err, company) => {
    if (err) return res.status(400).json(err);
    if (!company) return res.status(404).json({ message: 'Company not found!' });
    res.status(200).json(company);
  });
})

// Custom Alert
router.route('/custom-alert')
  .get(isValidUser, (req, res) => {
    const userId = req.user._id;

    CustomAlert.find({ postedBy: userId }, (err, alerts) => {
      if (err) return res.status(400).json(err);
      res.status(200).json(alerts);
    });
  })
  .post(isValidUser, (req, res) => {
    const body = req.body;

    const alert = new CustomAlert(body);
    saveData(alert, res);
  })
  .delete(isValidUser, (req, res) => {
    const alertId = req.query.alertId;

    CustomAlert.findByIdAndDelete({ _id: alertId }).exec((err, alert) => {
      if (err) return res.status(400).json(err);
      if (!alert) return res.status(400).json({ message: 'Alert not found!' });
      res.status(200).json({ message: 'Successfully deleted!' });
    });
  })

// Resume
router.route('/custom-resume')
  .get(isValidUser, (req, res) => {
    const userId = req.user._id;
  })
  .put(isValidUser, (req, res) => { });

async function saveData(data, res) {
  try {
    doc = await data.save();
    console.log(doc)
    return res.status(201).json({
      message: 'data successfully added!'
    });
  }
  catch (err) {
    console.log(err)
    return res.status(501).json(err);
  }
};

// Conversations
router.route('/conversations')
  .get(isValidUser, (req, res) => {
    const id = req.user._id;

    Conversation.find({ from: ObjectId(id) })
      .populate('from', 'name photo')
      .exec((err, conversations) => {
        if (err) return res.status(400).json(err);
        conversations = [...new Set(conversations.map(item => item.from))]
        res.status(200).json(conversations);
      })
  })

/**
 * GET /conversations/<Contact Person Id>
 * POST /conversations/<Contact Person Id>
 * @param {String} userId
 * {body: {message: 'Text Message'}}
 * */
router.route('/conversations/:userId')
  .get(isValidUser, (req, res) => {
    const self = req.user._id;
    const user = req.params.userId;

    Conversation.find({
      $or: [
        { 'to': ObjectId(self) }, { 'from': ObjectId(self) },
        { 'to': ObjectId(user) }, { 'from': ObjectId(user) }
      ]
    }).exec((err, conversations) => {
      if (err) return res.status(400).json(err);
      res.status(200).json(conversations);
    });
  })
  .post(isValidUser, (req, res) => {
    const from = req.user._id;
    const to = req.params.userId;
    const message = req.body.message;

    // functions.getData(body.from.userId, 'company').then(v => {
    //   var notification = {
    //     title: 'Message',
    //     body: `You have received a new message from ${v.name}`
    //   }

    //   // Send Notification To Job Seeker
    //   // fcmFunctions.sendNotificationToUser(body.to.userId, 'seeker', notification);
    // });

    var conversation = new Conversation({ to: to, from: from, message: message });
    conversation.save(function (err) {
      if (err) return res.status(400).json(err);
      res.status(400).json({ message: 'Message successfully sent!' });
    })
  });

function isValidUser(req, res, next) {
  if (req.isAuthenticated()) next();
  else return res.status(401).json({ message: 'Unauthorized' });
}

module.exports = router;