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
const { User } = require('../models/user');
const { Admin } = require('../models/admin');
const { FSE } = require('../models/business/fse');
const { Advisor } = require('../models/business/advisor');
const { BC, CM } = require('../models/business/business');

// PRIVATE and PUBLIC key
var privateKEY = fs.readFileSync(__dirname + '/../config/jwt.key', 'utf8');

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
router.post('/reset-password', (req, res) => {
  const email = req.body.email;

  User.findOne({ email: email }, (err, doc) => {
    if (err) return res.status(400).json(err);
    if (!doc) return res.status(400).json({ message: 'Incorrect email address!' });

    const token = jwt.sign({
      _id: doc._id,
      email: doc.email
    }, privateKEY, {
      issuer: issuer, audience: audience,
      algorithm: 'RS256', expiresIn: '24h'
    });

    // Send Email
    mail.sendMail(
      email,
      doc.name,
      'Request for reset password',
      `Dear ${doc.name},On your request, we have sent the login credentials of your account as mentioned below. 
      Your Login Details 
      User Email: ${email} 
      Please click on the below link to reset your password- 
      ${req.protocol}://${req.get('host')}/reset-password/${user}/${token} 
      Regards, Joogle Team 
      This is An Auto Generated Notification Email. Please Do Not Respond To This.`,
      `Dear <b>${doc.name}</b>,<br>On your request, we have sent the login credentials of your account as mentioned below.
      <br><b>Your Login Details</b><br><br><br>
      User Email: ${email}<br><br>
      Please click on the below link to reset your password-<br><br>
      <a href="${req.protocol}://${req.get('host')}/reset-password/${user}/${token}">
      ${req.protocol}://${req.get('host')}/reset-password/${user}/${token}
      </a><br><br><br>Regards,<br><br>Joogle Team<br><br>
      This is An Auto Generated Notification Email. Please Do Not Respond To This.`
    ).then((result) => {
      console.log(result.body)
      res.status(200).json({ message: 'An email sent to your registered email address.' });
    }).catch((err) => {
      console.log(err.statusCode);
      res.status(400).json(err);
    });
  });
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
      const _user = {
        _id: user._id,
        name: user.name,
        email: user.email,
        mobile: user.mobile,
        address: user.address,
        firstName: user.firstName,
        lastName: user.lastName,
        photo: user.photo,
        code:code,
        documents:user.documents,
        userType:user.userType,
        approved: user.approved,
        disabled: user.disabled,
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

/// BC - Register
var bcUpload = upload.fields([
  { name: 'photo', maxCount: 1 },
  { name: 'aadharCard[aadharF]', maxCount: 1 },
  { name: 'aadharCard[aadharB]', maxCount: 1 },
  { name: 'panCard[panCardUrl]', maxCount: 1 },
  { name: 'identityProof[identityImage]', maxCount: 1 },
  { name: 'residentialProof[proofImage]', maxCount: 1 },
  { name: 'bank[bankPassbookUrl]', maxCount: 1 }
]);
router.post('/business/bc/register', bcUpload, (req, res) => {
  var body = req.body;
  body.password = BC.hashPassword(body.password)

  if (body.addedByCode === 'null') {
    body.addedByCode = null;
  }

  var photo = req.files['photo'];
  var aadharF = req.files['aadharCard[aadharF]'];
  var aadharB = req.files['aadharCard[aadharB]'];
  var panCard = req.files['panCard[panCardUrl]'];
  var identityProof = req.files['identityProof[identityImage]'];
  var residentialProof = req.files['residentialProof[proofImage]'];
  var bankPassbook = req.files['bank[bankPassbookUrl]'];

  if (photo != undefined) {
    body.photo = config.pathImages + photo[0].filename
  }
  if (aadharF != undefined && aadharB != undefined) {
    body.aadharCard.aadharF = config.pathImages + aadharF[0].filename;
    body.aadharCard.aadharB = config.pathImages + aadharB[0].filename;
  }
  if (panCard != undefined) {
    body.panCard.panCardUrl = config.pathImages + panCard[0].filename
  }
  if (identityProof != undefined) {
    body.identityProof.identityImage = config.pathImages + identityProof[0].filename
  }
  if (residentialProof != undefined) {
    body.residentialProof.proofImage = config.pathImages + residentialProof[0].filename
  }
  if (bankPassbook != undefined) {
    body.bank.bankPassbookUrl = config.pathImages + bankPassbook[0].filename
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
    doc = await data.save();
    console.log(doc)
    return res.status(201).json({ message: 'Data successfully saved!' });
  }
  catch (err) {
    console.log(err)
    return res.status(400).json(err);
  }
};

module.exports = router;
