const express = require('express');
const multer = require('multer');
const ObjectId = require('mongodb').ObjectID;
const User = require('../models/user');
const router = express.Router();

// GET /provider/service
// POST /provider/service {categoryName:'A', serviceName: 'B', price: 0}
// DELETE /provider/service?serviceId=123
router.route('/service')
  .get(isValidUser, (req, res) => {
    const userId = req.user._id;

    User.findById({ _id: userId }, { provider: 1 })
      .exec((err, user) => {
        if (err) return res.status(400).json(err);

        const services = user.provider != null ? user.provider.services : [];
        res.status(200).json(services);
      });
  })
  .post(isValidUser, (req, res) => {
    const userId = req.user._id;
    const service = req.body;

    const update = { $addToSet: { 'provider.services': service } };
    const options = { upsert: true, new: true };

    User.findByIdAndUpdate({ _id: userId }, update)
      .exec((err, _) => {
        if (err) return res.status(400).json(err);
        res.status(200).json({ message: 'Service successfully added!' });
      });
  })
  .delete(isValidUser, (req, res) => {
    const userId = req.user._id;
    const serviceId = req.query.serviceId;

    const update = { $pull: { 'provider.services': { _id: ObjectId(serviceId) } } };
    const options = { upsert: true, new: true };

    User.findByIdAndUpdate({ _id: userId }, update)
      .exec((err, _) => {
        if (err) return res.status(400).json(err);
        res.status(200).json({ message: 'Service successfully deleted!' });
      });
  });

function isValidUser(req, res, next) {
  if (req.isAuthenticated()) next();
  else return res.status(401).json({ message: 'Unauthorized' });
}

module.exports = router;