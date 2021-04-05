var mongoose = require('mongoose');
var Schema = mongoose.Schema;

const schema = new Schema({
  name: {
    type: String,
    unique: true,
    trim: true
  },
  createdAt: {
    type: Date,
    default: Date.now(),
  }
});

const schemaSpecialization = new Schema({
  name: {
    type: String,
    unique: true,
    trim: true
  },
  specialization: {
    type: Array,
    trim: true,
    default: []
  },
  createdAt: {
    type: Date,
    default: Date()
  }
});

const schemaTutorCat = new Schema({
  category: {
    type: String,
    trim: true
  },
  class: {
    type: String,
    trim: true
  },
  subject: {
    type: String,
    trim: true
  },
  createdAt: {
    type: Date,
    default: Date()
  }
});
schemaTutorCat.index({ category: 1, class: 1, subject: 1 }, { unique: true })

const schemaSkill = new Schema({
  name: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  skills: {
    type: Array,
    required: true
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

const University = mongoose.model('University', schema);
const Qualification = mongoose.model('Qualification', schema);
const Occupation = mongoose.model('Occupation', schema);
const Sector = mongoose.model('Sector', schema);
const Infrastructure = mongoose.model('Infrastructure', schema);
const Designation = mongoose.model('Designation', schema);
const Department = mongoose.model('Department', schema);
const Specialization = mongoose.model('Specialization', schemaSpecialization);
const TutorCategory = mongoose.model('TutorCategory', schemaTutorCat);
const Skill = mongoose.model('Skill', schemaSkill);

module.exports = {
  University, Qualification, Occupation, Sector, Infrastructure,
  Designation, Department, Specialization, TutorCategory, Skill
}