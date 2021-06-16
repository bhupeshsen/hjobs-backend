const express = require('express');
const pincodeDirectory = require('india-pincode-lookup');
const ifsc = require('ifsc');
const { University, Qualification, Occupation, Sector, Skill,
  Infrastructure, Designation,
  Specialization, Department, TutorCategory } = require('../models/data');
const router = express.Router();

router.get('/pincode/:pincode', (req, res) => {
  const pincode = req.params.pincode;
  var data = pincodeDirectory.lookup(pincode);
  res.status(200).json(data);
})

router.get('/districts', (req, res) => {
  
});

router.get('/ifsc/:code', (req, res) => {
  const code = req.params.code;

  if (!ifsc.validate(code)) {
    return res.status(400).json({ message: 'Invalid IFSC code' });
  }

  ifsc.fetchDetails(code).then(function (data) {
    return res.status(200).json(data);
  });
})

router.get('/universities', (req, res) => {
  University.find((err, doc) => {
    if (err) return res.status(404).json({ message: 'not found!' })
    var names = doc.map(function (item) {
      return item['name'];
    });
    res.status(200).json(names);
  }).sort({ name: 1 });
});

router.get('/qualifications', (req, res) => {
  Qualification.find((err, doc) => {
    if (err) return res.status(404).json({ message: 'not found!' })
    var names = doc.map(function (item) {
      return item['name'];
    });
    res.status(200).json(names);
  }).sort({ name: 1 });
});

// Occupation
router.get('/occupations', (req, res) => {
  Occupation.find((err, doc) => {
    if (err) return res.status(400).json({ message: 'not found' });
    var names = doc.map(function (item) {
      return item['name'];
    });
    res.status(200).json(names);
  }).sort({ name: 1 });
});

// Sector
router.get('/sectors', (req, res) => {
  Sector.find({}, { _id: 0, name: 1 }, (err, doc) => {
    if (err) return res.status(400).json({ message: 'not found' });
    var names = doc.map(function (item) {
      return item['name'];
    });
    res.status(200).json(names);
  }).sort({ name: 1 });
});

// Skills
router.get('/skills', (req, res) => {
  Skill.find({ 'name': 'seeker' }, { skills: 1 }, (err, doc) => {
    if (err) return res.status(400).json({ message: 'not found' });
    var skills = doc[0].skills;
    skills.sort();
    res.status(200).json(skills);
  })
});

// Services
router.get('/categories', (req, res) => {
  Skill.find({ 'name': 'provider' }, { skills: 1 }, (err, doc) => {
    if (err) return res.status(400).json({ message: 'not found' });
    var skills = doc[0].skills;
    skills.sort();
    res.status(200).json(skills);
  })
});

router.get('/services', (req, res) => {
  Service.find((err, results) => {
    if (err) return res.status(400).json(err);
    return res.status(200).json(results);
  });
});

// Infrastructure
router.get('/infrastructures', (req, res) => {
  Infrastructure.find({}, (err, doc) => {
    if (err) return res.status(400).json({ message: 'not found' });
    var names = doc.map(function (item) {
      return item['name'];
    });
    res.status(200).json(names);
  }).sort({ name: 1 });;
});

// Designation
router.get('/designations', (_, res) => {
  Designation.find({}, { _id: 0, name: 1 }, (err, doc) => {
    if (err) return res.status(400).json({ message: 'not found' });
    var names = doc.map(function (item) {
      return item['name'];
    });
    return res.status(200).json(names);
  }).sort({ name: 1 });
});

// Course & Specialization
router.get('/courses', (_req, res) => {
  Specialization.find((err, doc) => {
    if (err) return res.status(400).json(err);
    var courses = doc.map(function (item) {
      return item['name'];
    });
    res.status(200).json(courses);
  }).sort({ name: 1 });
});

// Specializations
router.get('/specializations', (req, res) => {
  const course = req.query.course;
  Specialization.find({ name: course }, (err, doc) => {
    if (err) return res.status(400).json(err);
    var specializations = doc.map(function (item) {
      return item['specialization'];
    });
    specializations.sort();
    res.status(200).json(specializations[0]);
  });
});

// Departments
router.get('/departments', (_req, res) => {
  Department.find((err, results) => {
    if (err) return res.status(400).json(err);
    var names = results.map(function (item) {
      return item['name'];
    });
    res.status(200).json(names);
  }).sort({ name: 1 });
});

// Tutor
router.get('/tutor/categories', (_req, res) => {
  TutorCategory.find((err, results) => {
    if (err) return res.status(400).json(err);
    var names = results.map((item) => item['category']);
    res.status(200).json(names);
  }).sort({ category: 1 });
});

router.get('/tutor/classes', (req, res) => {
  const category = req.query.category;

  TutorCategory.find({ category: category }, (err, results) => {
    if (err) return res.status(400).json(err);
    var names = results.map((item) => item['class']);
    res.status(200).json(names);
  }).sort({ category: 1 });
});

router.get('/tutor/subjects', (req, res) => {
  const category = req.query.category;
  const _class = req.query.class;

  TutorCategory.find({ category: category, class: _class }, (err, results) => {
    if (err) return res.status(400).json(err);
    var names = results.map((item) => item['subject']);
    res.status(200).json(names);
  }).sort({ category: 1 });
});

function onlyUnique(value, index, self) {
  return self.indexOf(value) === index;
}

function toTitleCase(str) {
  return str.replace(/\w\S*/g, function (txt) {
    return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
  });
}

module.exports = router;