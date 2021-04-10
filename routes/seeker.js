const express = require('express');
const multer = require('multer');
const pug = require('pug');
const puppeteer = require('puppeteer');
const ObjectId = require('mongodb').ObjectID;
const User = require('../models/user');
const Job = require('../models/job');
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
      res.status(200).json(jobs);
    });
});

// Company's jobs
router.get('/jobs/:companyId', isValidUser, (req, res) => {
  const companyId = req.params.companyId;
  const skills = req.query.skills;

  const query = { postedBy: companyId, skills: { $regex: '.*' + skills + '.*', $options: 'i' } }

  Job.find(query).exec((err, jobs) => {
    if (err) return res.status(400).json(err);
    res.status(200).json(jobs);
  });
});

function isValidUser(req, res, next) {
  if (req.isAuthenticated()) next();
  else return res.status(401).json({ message: 'Unauthorized' });
}

module.exports = router;