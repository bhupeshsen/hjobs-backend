var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var schema = new Schema({
  question: {
    type: String,
    trim: true,
    required: true
  },
  answer: {
    type: String,
    trim: true,
    required: true
  },
  userType: {
    type: String,
    trim: true,
    required: true
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

module.exports = mongoose.model('FAQ', schema);