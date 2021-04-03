var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var uniqueValidator = require('mongoose-unique-validator');

var schema = new Schema({
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

module.exports = mongoose.model('GovtJob', schema);