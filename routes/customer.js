const express = require('express');
const multer = require('multer');
const ObjectId = require('mongodb').ObjectID;
const { User } = require('../models/user');
const { Service } = require('../models/provider/service');
const { Order } = require('../models/provider/order');
const router = express.Router();

// Update Profile
router.put('/profile', isValidUser, (req, res) => {
  const userId = req.user._id;
  const body = req.body;

  User.findByIdAndUpdate({ _id: userId }, { customer: body }, { new: true })
    .exec((err, user) => {
      if (err) return res.status(400).json(err);
      if (!user) return res.status(404).json({ message: 'User not found!' });
      res.status(200).json({ message: 'Profile successfully updated!', user: user });
    });
});

// Search
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

// Provider
router.get('/providers', isValidUser, (req, res) => {
  const category = req.query.category;

  const query = { categoryName: category };
  const filter = 'name mobile gender photo provider.experience provider.disability provider.gallery';

  Service.find(query)
    .populate('user', filter)
    .exec((err, service) => {
      if (err) return res.status(400).json(err);
      if (service == 0) return res.status(200).json([]);
      res.status(200).json(service[0].user)
    });
});

// Orders
router.route('/order')
  .get(isValidUser, (req, res) => {
    const userId = req.user._id;
    const orderId = req.query.orderId;

    const query = orderId != null
      ? { _id: orderId, customer: ObjectId(userId) }
      : { customer: ObjectId(userId) };
    const model = orderId != null ? Order.findOne(query) : Order.find(query);

    model.populate('provider', 'name photo address mobile -_id')
      .sort({ createdAt: -1 })
      .exec((err, orders) => {
        if (err) return res.status(400).json(err);
        res.status(200).json(orders);
      });
  })
  .post(isValidUser, (req, res) => {
    const userId = req.user._id;
    var body = req.body;
    body.customer = userId;

    const order = new Order(body);

    order.save((err) => {
      if (err) return res.status(400).json(err);
      res.status(200).json({ message: 'Order successfully created!' });
    });
  })

// Tutor

function isValidUser(req, res, next) {
  if (req.isAuthenticated()) next();
  else return res.status(401).json({ message: 'Unauthorized' });
}

module.exports = router;