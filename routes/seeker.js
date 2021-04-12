const express = require('express');
const multer = require('multer');
const pug = require('pug');
const puppeteer = require('puppeteer');
const ObjectId = require('mongodb').ObjectID;
const User = require('../models/user');
const Job = require('../models/job');
const CustomAlert = require('../models/custom-alert');
const router = express.Router();

const compiledFunction = pug.compileFile(__dirname + '/../views/resume.pug');

router.get('/dashboard', isValidUser, (req, res) => {
  const id = req.user._id;
  const today = new Date();
  const newDate = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 0, 0, 0);


})

// Apply Job
router.put('/apply-job/:jobId', isValidUser, (req, res) => {
  const jobId = req.params.jobId;
  const userId = req.user._id;

  const today = new Date();
  const newDate = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 0, 0, 0);

  const query = { _id: jobId, 'appliedBy.user': { $ne: ObjectId(userId) }, deadline: { $gte: newDate } };
  const update = { _id: jobId, 'appliedBy.user': { $ne: ObjectId(userId) } };

  Job.findOneAndUpdate(query)
    .populate('postedBy', 'name')
    .exec((err, jobs) => {
      if (err) return res.status(400).json(err);
      if (!hob) return res.status(404).json({ message: 'Job is expired!' })
      res.status(200).json(jobs);
    });
});

// Applied Jobs
router.get('/applied-jobs', isValidUser, (req, res) => {
  const userId = req.user._id;
  const query = { 'appliedBy.user': ObjectId(userId) };
  const filter = { appliedById: 0, hiredCandidates: 0 };

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
      .populate('seeker.savedJobs', filter)
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
      res.status(200).json(user);
    });

  });

// Company's jobs
router.get('/jobs', isValidUser, (req, res) => {
  const companyId = req.query.companyId;
  const skills = req.query.skills;

  const query = { postedBy: companyId, skills: { $regex: '.*' + skills + '.*', $options: 'i' } }

  Job.find(query).exec((err, jobs) => {
    if (err) return res.status(400).json(err);
    res.status(200).json(jobs);
  });
});

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

function isValidUser(req, res, next) {
  if (req.isAuthenticated()) next();
  else return res.status(401).json({ message: 'Unauthorized' });
}

module.exports = router;