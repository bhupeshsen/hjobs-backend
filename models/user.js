var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var bcrypt = require('bcryptjs');

// Aadhar Card, Pan Card, Resume, Driving Licence, Voter Id
const docSchema = new Schema({
  type: { type: String, trim: true },
  files: { type: Array, default: [] },
  number: { type: String, trim: true }
});

// type=> School, Graduation, Post Graduation, Diploma
const eduSchema = new Schema({
  type: { type: String, trim: true },
  board: { type: String, trim: true },
  medium: { type: String, trim: true },
  passingYear: Number,
  percentage: Number,
  specialization: { type: String, trim: true },
  universityName: { type: String, trim: true },
  degree: { type: String, trim: true },
  courseType: { type: String, trim: true }
});

const jobRoleSchema = new Schema({
  name: { type: String },
  experience: { type: String },
}, { _id: false });

const addOnSchema = new Schema({
  type: { type: String },
  plan: { type: Schema.Types.ObjectId, default: null, ref: 'Plan' },
  expiryDate: { type: Date, default: new Date('1950-01-01T00:00:00.000Z') },
  planType: { type: String, trim: true },
  payment: { type: Schema.Types.ObjectId, default: null, ref: 'Payment' },
}, { _id: false });

const videoSchema = new Schema({
  url: { type: String, trim: true },
  description: { type: String, trim: true },
  thumbnail: { type: String, trim: true },
  status: { type: Number, default: 0 }, // 0 => Pending; 1 => Approved; 2 => DisApproved;
  uploadedAt: { type: Date, default: Date.now() }
});

const schema = new Schema({
  addedByCode: { type: String, uppercase: true },
  referredBy: { type: String, trim: true },
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    unique: true,
    required: true,
    trim: true
  },
  mobile: {
    type: Number,
    required: true
  },
  photo: {
    type: String,
    trim: true
  },
  dob: { type: Date },
  gender: { type: String },
  address: {
    address: String,
    state: String,
    city: String,
    locality: { type: String, trim: true },
    pinCode: Number
  },
  knownLanguages: Array,
  seeker: {
    status: { type: Boolean, default: false },
    bio: String,
    achievements: { type: Array, default: [] },
    iAm: String,
    savedCompany: [{ type: Schema.Types.ObjectId, ref: 'Company' }],
    savedJobs: [{ type: Schema.Types.ObjectId, ref: 'Job' }],
    appliedJobs: [{ type: Schema.Types.ObjectId, ref: 'Job' }],
    skills: { type: Array },
    englishSkills: { type: String },
    desiredSalary: String,
    prefWorkLocation: String,
    desiredJobType: String,
    desiredEmpType: String,
    preJobDetails: {
      companyName: String,
      recentDesignation: String,
      recentSalary: String,
      experience: String,
      recentDepartment: String,
      recentIndustry: String,
    },
    jobRoles: [jobRoleSchema],
  },
  recruiter: {
    status: { type: Boolean, default: false },
    company: [{ type: Schema.Types.ObjectId, ref: 'Company' }],
    designation: { type: String, trim: true },
    plan: {
      currentPlan: { type: Schema.Types.ObjectId, default: null, ref: 'Plan' },
      payment: { type: Schema.Types.ObjectId, default: null, ref: 'Payment' },
      expiryDate: { type: Date, default: new Date('1950-01-01T00:00:00.000Z') },
    },
    addOnPlans: [addOnSchema],
    wishlist: [{
      type: Schema.Types.ObjectId,
      ref: 'User'
    }]
  },
  hunar: {
    status: { type: Boolean, default: false },
    videos: [videoSchema]
  },
  customer: {
    status: { type: Boolean, default: false },
    related: {
      name: { type: String },
      type: { type: String }
    },
    telephone: {
      alternate: Number,
      residence: Number,
      office: Number
    }
  },
  provider: {
    status: { type: Boolean, default: false },
    disability: {
      type: { type: String },
      disabilityType: { type: String }
    },
    experience: String,
    about: String,
    availability: String,
    preferredWorkArea: String,
    views: { type: Number, default: 0 },
    gallery: [String],
    services: [{ type: Schema.Types.ObjectId, ref: 'Service' }]
  },
  documents: [docSchema],
  educations: [eduSchema],
  plan: {
    currentPlan: { type: Schema.Types.ObjectId, default: null, ref: 'Plan' },
    payment: { type: Schema.Types.ObjectId, default: null, ref: 'Payment' },
    expiryDate: { type: Date, default: new Date('1950-01-01T00:00:00.000Z') },
  },
  referralCode: { type: String, trim: true },
  wallet: { type: Number, default: 0 },
  fcmToken: { type: String },
  password: { type: String },
  passwordResetToken: String,
  passwordResetExpires: Date,
  auth: { type: String, default: 'email' },
  disabled: { type: Boolean, default: false },
  approved: { type: Boolean, default: false },
  verified: {
    email: { type: Boolean, default: false },
    mobile: { type: Boolean, default: false }
  },
  createdAt: {
    type: Date,
    default: Date.now,
    required: true
  },
  updatedAt: {
    type: Date,
    default: Date.now,
    required: true
  }
}, { collation: { locale: 'en', strength: 2 } });

schema.statics.hashPassword = function hashPassword(password) {
  return bcrypt.hashSync(password, 10);
}

schema.methods.isValid = function (hashedPassword) {
  return bcrypt.compareSync(hashedPassword, this.password);
}

const User = mongoose.model('User', schema);
module.exports = {
  User
}