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

module.exports.passwordMail = async function (name, email, userType) {
  const token = jwt.sign({
    name: name,
    email: email,
    userType: userType
  }, privateKEY, {
    issuer: issuer, audience: audience,
    algorithm: 'RS256', expiresIn: '24h'
  });

  const txtMessage = `Dear ${name},On your request, we have sent the login credentials of your account as mentioned below. 
      Your Login Details 
      User Email: ${email} 
      Please click on the below link to create new your password- 
      ${req.protocol}://${req.get('host')}/change-password/${token} 
      Regards, Joogle Team 
      This is An Auto Generated Notification Email. Please Do Not Respond To This.`;
  const htmlMessage = `Dear <b>${name}</b>,<br>On your request, 
  we have sent the login credentials of your account as mentioned below.
      <br><b>Your Login Details</b><br><br><br>
      User Email: ${email}<br><br>
      Please click on the below link to create new your password-<br><br>
      <a href="${req.protocol}://${req.get('host')}/change-password/${token}">
      ${req.protocol}://${req.get('host')}/change-password/${token}
      </a><br><br><br>Regards,<br><br>Joogle Team<br><br>
      This is An Auto Generated Notification Email. Please Do Not Respond To This.`;

  // Send Email
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
              "Email": email,
              "Name": name
            }
          ],
          "Subject": 'Create new password',
          "TextPart": txtMessage,
          "HTMLPart": htmlMessage
        }
      ]
    });
}
