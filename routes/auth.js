const express = require('express');
const router = express.Router();

const passport = require('passport');
const jwt = require('jsonwebtoken');
const fs = require('fs');
const multer = require('multer');
const path = require('path');
const config = require('../config/config');
const randToken = require('rand-token');

const mail = require('../helper/mail');
const mailScript = require('../helper/mail-script');
const { User } = require('../models/user');
const { Admin } = require('../models/admin');
const { FSE } = require('../models/business/fse');
const { Advisor } = require('../models/business/advisor');
const { BC, CM } = require('../models/business/business');

// PRIVATE and PUBLIC key
const privateKEY = fs.readFileSync(__dirname + '/../config/jwt.key', 'utf8');
const publicKEY = fs.readFileSync(__dirname + '/../config/jwt.key.pub', 'utf8');
const issuer = 'admin.hindustaanjobs.com';        // Issuer
const audience = 'hindustaanjobs.com';            // Audience

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    let path = `public/images`;
    cb(null, path);
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});

let upload = multer({ storage: storage });

/// Home page
router.get('/', function (req, res) {
  res.render('index', { title: 'Hindustaan Jobs' });
});

/// Reset Password
router.route('/reset-password')
  .get((req, res) => {
    const token = req.query.token;
    res.render('reset-password', { title: 'Reset Password', token: token });
  })
  .post((req, res) => {
    const email = req.body.email;

    const token = jwt.sign({
      _id: user._id,
      email: user.email,
      userType: user.userType
    }, privateKEY, {
      issuer: issuer, audience: audience,
      algorithm: 'RS256', expiresIn: '24h'
    });

    User.findOneAndUpdate({ email: email },
      { passwordResetToken: token }
    ).exec((err, user) => {
      if (err) return res.status(400).json(err);
      if (!user) return res.status(400).json({ message: 'User not found!' });

      // Send Email
      const baseUrl = `${req.protocol}://${req.get('host')}`;
      const htmlMessage = mailScript.resetPassword(baseUrl, user.name, email, token);
      mail.sendMail(email, user.name, 'Request for reset password', '', htmlMessage)
        .then(() => {
          res.status(202).json({ message: 'An email sent to your registered email address.' });
        }).catch((err) => {
          console.log(err);
          res.status(400).json(err);
        });
    });
  })
  .put((req, res) => {
    const pass = req.body.password;
    const r_pass = req.body.r_password;
    const token = req.query.token;

    if (pass === r_pass) {
      jwt.verify(token, publicKEY, (err, decoded) => {
        if (err) return res.send({ message: 'Invalid token!' });

        const type = decoded.userType;
        const Model = type == 'fse' ? FSE : type == 'ba' ? Advisor
          : type == ' bc' ? BC : type == 'cm' ? CM : User;

        Model.findOneAndUpdate(
          { email: decoded.email, passwordResetToken: token },
          { password: Model.hashPassword(pass), passwordResetToken: null })
          .exec((err, user) => {
            if (err) return res.send({ message: 'Something went wrong!', error: err });
            if (!user) return res.send({ message: 'Token expired!' });
            res.send({ message: 'Password successfully changed.' });
          })
      });
    } else {
      res.send({ message: 'Password not match!' });
    }
  });

/// Register
router.post('/register', (req, res) => {
  var body = req.body;
  var password = User.hashPassword(body.password);
  var referralCode = generateReferralCode();

  const JWTToken = jwt.sign({
    name: body.name,
    email: body.email,
    addedByCode: body.addedByCode
  }, privateKEY, {
    issuer: issuer, audience: audience,
    algorithm: 'RS256', expiresIn: '24h'
  });

  const today = new Date()
  const tomorrow = new Date(today)
  tomorrow.setDate(tomorrow.getDate() + 1)

  var passwordResetToken = JWTToken;
  var passwordResetExpires = tomorrow;

  const user = new User({
    name: body.name,
    email: body.email,
    mobile: body.mobile,
    addedByCode: body.addedByCode,
    referredBy: body.referredBy,
    password: password,
    referralCode: referralCode,
    passwordResetToken: passwordResetToken,
    passwordResetExpires: passwordResetExpires
  });

  saveData(user, res)
});

/// Verify Email
router.put('/verify/:userId', (req, res) => {
  res.status(200).json({ message: 'Email successfully verified.' })
});

/// Login
router.post('/login', (req, res, next) => {
  passport.authenticate('user-local', function (err, user, info) {
    if (err) { return res.status(401).json(err); }
    if (!user) { return res.status(401).json(info); }

    req.logIn(user, function (err) {
      if (err) { return res.status(401).json(err); }

      User.findByIdAndUpdate({ _id: user._id },
        { fcmToken: req.body.fcmToken },
        { password: 0 }, (err) => {
          if (err) { return res.status(401).json(err); }
        });

      // JWT Token
      const JWTToken = jwt.sign({
        _id: user._id,
        email: user.email,
        addedByCode: user.addedByCode
      }, privateKEY, {
        issuer: issuer, audience: audience,
        algorithm: 'RS256', expiresIn: '24h'
      });

      // Refresh Token
      const refreshToken = randToken.uid(256);
      const _user = {
        _id: user._id,
        name: user.name,
        email: user.email,
        mobile: user.mobile,
        referralCode: user.referralCode,
        approved: user.approved,
        verified: user.verified,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt
      }

      return res.status(200).json({
        message: 'Welcome back', user: _user,
        token: JWTToken, refreshToken: refreshToken
      });
    });
  })(req, res, next);
});

/// Admin Login
router.post('/admin', (req, res, next) => {
  passport.authenticate('admin-local', function (err, user, info) {
    if (err) { return res.status(401).json(err); }
    if (!user) { return res.status(401).json(info); }

    req.logIn(user, function (err) {
      if (err) { return res.status(401).json(err); }

      Admin.findByIdAndUpdate({ _id: user._id },
        { fcmToken: req.body.fcmToken },
        { password: 0 }, (err) => {
          if (err) { return res.status(401).json(err); }
        });

      // JWT Token
      const JWTToken = jwt.sign({
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }, privateKEY, {
        issuer: issuer, audience: audience,
        algorithm: 'RS256', expiresIn: '24h'
      });

      // Refresh Token
      const refreshToken = randToken.uid(256);

      // User
      const _user = {
        _id: user._id,
        name: user.name,
        email: user.email,
        photo: user.photo,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt
      }

      return res.status(200).json({
        message: 'Welcome back', user: _user,
        token: JWTToken, refreshToken: refreshToken
      });
    });
  })(req, res, next);
});

/// Google SignIn
router.post('/provider/google', (req, res) => {
  const body = req.body;

  User.findOneAndUpdate({ email: email },
    { fcmToken: req.body.fcmToken },
    { password: 0 }, (err, doc) => {
      if (err) return res.status(400).json(err);
      if (!doc) {
        var referralCode = generateReferralCode();

        const user = new User({
          name: body.name,
          email: body.email,
          mobile: body.mobile,
          password: password,
          referralCode: referralCode,
          provider: 'google',
          verified: { email: true },
          fcmToken: body.fcmToken
        });

        saveData(user, res)
      }

      // JWT Token
      const JWTToken = jwt.sign({
        _id: user._id,
        email: user.email
      }, privateKEY, {
        issuer: issuer, audience: audience,
        algorithm: 'RS256', expiresIn: 300
      });

      // Refresh Token
      const refreshToken = randToken.uid(256);
      const _user = {
        _id: user._id,
        name: user.name,
        email: user.email,
        mobile: user.mobile,
        referralCode: user.referralCode,
        approved: user.approved,
        verified: user.verified,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt
      }

      return res.status(200).json({
        message: 'Welcome back', user: _user,
        token: JWTToken, refreshToken: refreshToken
      });
    });
});

/// Business Partner - Login
router.post('/business/:type/login', (req, res, next) => {
  const type = req.params.type;

  const model = type == 'fse' ? FSE
    : type == 'ba' ? Advisor : type == 'bc' ? BC
      : type == 'cm' ? CM : null;

  passport.authenticate(`${type}-local`, function (err, user, info) {
    if (err) { return res.status(401).json(err); }
    if (!user) { return res.status(401).json(info); }

    const code = type == 'fse' ? user.fseCode
      : type == 'ba' ? user.baCode : type == 'bc' ? user.bcCode
        : type == 'cm' ? user.cmCode : null;

    req.logIn(user, function (err) {
      if (err) { return res.status(401).json(err); }

      model.findByIdAndUpdate({ _id: user._id },
        { fcmToken: req.body.fcmToken },
        { password: 0 }, (err) => {
          if (err) { return res.status(401).json(err); }
        });

      // JWT Token
      const JWTToken = jwt.sign({
        _id: user._id,
        email: user.email,
        code: code,
        userType: user.userType
      }, privateKEY, {
        issuer: issuer, audience: audience,
        algorithm: 'RS256', expiresIn: "24h"
      });

      // Refresh Token
      const refreshToken = randToken.uid(256);
      // const _user = {
      //   _id: user._id,
      //   name: user.name,
      //   email: user.email,
      //   mobile: user.mobile,
      //   approved: user.approved,
      //   disabled: user.disabled,
      //   createdAt: user.createdAt,
      //   updatedAt: user.updatedAt
      // }

      return res.status(200).json({
        message: 'Welcome back', user: user,
        token: JWTToken, refreshToken: refreshToken
      });
    });
  })(req, res, next);
});

/// BC - Register
var bcUpload = upload.fields([
  { name: 'documents[aadharCard][aadharF]', maxCount: 1 },
  { name: 'documents[aadharCard][aadharB]', maxCount: 1 },
  { name: 'documents[panCard][image]', maxCount: 1 },
  { name: 'documents[residentialProof][proofImage]', maxCount: 1 },
  { name: 'documents[bank][passbook]', maxCount: 1 },
  { name: 'photo', maxCount: 1 }
]);
router.post('/business/bc/register', bcUpload, (req, res) => {
  var body = req.body;
  body.password = BC.hashPassword(body.password)

  if (body.addedByCode === 'null') {
    body.addedByCode = null;
  }

  const aadharF = req.files['documents[aadharCard][aadharF]'];
  const aadharB = req.files['documents[aadharCard][aadharB]'];
  const panCard = req.files['documents[panCard][image]'];
  const residential = req.files['documents[residentialProof][proofImage]'];
  const bank = req.files['documents[bank][passbook]'];
  const photo = req.files['photo'];

  if (aadharF != undefined && aadharB != undefined) {
    body.documents.aadharCard = {};
    body.documents.aadharCard.aadharF = config.pathImages + aadharF[0].filename;
    body.documents.aadharCard.aadharB = config.pathImages + aadharB[0].filename;
  }

  if (panCard != undefined) {
    body.documents.panCard = {};
    body.documents.panCard.image = config.pathImages + panCard[0].filename;
  }

  if (residential != undefined) {
    body.documents.residentialProof = {};
    body.documents.residentialProof.proofImage = config.pathImages + residential[0].filename;
  }

  if (bank != undefined) {
    body.documents.bank = {};
    body.documents.bank.passbook = config.pathImages + bank[0].filename;
  }

  if (photo != undefined) {
    body.photo = config.pathImages + photo[0].filename
  }

  const bc = new BC(body);
  bc.save(function (err) {
    if (err) return res.status(400).json(err);
    res.status(200).json({ message: 'Successfully registered!' });
  })
});

function generateReferralCode() {
  const alpha = 'abcdefghijklmnopqrstuvwxyz0123456789'
  var code = '';

  for (var i = 0; i < 6; i++) {
    code += alpha.charAt(Math.floor(Math.random() * alpha.length))
  }
  code = `${code.toUpperCase()}`
  return code;
};

async function saveData(data, res) {
  try {
    const doc = await data.save();

    // Welcome Mail
    const htmlMessage = mailScript.welcomeMail(doc.name);
    const subject = 'Mr. Rajput (Director) wants to talk to you.';
    mail.sendMail(doc.email, doc.name, subject, '', htmlMessage);

    return res.status(201).json({ message: 'Data successfully saved!' });
  }
  catch (err) {
    console.log(err)
    return res.status(400).json(err);
  }
};

module.exports = router;
