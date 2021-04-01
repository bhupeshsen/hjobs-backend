const express = require('express');
const multer = require('multer');
const company = require('../models/company');
const router = express.Router();

router.post('/company', isValidUser, (req, res) => {
  const body = req.body;
  const data = new company(body);
  saveData(data, res);
})

router.get('/company', isValidUser, (req, res) => {
  company.find({ _id: '606590de1d4ac9f85a7a76f6' })
    .populate('users').then(doc => {
      // if (err) return res.status(400).json(err);
      // console.log(doc.user)
      res.status(200).json(doc);
    })
})

function isValidUser(req, res, next) {
  if (req.isAuthenticated()) next();
  else return res.status(401).json({ message: 'Unauthorized' });
}

async function saveData(data, res) {
  try {
    doc = await data.save();
    console.log(doc)
    return res.status(201).json({ message: 'Data successfully saved!' });
  }
  catch (err) {
    console.log(err)
    return res.status(400).json(err);
  }
};

module.exports = router;