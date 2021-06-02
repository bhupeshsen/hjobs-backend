const createError = require('http-errors');
const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const logger = require('morgan');
const bodyParser = require('body-parser')
const mongoose = require('mongoose');
const passport = require('passport');
const session = require('express-session');
const _cors = require('cors');
const MongoStore = require('connect-mongo')(session);

require('./config/passport-config');

const admin = require('firebase-admin');

const app = express();

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.use(_cors({
  origin: ['http://localhost:4200', 'http://192.168.1.11:4200', 'http://192.168.29.166:4200'],
  // origin: ['http://www.hindustaanjobs.com', 'http://hindustaanjobs.com', 'http://jooglekar.com', 'http://www.jooglekar.com'],
  credentials: true
}));

app.use(session({
  name: 'joogle.sid',
  secret: 'work hard',
  resave: false,
  saveUninitialized: false,
  cookie: {
    maxAge: 604800,
    httpOnly: false,
    secure: false
  },
  store: new MongoStore({ mongooseConnection: mongoose.connection })
}));

var serviceAccount = require("./config/serviceAccountKey.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://hindustaan-jobs.firebaseio.com"
});

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

app.use(logger('dev'));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use(passport.initialize());
app.use(passport.session());

const indexRouter = require('./routes/index');
const authRouter = require('./routes/auth');
const adminRouter = require('./routes/admin');
const paymentRouter = require('./routes/payment');
const userRouter = require('./routes/user');
const recruiterRouter = require('./routes/recruiter');
const seekerRouter = require('./routes/seeker');
const customerRouter = require('./routes/customer');
const providerRouter = require('./routes/provider');
const dataRouter = require('./routes/data');
const hunarRouter = require('./routes/hunar');
const fseRouter = require('./routes/fse');
const advisorRouter = require('./routes/advisor');
const bcRouter = require('./routes/bc');
const cmRouter = require('./routes/cm');

app.use('/', indexRouter);
app.use('/auth', authRouter);
app.use('/data', dataRouter);
app.use('/admin', passport.authenticate('admin', { session: false }), adminRouter)
app.use('/payment', passport.authenticate('user', { session: false }), paymentRouter);
app.use('/user', passport.authenticate(['admin', 'user']), userRouter);
app.use('/recruiter', passport.authenticate(['admin', 'user']), recruiterRouter);
app.use('/seeker', passport.authenticate(['admin', 'user']), seekerRouter);
app.use('/customer', passport.authenticate(['admin', 'user']), customerRouter);
app.use('/provider', passport.authenticate(['admin', 'user']), providerRouter);
app.use('/hunar', passport.authenticate(['admin', 'user']), hunarRouter);
app.use('/business/fse', passport.authenticate(['admin', 'fse']), fseRouter);
app.use('/business/advisor', passport.authenticate(['admin', 'ba']), advisorRouter);
app.use('/business/bc', passport.authenticate(['admin', 'bc']), bcRouter);
app.use('/business/cm', passport.authenticate(['admin', 'cm']), cmRouter);

mongoose.set('useCreateIndex', true);
mongoose.set('useFindAndModify', false);
mongoose.set('useNewUrlParser', true);
//mongoose.connect('mongodb://AdminJoogle:Gateway500#@127.0.0.1:27017/hindustaanJobs?authSource=admin');
mongoose.connect('mongodb+srv://hJobs:hJobs%4096@cluster0.nnb1s.mongodb.net/hjobs?retryWrites=true&w=majority');
const connection = mongoose.connection;
connection.once('open', () => {
  console.log('MongoDB database connection established successfully!');
});

// catch 404 and forward to error handler
app.use(function (req, res, next) {
  next(createError(404));
});

// error handler
app.use(function (err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.json({ message: err.message });
});

module.exports = app;
