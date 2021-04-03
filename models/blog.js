var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var schema = new Schema({
  title: {
    type: String,
    trim: true,
    required: true
  },
  description: {
    type: String,
    trim: true,
    required: true
  },
  category: {
    type: String,
    trim: true,
    required: true
  },
  published: {
    type: Boolean,
    default: true
  },
  createdAt: {
    type: Date,
    required: true,
    default: Date.now()
  },
  updateAt: {
    type: Date,
    required: true,
    default: Date.now()
  }
});

module.exports = mongoose.model('Blog', schema);