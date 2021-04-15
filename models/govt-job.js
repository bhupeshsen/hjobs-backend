const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const uniqueValidator = require('mongoose-unique-validator');

const schema = new Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  image: {
    type: String,
    trim: true
  },
  advertiseLink: {
    type: String,
    trim: true
  },
  website: { type: String, trim: true },
  category: { type: String, trim: true },
  qualification: { type: String, trim: true },
  organization: { type: String, trim: true },
  deadline: { type: Date },
  vacancy: { type: Number },
  disabled: { type: Boolean, default: false },
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

schema.plugin(uniqueValidator);

const GovtJob = mongoose.model('GovtJob', schema);
module.exports = { GovtJob }