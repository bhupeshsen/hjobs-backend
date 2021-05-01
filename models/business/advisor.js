var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var bcrypt = require('bcryptjs');

var schema = new Schema({
  baCode: {
    type: String,
    index: {
      unique: true,
      partialFilterExpression: { baCode: { $type: "string" } },
    },
  },
  firstName: {
    type: String,
    trim: true,
    required: true
  },
  lastName: {
    type: String,
    trim: true,
    required: true
  },
  dob: {
    type: Date,
    required: true
  },
  fatherName: {
    type: String,
    trim: true,
    required: true
  },
  email: {
    type: String,
    required: true,
    trim: true,
    unique: true,
    index: true
  },
  mobile: {
    type: Number,
    required: true
  },
  photo: String,
  address: {
    address: {
      type: String,
      trim: true,
      required: true
    },
    state: {
      type: String,
      trim: true,
      required: true
    },
    city: {
      type: String,
      trim: true,
      required: true
    },
    locality: {
      type: String,
      trim: true
    },
    pinCode: {
      type: String,
      trim: true,
      required: true
    },
  },
  documents: {
    aadharCard: {
      number: {
        type: Number,
        required: true
      },
      aadharF: { type: String },
      aadharB: { type: String }
    },
    panCard: {
      number: {
        type: Number,
        required: true
      },
      image: { type: String }
    },
    resume: String,
  },
  qualification: {
    type: String,
    trim: true
  },
  exam: {
    status: { type: Boolean, default: false },
    result: Boolean
  },
  userType: {
    type: String,
    trim: true,
    default: 'ba',
    required: true
  },
  password: { type: String },
  passwordResetToken: String,
  passwordResetExpires: Date,
  payment: {
    status: { type: Boolean, default: false },
    amount: Number,
    order_id: String,
    payment_id: String,
    createdAt: Date
  },
  wallet: { type: Number, default: 0 },
  code: Number,
  fcmToken: { type: String, default: null },
  disabled: { type: Boolean, default: false },
  approved: { type: Boolean, default: false },
  approvedDate: {
    type: Date,
    default: new Date('1950-01-01T00:00:00.000Z')
  },
  expiryDate: {
    type: Date,
    default: new Date('1950-01-01T00:00:00.000Z')
  },
  createdAt: {
    type: Date,
    default: Date.now(),
    required: true
  },
  updateAt: {
    type: Date,
    default: Date.now(),
    required: true
  }
});

schema.statics.hashPassword = function hashPassword(password) {
  return bcrypt.hashSync(password, 10);
}

schema.methods.isValid = function (hashedPassword) {
  return bcrypt.compareSync(hashedPassword, this.password);
}

const Advisor = mongoose.model('Advisor', schema);
module.exports = { Advisor }