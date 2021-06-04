const express = require('express');
const router = express.Router();
const Razorpay = require('razorpay');
const crypto = require("crypto");
const config = require('../config/config');
const User = require('../models/user').User;
const { Payment } = require('../models/payment');
const { Advisor } = require('../models/business/advisor');
const { BC } = require('../models/business/business');
const mailScript = require('../helper/mail-script');
const mail = require('../helper/mail');

var instance = new Razorpay({
  key_id: config.razorpayKey,
  key_secret: config.razorpaySecret,
});

router.get('/', isValidUser, (req, res) => {
  Payment.find((err, doc) => {
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

  const currentDate = new Date();
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const day = currentDate.getDate();

  const payment = new Payment({
    user: userId,
    plan: planId,
    bcCode: bcCode,
    amount: amount,
    paymentId: razorpayPaymentId,
    orderId: orderId
  });

  try {
    await payment.save((err) => {
      if (err) return res.status(400).json(err);
      payment.populate('plan', 'duration durationType userType', (_, doc) => {
        var update = {}
        const duration = doc.plan.duration;
        const durationType = doc.plan.durationType;

        const nextDate = (durationType === 'Month')
          ? new Date(year, month + duration, day)
          : new Date(year, month, day + duration);

        if (doc.plan.userType == 'recruiter') {
          update = {
            'recruiter.plan': {
              currentPlan: planId,
              payment: doc._id,
              expiryDate: nextDate,
            }
          }
        } else if (doc.plan.userType == 'resume' || doc.plan.userType == 'jobBranding') {
          update = {
            'recruiter.addOnPlans': {
              plan: planId,
              planType: doc.plan.userType,
              payment: doc._id,
              expiryDate: nextDate,
            }
          }
        } else {
          update = {
            plan: {
              currentPlan: planId,
              payment: doc._id,
              expiryDate: nextDate,
            }
          }
        }

        User.findByIdAndUpdate({ _id: userId }, update,
          { new: true }).exec((err, user) => {
            if (err) return res.status(400).json(err);
            updateWallet(user, res, amount);
          });
      })
    });
  }
  catch (err) {
    console.log(err);
    return res.status(400).json(err);
  }
}

async function updateWallet(doc, res, payment) {
  var amount = payment == 99 ? 5 : payment == 149 ? 6 : payment == 199 ? 7
    : payment == 299 ? 8 : payment == 599 ? 8 : 0;

  try {
    if (doc.referredBy != null && doc.referredBy != '') {
      await User.findOneAndUpdate({ referralCode: doc.referredBy },
        { $inc: { wallet: amount } }).exec();
    }
    if (doc.addedByCode != null && doc.addedByCode != '') {
      const code = doc.addedByCode;
      const percent = code.substr(0, 2) == 'AD' ? 20 : 30;
      const userModel = code.substr(0, 2) == 'AD' ? Advisor : BC;
      const bcAmount = Number(payment) * percent / 100;

      await userModel.findOneAndUpdate({ bcCode: doc.addedByCode },
        { $inc: { wallet: bcAmount } }).exec();
    }

    // Send Mail
    const htmlMessage = mailScript.subscribedMail();
    const subject = 'Achiever! It’s great to have you with us.';
    mail.sendMail(doc.email, doc.name, subject, '', htmlMessage);

    return res.status(200).json({ message: 'Payment is successful', user: doc });
  }
  catch (err) {
    console.log(err);
    return res.status(501).json(err);
  }
}

function isValidUser(req, res, next) {
  if (req.isAuthenticated()) next();
  else return res.status(401).json({ message: 'Unauthorized' });
}

module.exports = router;