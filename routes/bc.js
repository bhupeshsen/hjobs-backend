const express = require('express');
const ObjectId = require('mongodb').ObjectID;
const router = express.Router();

function isValidUser(req, res, next) {
  if (req.isAuthenticated()) next();
  else return res.status(401).json({ message: 'Unauthorized' });
}

module.exports = router;