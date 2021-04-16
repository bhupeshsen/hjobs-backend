const config = {}

/// Razorpay
const razorpayKey_test = 'rzp_test_ypd8s7ioHEotp8';
const razorpaySecret_test = 'VuZIBXA93dZ19ROFOFYqUEpF';
const razorpayKey_live = 'rzp_live_Lj4OZvZ1I5nP8J';
const razorpaySecret_live = '9oTeQvCZgZiYwZxwKH3TAEsz';

config.razorpayKey = razorpayKey_test;
config.razorpaySecret = razorpaySecret_test;

// Mailchimp
config.mailchimp = '08f19c46a4ac5068b330059771e226de-us2';

// Documents
config.pathImages = '/images/'
config.pathDocuments = '/documents/'
config.pathVideosLH = '/videos/local-hunar/'
config.pathCompany = '/images/company/'
config.pathProvider = '/images/provider/'

module.exports = config;