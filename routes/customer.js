const express = require('express');
const multer = require('multer');
const ObjectId = require('mongodb').ObjectID;
const User = require('../models/user').User;
const router = express.Router();

router.get('/search', isValidUser, (req, res) => {
  const userId = req.user._id;
  const search = req.query.q;

  const query = {
    _id: { $ne: userId },
    'provider.services': { $regex: '^' + search + '$', $options: 'i' }
  };
  const filter = {
    'provider.services': 1, name: 1, 'provider.disability': 1,
    address: 1, 'provider.experience': 1, photo: 1
  };

  User.find(query, filter).exec((err, providers) => {
    if (err) return res.status(400).json(err);
    res.status(200).json(providers);
  });
});

router.get('/providers', isValidUser, (req, res) => {

});

function isValidUser(req, res, next) {
  if (req.isAuthenticated()) next();
  else return res.status(401).json({ message: 'Unauthorized' });
}

module.exports = router;