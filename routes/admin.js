const express = require('express');
const multer = require('multer');
const ObjectId = require('mongodb').ObjectID;
const Company = require('../models/company');
const User = require('../models/user').User;
const Job = require('../models/job');
const Plan = require('../models/plan');
const router = express.Router();

module.exports = router;