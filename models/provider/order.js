const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const serviceSchema = new Schema({
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
  }
}, { _id: false });

const schema = new Schema({
  provider: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  customer: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  services: [serviceSchema],
  totalPrice: {
    type: Number,
    default: 0,
    required: true
  },
  status: {
    type: Number,
    required: true,
    default: 0
  },
  bookingDate: {
    type: Date
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

const Order = mongoose.model('Order', schema);
module.exports = {
  Order
}