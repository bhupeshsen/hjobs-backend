var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var schema = new Schema({
  skills: {
    type: String,
    required: true,
    trim: true
  },
  designation: {
    type: String,
    required: true,
    trim: true
  },
  location: {
    type: String,
    required: true,
    trim: true
  },
  experience: {
    type: String,
    required: true,
    trim: true
  },
  salary: {
    type: String,
    required: true,
    trim: true
  },
  department: {
    type: String,
    required: true,
    trim: true
  },
  postedBy: {
    type: Schema.Types.ObjectId,
    required: true,
    trim: true,
    ref: 'User'
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

module.exports = mongoose.model('CustomAlert', schema);