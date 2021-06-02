var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var schema = new Schema({
  title: {
    type: String,
    trim: true,
    required: true
  },
  thumbnail: {
    type: String,
    trim: true,
    required: true
  },
  description: {
    type: String,
    trim: true,
    required: true
  },
  content: {
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
  postedBy: {
    type: Schema.Types.ObjectId,
    ref: 'Admin',
    required: true
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

const Blog = mongoose.model('Blog', schema);
module.exports = { Blog };