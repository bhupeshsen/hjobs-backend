const express = require('express');
const router = express.Router();
const Razorpay = require('razorpay');
const crypto = require("crypto");
const config = require('../config/config');
const User = require('../models/user');
const payment = require('../models/payment');

var instance = new Razorpay({
  key_id: config.razorpayKey,
  key_secret: config.razorpaySecret,
});

router.get('/', isValidUser, (req, res) => {
  payment.find((err, doc) => {
    if (err) return res.status(400).json(err);
    res.status(200).json(doc);
  }).populate('Plan')
})

router.post('/create-order', isValidUser, (req, res) => {
  const userId = req.user._id;
  const amount = req.body.amount;
  const random = Math.floor(Math.random() * Math.floor(99999));
  const receipt = `rcptid_${Date.now()}_${random}`;

  User.findById({ _id: userId }, (err, doc) => {
    if (err) return res.status(400).json(err);
    if (!doc) return res.status(400).json({ message: 'Bad Request' });

    var options = {
      amount: amount,
      currency: "INR",
      receipt: receipt
    };

    instance.orders.create(options, function (err, order) {
      if (err) return res.status(400).json(err);
      res.status(200).json(order);
    });
  });
});

router.post('/verify-payment', isValidUser, (req, res) => {
  const body = req.body;
  const orderId = body.orderId;
  const razorpayPaymentId = body.razorpayPaymentId;
  const razorpaySignature = body.razorpaySignature;

  const hmac = crypto.createHmac('sha256', config.razorpaySecret);
  hmac.update(orderId + "|" + razorpayPaymentId);
  let generatedSignature = hmac.digest('hex');

  let isSignatureValid = generatedSignature == razorpaySignature;

  if (isSignatureValid) {
    subscribe(body, req.user, res);
  } else {
    res.status(400).json({ message: 'Payment not verified' });
  }
});

async function subscribe(body, user, res) {
  const userId = user._id;
  const bcCode = user.addedByCode;
  const planId = body.planId;
  const amount = body.amount;
  const orderId = body.orderId;
  const razorpayPaymentId = body.razorpayPaymentId;

  const payment = new Payment({
    user: userId,
    plan: planId,
    bcCode: bcCode,
    amount: amount,
    paymentId: razorpayPaymentId,
    orderId: orderId
  });

  User

  // await 
  res.status(200).json({ message: 'Payment is successful' });
}

function isValidUser(req, res, next) {
  if (req.isAuthenticated()) next();
  else return res.status(401).json({ message: 'Unauthorized' });
}

module.exports = router;