const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const schema = new Schema({
  categoryName: {
    type: String,
    required: true,
    trim: true
  },
  serviceName: {
    type: String,
    required: true,
    trim: true
  },
  price: {
    type: Number,
    required: true,
  },
  user: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  },
  isEnabled: {
    type: Boolean,
    default: true
  },
});

const Service = mongoose.model('Service', schema);
module.exports = {
  Service
}