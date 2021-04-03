const express = require('express');
var pincodeDirectory = require('india-pincode-lookup');
const router = express.Router();

router.get('/pincode/:pincode', (req, res) => {
  const pincode = req.params.pincode;
  var data = pincodeDirectory.lookup(pincode);
  res.status(200).json(data);
})

module.exports = router;