const jwt = require('jsonwebtoken');
const fs = require('fs');
const mailjet = require('node-mailjet')
  .connect('b85ce2bd125ace1e28789d59c2161f22', '42ed6df7a46cdf0a157e336242068a3d');

// PRIVATE and PUBLIC key
var privateKEY = fs.readFileSync(__dirname + '/../config/jwt.key', 'utf8');

var issuer = 'admin.hindustaanjobs.com';        // Issuer 
var audience = 'hindustaanjobs.com';            // Audience

module.exports.sendMail = async function (emailId, name, subject, txtMessage, htmlMessage) {
  return await mailjet
    .post("send", { 'version': 'v3.1' })
    .request({
      "Messages": [
        {
          "From": {
            "Email": "noreply@hindustaanjobs.com",
            "Name": "Hindustaan Jobs"
          },
          "To": [
            {
              "Email": emailId,
              "Name": name
            }
          ],
          "Subject": subject,
          "TextPart": txtMessage,
          "HTMLPart": htmlMessage
        }
      ]
    });
}

module.exports.joogleMail = async function (txtMessage, htmlMessage) {
  return await mailjet
    .post("send", { 'version': 'v3.1' })
    .request({
      "Messages": [
        {
          "From": {
            "Email": "noreply@jooglekar.com",
            "Name": "Joogle Infotech"
          },
          "To": [
            {
              "Email": 'info@jooglekar.com',
              "Name": 'Joogle Infotech'
            }
          ],
          "Subject": 'Your form, Contact us, has new responses.',
          "TextPart": txtMessage,
          "HTMLPart": htmlMessage
        }
      ]
    });
}