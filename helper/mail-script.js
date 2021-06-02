const fseApprove = function (name, email, fseCode) {
  return `<!DOCTYPE html><html><head> <meta name="viewport" content="width=device-width, initial-scale=1"> <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.0.0-beta2/dist/css/bootstrap.min.css" rel="stylesheet" integrity="sha384-BmbxuPwQa2lc/FVzBcNJ7UAyJxM6wuqIj61tLrc4wSX0szH/Ev+nYRRuWlolflfl" crossorigin="anonymous"></head><body> <div class="container"> <div class="row"> <img src="https://api.hindustaanjobs.com/img/mail-header.png" alt="hindustaanjobs"> </div><div class="row"> <h6>Congratulation</h6> <p>Dear ${name},</p><p>Your Login id is <b>${email}</b></p><p>Your FSE Code - <b>${fseCode}</b></p><p>Regards,<br>Hindustaan Jobs.</p></div><div class="row"> <img src="https://api.hindustaanjobs.com/img/mail-footer.png" alt="hindustaanjobs"> </div></div></div><script src="https://cdn.jsdelivr.net/npm/bootstrap@5.0.0-beta2/dist/js/bootstrap.bundle.min.js" integrity="sha384-b5kHyXgcpbZJO/tY9Ul7kGkf1S0CWuKcCD38l8YkeH8z8QjE0GmW1gYU5S9FOnJ0" crossorigin="anonymous"></script></body></html>`
}

const businessPartnerPassword = function (baseUrl, name, email, token) {
  return `Dear <b>${name}</b>,<br>On your request, 
  we have sent the login credentials of your account as mentioned below.
      <br><b>Your Login Details</b><br>
      User Email: ${email}<br><br>
      Please click on the below link to create new your password-<br><br>
      <a href="${baseUrl}/change-password/${token}">Reset Password</a>
      <br><br><br>Regards,<br>Joogle Team<br><br>
      This is An Auto Generated Notification Email. Please Do Not Respond To This.`;
}

const resetPassword = function (baseUrl, name, email, token) {
  return `Dear <b>${name}</b>,<br>On your request, we have sent the login credentials of your account as mentioned below.
<br><b>Your Login Details</b><br>
User Email: ${email}<br><br>
Please click on the below button to reset your password-<br>
<a href="${baseUrl}/auth/reset-password?token=${token}">Reset Password</a>
<br><br><br>Regards,<br>Joogle Team<br><br>
This is An Auto Generated Notification Email. Please Do Not Respond To This.`
}

const welcomeMail = function (name) {
  return `<html><head><meta name="viewport" content="width=device-width, initial-scale=1.0"><style>.container{margin-top:10px;margin-left:25%;margin-right:25%;font-size:19px}.a{margin-left:5%}@media only screen and (max-width: 620px){.b{width:100%;margin:0px}}.c{padding-left:30px;padding-right:30px;padding-top:0px;padding-bottom:4px}.card{box-shadow:0 4px 8px 0 rgba(0, 0, 0, 0.2)}</style></head><body><div class="container card b"><p><img src="https://api.hindustaanjobs.com/img/mail-header.png" class="img-fluid" alt="Snow" style="width:100%;"></p><div class="c"><h4>Hello ${name},</h4><h4>Greetings for the day!</h4><div class="a"><h4>It’s great to have you on board with us.</h4><h4>HindustaanJobs, a hybrid next generation job portal which provides the information of various jobs posted by the recruiters to the job seekers according to their relevant search.</h4><h4>Bridge between home service seekers and providers, job branding facility and job boosting facility to recruiters, learn and earn facility for individuals and career guidance for students.</h4><h4>With its user-friendly web(Hyperlink website) and mobile application(Hyperlink to app store) each user gets personalized job alerts and an easy application process. Recruiters can boost their job and filter out relevant candidate, also can directly access resumes by choosing relevant plans.</h4></div><p>Mr. Rajput (Director) wants to talk to you. Click here(hyperlink) to connect with him.</p><p>Click Here(Hyperlink) to get personalized Suggestions and to be aware of more opportunities.</p><p>For any queries, reach out to us at <a href="https://Info@hindustaanjobs.com/" target="_blank">Info@hindustaanjobs.com</a></p><center><a href='https://play.google.com/store/apps/details?id=com.hindustaanjobs.app&pcampaignid=pcampaignidMKT-Other-global-all-co-prtnr-py-PartBadge-Mar2515-1'> <img alt='Get it on Google Play' src='https://play.google.com/intl/en_us/badges/static/images/badges/en_badge_web_generic.png' height="48px" /></a></center></div><p><img src="https://api.hindustaanjobs.com/img/mail-footer.png" alt="Snow" style="width: 100%;"></p></div></body></html>`
}

const subscribedMail = function() {
  return `<!DOCTYPE><html><head><meta name="viewport" content="width=device-width, initial-scale=1.0"><style>.container{margin-top:10px;margin-left:25%;margin-right:25%;font-size:19px}.a{margin-left:5%}@media only screen and (max-width: 620px){.b{width:100%;margin:0px}}.c{padding-left:30px;padding-right:30px;padding-top:0px;padding-bottom:4px}.card{box-shadow:0 4px 8px 0 rgba(0, 0, 0, 0.2)}</style></head><body><div class="container b card"><p><img src="https://api.hindustaanjobs.com/img/mail-header.png" class="img-fluid" alt="Snow" style="width:100%;"></p><div class="c"><br><p>Hello Achiever,</p> <br><p class="a">I’m happy to see you here. It’s great that you’ve already taken the first step towards your dream life. Not everyone has the courage to work for the dreams they speak about. Here’s a short video link(hyperlink to yt video) to get you started. You are a one genuine person dedicated to make yourself proud.</p> <br><p>Click Here(hyperlink google form) and let me know if I can help you in anyway.</p> <br><p>Click here(mailing list subscription) to get weekly dose of motivation straight being delivered to your inbox.</p></div><p><img src="https://api.hindustaanjobs.com/img/mail-footer.png" alt="Snow" style="width: 100%;"></p></div></body></html>`
}

const m = function (name) {
  return `<!DOCTYPE><html><head><meta name="viewport" content="width=device-width, initial-scale=1.0"><style>.container{margin-top:10px;margin-left:25%;margin-right:25%;font-size:19px}.a{margin-left:5%}@media only screen and (max-width: 620px){.b{width:100%;margin:0px}}.c{padding-left:30px;padding-right:30px;padding-top:0px;padding-bottom:4px}.card{box-shadow:0 4px 8px 0 rgba(0, 0, 0, 0.2)}</style></head><body><div class="container b card"><p><img src="https://api.hindustaanjobs.com/img/mail-header.png" class="img-fluid" alt="Snow" style="width:100%;"></p><div class="c"><p>Sub:- You are missing out on something exclusive!!</p> <br><p>Hello ${name},</p> <br><p class="a"> We understand being an Employer your one of the major concerns is to get honest and competent employees. From finding the most suitable candidate to you being highlighted as the best employer all over India. We got all your needs covered.</p> <br><p>Click Here(Hyperlink to payment page) to unlock your real potential.</p> <br><p>In case of queries, reach out to us at <a href="https://Info@hindustaanjobs.com/" target="_blank">Info@hindustaanjobs.com</a></p></div><p><img src="https://api.hindustaanjobs.com/img/mail-footer.png" alt="Snow" style="width: 100%;"></p></div></body></html>`
}

module.exports = {
  fseApprove, resetPassword, welcomeMail, businessPartnerPassword, subscribedMail
};