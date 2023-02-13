var nodemailer = require('nodemailer');
module.exports = function sendMail(emailRecipient, emailSubject, emailBody){
  var transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: 'creditme.ug.info@gmail.com',
      pass: 'xkubwidoohzorewf'
    }
  });
  
  var mailOptions = {
    from:'CreditMe <creditme.ug.info@gmail.com>',
    to: emailRecipient,
    subject: emailSubject,
    html: emailBody
  };
  
  transporter.sendMail(mailOptions, function(error, info){
    if (error) {
      console.log(error);
    } else {
      console.log('Email sent: ' + info.response);
    }
  });
}