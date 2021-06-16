var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var schema = new Schema({
  name: {
    type: String,
    trim: true,
    required: true
  },
  email: {
    type: String,
    trim: true,
    required: true
  },
  mobile: {
    type: String,
    trim: true,
    required: true
  },
  subject: {
    type: String,
    trim: true,
    required: true
  },
  description: {
    type: String,
    trim: true,
    required: true
  },
  user: {
    userId: Schema.ObjectId,
    userType: String
  },
  createdAt: {
    type: Date,
    required: true,
    default: Date()
  }
});

const Feedback = mongoose.model('Feedback', schema);
module.exports = { Feedback }