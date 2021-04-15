const express = require('express');
const multer = require('multer');
const ObjectId = require('mongodb').ObjectID;
const Company = require('../models/company');
const { User } = require('../models/user');
const Job = require('../models/job');
const Plan = require('../models/plan');
const router = express.Router();

router.get('/dashboard', isValidUser, (req, res) => {
  const role = req.user.role;
  User.find({}, filter).exec((err, user) => {
    if (err) return res.status(400).json(err);

    const response = {
      cm: {
        active: 0,
        inactive: 0
      },
      bc: {
        active: 0,
        inactive: 0
      },
      ba: 0,
      fse: 0,
      seeker: {
        login: 0,
        subscribed: 0
      },
      recruiter: {
        login: 0,
        subscribed: 0,
        resume: 0,
        jobBranding: {
          single: 0,
          multiple: 0
        }
      },
      customer: 0,
      provider: {
        login: 0,
        subscribed: 0,
      }
    }
  })
});

function isValidUser(req, res, next) {
  if (req.isAuthenticated()) next();
  else return res.status(401).json({ message: 'Unauthorized' });
}

module.exports = router;