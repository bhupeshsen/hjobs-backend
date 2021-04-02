const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const Plan = require('../models/plan');

const schema = new Schema({
  bcCode: { type: String, default: null },
  user: { type: Schema.Types.ObjectId, required: true, ref: 'User' },
  plan: { type: Schema.Types.ObjectId, required: true, ref: 'Plan' },
  payment: { type: Number, required: true },
  paymentId: { type: String, required: true, trim: true },
  orderId: { type: String, required: true, trim: true },
  createdAt: { type: Date, required: true, default: Date.now() }
});

module.exports = mongoose.model('Payment', schema);
