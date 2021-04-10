const express = require('express');
const multer = require('multer');
const ObjectId = require('mongodb').ObjectID;
const Company = require('../models/company');
const User = require('../models/user');
const Job = require('../models/job');
const Plan = require('../models/plan');
const Notification = require('../models/notification');
const router = express.Router();

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'public/images/company');
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});

let upload = multer({ storage: storage });

router.route('/company')
  .post(upload.single('logo'), isValidUser, (req, res) => {
    const body = req.body;
    body.user = ObjectId(req.user._id);

    if (req.file != undefined) {
      body.logo = '/images/company/' + req.file.filename;
    }

    const data = new Company(body);
    saveCompany(data, res);
  })
  .put(upload.single('logo'), isValidUser, (req, res) => {
    const companyId = req.query.companyId;
    const body = req.body;

    if (req.file != undefined) {
      body.logo = '/images/company/' + req.file.filename;
    }

    var notification = {
      title: 'Alert',
      body: 'Your profile has been updated.'
    }

    Company.findByIdAndUpdate({ _id: companyId }, body).exec((err, doc) => {
      if (err) return res.status(400).json(err);
      if (!doc) return res.status(404).json({ message: 'Company not found!' });
      res.status(200).json(doc);
    })
  });

// POST   /recruiter/job
// GET    /recruiter/job?companyId=<Company Id>
// GET    /recruiter/job?companyId=<Company Id>&jobId=<Job Id>
// PUT    /recruiter/job?jobId=<Job Id>
// DELETE /recruiter/job?jobId=<Job Id>
router.route('/job')
  .post(isValidUser, (req, res) => {
    const body = req.body;
    const currentPlan = body.currentPlan;

    const currentDate = new Date();
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const day = currentDate.getDate();

    Plan.findById({ _id: ObjectId(currentPlan) }, (err, doc) => {
      if (err) return res.status(400).json(err);
      if (!doc) return res.status(404).json({ message: 'Plan not found!' });

      const multiState = doc.boost.multiState;
      const days = doc.boost.days;

      body.boost = {};
      body.boost.expiryDate = new Date(year, month, day + days);
      body.boost.multiState = multiState;

      saveJobPost(body, res);
    });
  })
  .get(isValidUser, (req, res) => {
    const jobId = req.query.jobId;
    const companyId = req.query.companyId;
    const query = jobId != null
      ? Job.findById({ _id: jobId, postedBy: companyId })
      : Job.find({ postedBy: companyId });

    query.populate('appliedBy.user', 'name email photo')
      .exec((err, doc) => {
        if (err) return res.status(400).json(err);
        if (!doc) return res.status(404).json({ message: 'Job not found!' });
        res.status(200).json(doc);
      });
  })
  .put(isValidUser, (req, res) => {
    const jobId = req.query.jobId;
    const body = req.body;

    Job.findByIdAndUpdate({ _id: jobId }, body, (err, doc) => {
      if (err) return res.status(400).json(err);
      if (!doc) return res.status(404).json({ message: 'Job not found!' });
      res.status(200).json({ message: 'Successfully updated!' });
    });
  })
  .delete(isValidUser, (req, res) => {
    const jobId = req.query.jobId;
    Job.findByIdAndDelete({ _id: jobId }, (err, doc) => {
      if (err) return res.status(400).json(err);
      if (!doc) return res.status(404).json({ message: 'Job not found!' });
      res.status(200).json({ message: 'Successfully deleted!' })
    });
  });

// GET /recruiter/dashboard
router.get('/dashboard', isValidUser, (req, res) => {
  const companyId = req.query.companyId;

  const aggregate = Job.aggregate([
    { $match: { postedBy: ObjectId(companyId) } },
    { $sort: { createdAt: -1 } },
    { $unwind: { path: '$appliedBy', preserveNullAndEmptyArrays: true } },
    { $unwind: { path: '$hiredCandidates', preserveNullAndEmptyArrays: true } },
    { $unwind: { path: '$shortLists', preserveNullAndEmptyArrays: true } },
    {
      $group: {
        _id: null,
        totalJobs: { $addToSet: '$_id' },
        hiredCandidates: { $addToSet: '$hiredCandidates' },
        appliedBy: { $addToSet: '$appliedBy.user' },
        shortLists: { $addToSet: '$shortLists' },
        latestJob: { $first: '$$ROOT' }
      }
    },
    {
      $project: {
        _id: 0,
        latestJob: 1,
        totalJobs: { $cond: { if: { $isArray: "$totalJobs" }, then: { $size: "$totalJobs" }, else: 0 } },
        totalHired: { $cond: { if: { $isArray: "$hiredCandidates" }, then: { $size: "$hiredCandidates" }, else: 0 } },
        totalApplied: { $cond: { if: { $isArray: "$appliedBy" }, then: { $size: "$appliedBy" }, else: 0 } },
        totalShortList: { $cond: { if: { $isArray: "$shortLists" }, then: { $size: "$shortLists" }, else: 0 } }
      }
    }
  ]);

  aggregate.exec((err, results) => {
    if (err) return res.status(400).json(err);
    res.status(200).json(results);
  });
});

// Applied Candidates
router.get('/applied', isValidUser, (req, res) => {
  const companyId = req.query.companyId;
  const query = { postedBy: ObjectId(companyId) };
  const filter = { appliedBy: 1, title: 1, designation: 1, location: 1 };

  Job.find(query, filter)
    .populate('appliedBy')
    .populate('appliedBy.user', 'name email photo')
    .exec((err, jobs) => {
      if (err) return res.status(400).json(err);
      res.status(200).json(jobs);
    });
});

// Hired Candidates
router.route('/hire')
  .get(isValidUser, (req, res) => {
    const companyId = req.query.companyId;
    const query = {
      postedBy: ObjectId(companyId),
      hiredCandidates: { $exists: true, $ne: [], $not: { $size: 0 } }
    };
    const filter = { hiredCandidates: 1, title: 1, designation: 1, location: 1 };

    Job.find(query, filter)
      .populate('hiredCandidates', 'name email photo')
      .exec((err, jobs) => {
        if (err) return res.status(400).json(err);
        res.status(200).json(jobs);
      });
  })
  .put(isValidUser, (req, res) => {
    const jobId = req.query.jobId;
    const userId = req.body.userId;

    const query = { _id: ObjectId(jobId), 'appliedBy.user': userId };
    const update = { $addToSet: { hiredCandidates: ObjectId(userId) }, 'appliedById.$.status': 5 };
    const response = { message: 'Successfully hired.', user: userId };

    Job.findByIdAndUpdate(query, update, { new: true }).exec((err, job) => {
      if (err) return res.status(400).json(err);
      if (!job) return res.status(404).json({ message: 'Job not found!' });
      res.status(200).json(job);
    })
  });

router.get('/view-profile/:userId', isValidUser, (req, res) => {
  const userId = req.params.userId;
  const status = req.query.status;
  const filter = {};

  User.findById({ _id: userId }, filter).exec((err, user) => {
    if (err) return res.status(400).json(err);
    if (!user) return res.status(404).json({ message: 'User not Found!' });
    res.status(200).json(user);
  });
});

function isValidUser(req, res, next) {
  if (req.isAuthenticated()) next();
  else return res.status(401).json({ message: 'Unauthorized' });
}

async function saveCompany(data, res) {
  try {
    doc = await data.save();

    const update = { $push: { 'recruiter.company': ObjectId(doc._id) } };
    await User.findByIdAndUpdate({ _id: doc.user }, update)
      .populate('recruiter.company').exec((err, user) => {
        if (err) return res.status(400).json(err);
        if (!user) return res.status(404).json({ message: 'Profile not found!' });
        return res.status(201).json({ message: 'Data successfully saved!', user: user });
      });
    res.status(501).json({ message: 'Data not saved!' });
  }
  catch (err) {
    console.log(err);
    return res.status(400).json(err);
  }
};

async function saveJobPost(body, res) {
  try {
    var job = new Job(body);
    doc = await job.save();

    // sendNotification(body);

    return res.status(201).json({
      message: 'Job successfully posted!'
    });
  }
  catch (err) {
    console.log(err)
    return res.status(501).json(err);
  }
};

async function sendNotification1(body) {
  var notification0 = {
    title: 'Alert',
    body: 'New jobs found according your job alert.'
  }

  var notification1 = {
    title: 'Alert',
    body: 'New jobs found according your saved jobs.'
  }

  var notification2 = {
    title: 'Alert',
    body: 'New jobs found according your saved companies.'
  }

  var notification3 = {
    title: 'Alert',
    body: 'We found a job matching your skills..'
  }

  var notification4 = {
    title: 'Alert',
    body: 'New jobs found according your preferred work location.'
  }

  Promise.all([
    CustomAlert.aggregate([
      {
        $match: {
          $and: [
            { skills: { $in: body.skills } },
            { designation: body.designation },
            { location: body.location },
            { experience: body.experience },
            { salary: body.salary },
          ]
        }
      },
      { $group: { _id: null, users: { $addToSet: '$postedById' } } },
    ]).then(results => results.length > 0 ? results[0].users.map(function (item) { return ObjectId(item) }) : []),

    JobPost.aggregate([
      {
        $match: {
          $and: [
            { skills: { $in: body.skills } },
            { designation: body.designation },
          ]
        }
      },
      {
        $lookup: {
          from: JobSeeker.collection.name,
          localField: '_id',
          foreignField: 'savedJobs',
          as: 'seeker'
        }
      },
      { $unwind: { path: '$seeker', preserveNullAndEmptyArrays: true } },
      { $group: { _id: null, users: { $addToSet: '$seeker._id' } } },
      { $project: { _id: 0, users: 1 } }
    ]).then(results => results.length > 0 ? results[0].users.map(function (item) { return ObjectId(item) }) : []),

    // According saved company
    JobSeeker.aggregate([
      { $match: { savedCompany: { $in: [ObjectId(body.postedById)] } } },
      { $group: { _id: null, users: { $addToSet: '$_id' } } },
      { $project: { _id: 0, users: 1 } }
    ]).then(results => results.length > 0 ? results[0].users.map(function (item) { return ObjectId(item) }) : []),

    // According skills, preferred location
    JobSeeker.aggregate([
      { $match: { skills: { $in: body.skills } } },
      { $group: { _id: null, users: { $addToSet: '$_id' } } },
      { $project: { _id: 0, users: 1 } }
    ]).then(results => results.length > 0 ? results[0].users.map(function (item) { return ObjectId(item) }) : []),

    JobSeeker.aggregate([
      { $match: { prefWorkLocation: body.location } },
      { $group: { _id: null, users: { $addToSet: '$_id' } } },
      { $project: { _id: 0, users: 1 } }
    ]).then(results => results.length > 0 ? results[0].users.map(function (item) { return ObjectId(item) }) : []),

  ]).then(data => {
    var notifyData = [];
    if (data[0].length > 0) {

      data[0].forEach(elm => {
        notifyData.push({
          userId: elm,
          userType: 'seeker',
          notifications: notification0
        });
      });

      fcmFunctions.sendNotificationToMultiUser(data[0], 'seeker', notification0);
    }
    if (data[1].length > 0) {

      data[1].forEach(elm => {
        notifyData.push({
          userId: elm,
          userType: 'seeker',
          notifications: notification1
        });
      });

      fcmFunctions.sendNotificationToMultiUser(data[1], 'seeker', notification1);
    }
    if (data[2].length > 0) {

      data[2].forEach(elm => {
        notifyData.push({
          userId: elm,
          userType: 'seeker',
          notifications: notification2
        });
      });

      fcmFunctions.sendNotificationToMultiUser(data[2], 'seeker', notification2);
    }
    if (data[3].length > 0) {

      data[3].forEach(elm => {
        notifyData.push({
          userId: elm,
          userType: 'seeker',
          notifications: notification3
        });
      });

      fcmFunctions.sendNotificationToMultiUser(data[3], 'seeker', notification3);
    }
    if (data[4].length > 0) {

      data[4].forEach(elm => {
        notifyData.push({
          userId: elm,
          userType: 'seeker',
          notifications: notification4
        });
      });

      fcmFunctions.sendNotificationToMultiUser(data[4], 'seeker', notification4);
    }

    Notification.insertMany(notifyData).exec();

  }).catch(error => {
    console.error(error);
  });
}

async function sendNotification(isMultiply, user, type, message) {
  try {
    if (isMultiply) {
      await Notification.insertMany(notification).exec((err) => {
        if (err) return console.log(err);
      });
    } else {
      const data = new Notification(notification);
    }
  }
  catch (err) { return console.log(err); }
}

module.exports = router;