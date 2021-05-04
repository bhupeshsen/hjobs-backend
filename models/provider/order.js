const mongoose = require('mongoose');
const Schema = mongoose.Schema;

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
  services: [{ type: Schema.Types.ObjectId, ref: 'Service' }],
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