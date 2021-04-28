const fseApprove = function (name, email, fseCode) {
  return `<!DOCTYPE html><html><head> <meta name="viewport" content="width=device-width, initial-scale=1"> <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.0.0-beta2/dist/css/bootstrap.min.css" rel="stylesheet" integrity="sha384-BmbxuPwQa2lc/FVzBcNJ7UAyJxM6wuqIj61tLrc4wSX0szH/Ev+nYRRuWlolflfl" crossorigin="anonymous"></head><body> <div class="container"> <div class="row"> <img src="https://api.hindustaanjobs.com/img/mail-header.png" alt="hindustaanjobs"> </div><div class="row"> <h6>Congratulation</h6> <p>Dear ${name},</p><p>Your Login id is <b>${email}</b></p><p>Your FSE Code - <b>${fseCode}</b></p><p>Regards,<br>Hindustaan Jobs.</p></div><div class="row"> <img src="https://api.hindustaanjobs.com/img/mail-footer.png" alt="hindustaanjobs"> </div></div></div><script src="https://cdn.jsdelivr.net/npm/bootstrap@5.0.0-beta2/dist/js/bootstrap.bundle.min.js" integrity="sha384-b5kHyXgcpbZJO/tY9Ul7kGkf1S0CWuKcCD38l8YkeH8z8QjE0GmW1gYU5S9FOnJ0" crossorigin="anonymous"></script></body></html>`
}

module.exports = {
  fseApprove
};