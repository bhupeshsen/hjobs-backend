const fs = require('fs');
const passport = require('passport');
const passportJWT = require("passport-jwt");
const LocalStrategy = require('passport-local').Strategy;

const { User } = require('../models/user');
const { Admin } = require('../models/admin');
const { FSE } = require('../models/business/fse');
const { Advisor } = require('../models/business/advisor');
const { BC, CM } = require('../models/business/business');

const JWTStrategy = passportJWT.Strategy;
const ExtractJWT = passportJWT.ExtractJwt;

// PRIVATE and PUBLIC key
const privateKEY = fs.readFileSync(__dirname + '/jwt.key', 'utf8');
const publicKEY = fs.readFileSync(__dirname + '/jwt.key.pub', 'utf8');

const issuer = 'admin.hindustaanjobs.com';        // Issuer 
const audience = 'hindustaanjobs.com';            // Audience

passport.use('admin-local', new LocalStrategy({
  usernameField: 'email',
  passwordField: 'password'
},
  function (username, password, done) {
    Admin.findOne({ email: username }, function (err, user) {
      if (err) { return done(err); }
      if (!user) {
        return done(null, false, { message: 'Invalid credentials!' });
      }
      if (user.password == undefined || !user.isValid(password)) {
        return done(null, false, { message: 'Invalid credentials!' });
      }
      if (user.disabled == true) {
        return done(null, false, { message: 'Your email is banned from using Admin. Contact support for help.' });
      }
      return done(null, user);
    });
  }
));

passport.use('user-local', new LocalStrategy({
  usernameField: 'email',
  passwordField: 'password'
},
  function (username, password, done) {
    User.findOne({ email: username }, function (err, user) {
      if (err) { return done(err); }
      if (!user) {
        return done(null, false, { message: 'Invalid credentials!' });
      }
      if (user.password == undefined || !user.isValid(password)) {
        return done(null, false, { message: 'Invalid credentials!' });
      }
      if (user.disabled == true) {
        return done(null, false, { message: 'Your email is banned from using Our App. Contact support for help.' });
      }
      return done(null, user);
    });
  }
));

// Business Partner
passport.use('cm-local', new LocalStrategy({
  usernameField: 'email',
  passwordField: 'password'
},
  function (username, password, done) {
    CM.findOne({ email: username, deleted: false }, function (err, user) {
      if (err) { return done(err); }
      if (!user) {
        return done(null, false, { message: 'Invalid credentials!' });
      }
      if (user.password == undefined || !user.isValid(password)) {
        return done(null, false, { message: 'Invalid credentials!' });
      }
      return done(null, user);
    });
  }
));

passport.use('bc-local', new LocalStrategy({
  usernameField: 'email',
  passwordField: 'password'
},
  function (username, password, done) {
    BC.findOne({ email: username, deleted: false }, function (err, user) {
      if (err) { return done(err); }
      if (!user) {
        return done(null, false, { message: 'Invalid credentials!' });
      }
      if (user.password == undefined || !user.isValid(password)) {
        return done(null, false, { message: 'Invalid credentials!' });
      }
      return done(null, user);
    });
  }
));

passport.use('ba-local', new LocalStrategy({
  usernameField: 'email',
  passwordField: 'password'
},
  function (username, password, done) {
    Advisor.findOne({ email: username }, function (err, user) {
      if (err) { return done(err); }
      if (!user) {
        return done(null, false, { message: 'Invalid credentials!' });
      }
      if (user.password == undefined || !user.isValid(password)) {
        return done(null, false, { message: 'Invalid credentials!' });
      }
      return done(null, user);
    });
  }
));

passport.use('fse-local', new LocalStrategy({
  usernameField: 'email',
  passwordField: 'password'
},
  function (username, password, done) {
    FSE.findOne({ email: username }, function (err, user) {
      if (err) { return done(err); }
      if (!user) {
        return done(null, false, { message: 'Invalid credentials!' });
      }
      if (user.password == undefined || !user.isValid(password)) {
        return done(null, false, { message: 'Invalid credentials!' });
      }
      return done(null, user);
    });
  }
));

passport.serializeUser(function (user, done) {
  done(null, user);
});

passport.deserializeUser(function (user, done) {
  if (user != null)
    done(null, user);
});

passport.use('admin', new JWTStrategy({
  jwtFromRequest: ExtractJWT.fromAuthHeaderAsBearerToken(),
  secretOrKey: publicKEY,
  issuer: issuer,
  audience: audience
},
  async function (jwtPayload, cb) {
    try {
      const user = await Admin.findById(jwtPayload._id);
      return cb(null, user);
    }
    catch (err) {
      return cb(err);
    }
  }
));

passport.use('user', new JWTStrategy({
  jwtFromRequest: ExtractJWT.fromAuthHeaderAsBearerToken(),
  secretOrKey: publicKEY,
  issuer: issuer,
  audience: audience
},
  async function (jwtPayload, cb) {
    try {
      const user = await User.findById(jwtPayload._id);
      return cb(null, user);
    }
    catch (err) {
      return cb(err);
    }
  }
));

// Business Partner
passport.use('cm', new JWTStrategy({
  jwtFromRequest: ExtractJWT.fromAuthHeaderAsBearerToken(),
  secretOrKey: publicKEY,
  issuer: issuer,
  audience: audience
},
  async function (jwtPayload, cb) {
    try {
      const user = await CM.findById(jwtPayload._id);
      return cb(null, user);
    }
    catch (err) {
      return cb(err);
    }
  }
));

passport.use('bc', new JWTStrategy({
  jwtFromRequest: ExtractJWT.fromAuthHeaderAsBearerToken(),
  secretOrKey: publicKEY,
  issuer: issuer,
  audience: audience
},
  async function (jwtPayload, cb) {
    try {
      const user = await BC.findById(jwtPayload._id);
      return cb(null, user);
    }
    catch (err) {
      return cb(err);
    }
  }
));

passport.use('ba', new JWTStrategy({
  jwtFromRequest: ExtractJWT.fromAuthHeaderAsBearerToken(),
  secretOrKey: publicKEY,
  issuer: issuer,
  audience: audience
},
  async function (jwtPayload, cb) {
    try {
      const user = await Advisor.findById(jwtPayload._id);
      return cb(null, user);
    }
    catch (err) {
      return cb(err);
    }
  }
));

passport.use('fse', new JWTStrategy({
  jwtFromRequest: ExtractJWT.fromAuthHeaderAsBearerToken(),
  secretOrKey: publicKEY,
  issuer: issuer,
  audience: audience
},
  async function (jwtPayload, cb) {
    try {
      const user = await FSE.findById(jwtPayload._id);
      return cb(null, user);
    }
    catch (err) {
      return cb(err);
    }
  }
));