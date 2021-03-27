var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var schema = new Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  originalPrice: {
    type: Number,
    required: true
  },
  discountPrice: {
    type: Number,
  },
  discount: {
    type: Number,
    default: 0
  },
  duration: {         // days
    type: Number,
    required: true
  },
  services: {
    type: Array,
    required: true
  },
  gst: {
    type: Number,
    required: true
  },
  userType: {
    type: String,
    required: true,
    trim: true
  },
  planType: {
    type: String,
    trim: true
  },
  boost: {
    multiState: { type: Boolean, default: false },
    days: { type: Number, default: 0 }
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

module.exports = mongoose.model('Plan', schema);
