const express = require('express');
const multer = require('multer');
const user = require('../models/user');
const router = express.Router();

router.get('/dashboard', isValidUser, (req, res) => {
  const id = req.user._id;
  const today = new Date();
  const newDate = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 0, 0, 0);


})

function isValidUser(req, res, next) {
  if (req.isAuthenticated()) next();
  else return res.status(401).json({ message: 'Unauthorized' });
}

module.exports = router;