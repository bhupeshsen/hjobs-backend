const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const extraFieldSchema = new Schema({
  type: { type: String, trim: true },
  question: { type: String, trim: true },
  answer: { type: String, trim: true }
}, { _id: false });

const scrQuestSchema = new Schema({
  question: { type: String, trim: true },
  answer: { type: String, trim: true }
}, { _id: false });

// 0 => Applied; 1 => View; 2 => Shortlist; 3 => Wishlist; 4 => Hired;
const appliedUserSchema = new Schema({
  user: { type: Schema.Types.ObjectId, ref: 'User' },
  status: { type: Number, default: 0 },
  scrQuest: [scrQuestSchema]
}, { _id: false });

const schema = new Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  designation: {
    type: String,
    trim: true
  },
  location: {
    type: String,
    trim: true
  },
  state: {
    type: String,
    trim: true
  },
  city: {
    type: String,
    trim: true
  },
  pinCode: {
    type: Number
  },
  employmentType: {
    type: String,
    trim: true
  },
  jobType: {
    type: String,
    trim: true
  },
  salary: {
    type: String,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  responseEmail: {
    type: String,
    trim: true
  },
  deadline: {
    type: Date
  },
  experience: {
    type: String,
    trim: true
  },
  education: {
    type: String,
    trim: true
  },
  skills: {
    type: Array,
  },
  vacancies: Number,
  postedBy: {
    type: Schema.Types.ObjectId,
    required: true,
    ref: 'Company'
  },
  views: {
    type: Number,
    default: 0
  },
  appliedBy: [appliedUserSchema],
  hiredCandidates: [{
    type: Schema.Types.ObjectId,
    ref: 'User'
  }],
  shortLists: [{
    type: Schema.Types.ObjectId,
    ref: 'User'
  }],
  boost: {
    multiState: { type: Boolean },
    expiryDate: { type: Date, default: new Date('1950-01-01T00:00:00.000Z') },
  },
  extraFields: {
    type: [extraFieldSchema]
  },
  createdAt: {
    type: Date,
    default: Date.now(),
    required: true
  },
  updatedAt: {
    type: Date,
    default: Date.now(),
    required: true
  }
});

const Job = mongoose.model('Job', schema);
module.exports = { Job }