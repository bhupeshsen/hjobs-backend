var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var schema = new Schema({
  name: { type: String, trim: true, required: true },
  type: { type: String, trim: true, required: true },
  sector: { type: Array, required: true },
  officialEmail: { type: String, trim: true, required: true },
  phone: { type: Number, required: true },
  gstNumber: { type: String, trim: true, uppercase: true },
  logo: { type: String, trim: true },
  about: { type: String, trim: true },
  perks: { type: String, trim: true },
  gallery: { type: Array, default: [] },
  savedResume: { type: Array, default: [] },
  address: {
    address: { type: String, trim: true },
    state: { type: String },
    city: { type: String },
    locality: { type: String, trim: true },
    pinCode: { type: Number }
  },
  createdAt: {
    type: Date,
    default: Date.now,
    required: true
  },
  updatedAt: {
    type: Date,
    default: Date.now,
    required: true
  },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
});

const Company = mongoose.model('Company', schema);
module.exports = { Company }