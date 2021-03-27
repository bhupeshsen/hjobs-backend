const express = require('express');
const router = express.Router();

const passport = require('passport');
const jwt = require('jsonwebtoken');
const fs = require('fs');
const multer = require('multer');
const path = require('path');
const randToken = require('rand-token');

const mail = require('../helper/mail');
const User = require('../models/user');

// PRIVATE and PUBLIC key
var privateKEY = fs.readFileSync(__dirname + '/../config/jwt.key', 'utf8');

var issuer = 'admin.hindustaanjobs.com';        // Issuer 
var audience = 'hindustaanjobs.com';            // Audience

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
    email: body.email
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
    password: password,
    referralCode: referralCode,
    passwordResetToken: passwordResetToken,
    passwordResetExpires: passwordResetExpires
  });

  saveData(user, res)
});

router.put('/verify/:userId', (req, res) => {
  res.status(200).json({ message: 'Email successfully verified.' })
})

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
        email: user.email
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
})

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

function generateReferralCode() {
  const alpha = 'abcdefghijklmnopqrstuvwxyz0123456789'
  var code = '';

  for (var i = 0; i < 6; i++) {
    code += alpha.charAt(Math.floor(Math.random() * alpha.length))
  }
  code = `${code.toUpperCase()}`
  return code;
};

async function saveData(bc, res) {
  try {
    doc = await bc.save();
    console.log(doc)
    return res.status(201).json({ message: 'Date successfully saved!' });
  }
  catch (err) {
    console.log(err)
    return res.status(400).json(err);
  }
};

module.exports = router;
