const fs = require('fs');
const passport = require('passport');
const passportJWT = require("passport-jwt");
const LocalStrategy = require('passport-local').Strategy;

const User = require('../models/user').User;

const JWTStrategy = passportJWT.Strategy;
const ExtractJWT = passportJWT.ExtractJwt;

// PRIVATE and PUBLIC key
const privateKEY = fs.readFileSync(__dirname + '/jwt.key', 'utf8');
const publicKEY = fs.readFileSync(__dirname + '/jwt.key.pub', 'utf8');

const issuer = 'admin.hindustaanjobs.com';        // Issuer 
const audience = 'hindustaanjobs.com';            // Audience

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

passport.serializeUser(function (user, done) {
  done(null, user);
});

passport.deserializeUser(function (user, done) {
  if (user != null)
    done(null, user);
});

passport.use('user', new JWTStrategy({
  jwtFromRequest: ExtractJWT.fromAuthHeaderAsBearerToken(),
  secretOrKey: publicKEY,
  issuer: issuer,
  audience: audience
},
  async function (jwtPayload, cb) {
    try {
      const user = await User.findById(jwtPayload._id);
      console.log(user)
      return cb(null, user);
    }
    catch (err) {
      return cb(err);
    }
  }
));