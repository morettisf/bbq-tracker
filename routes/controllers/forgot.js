const User = require('../../models/users');
const async = require('async');
const crypto = require('crypto');
const nodemailer = require('nodemailer');

module.exports = {
  get: function(req, res, next) {

    let ejs = {
      title: 'Forgot Username & Password | BBQTracker', 
      user: req.session.passport, 
      errors: null, 
      message: null, 
      username: null, 
      avatar: null
    };

    return res.render('forgot', ejs);

  },
  post: function(req, res, next) {

    async.waterfall([
    function(done) {
      crypto.randomBytes(20, function(err, buf) {
        var token = buf.toString('hex');
        done(err, token);
      });
    },
    function(token, done) {
      User.findOne({ email: req.body.email.toLowerCase() }, function(err, user) {
        if (!user) {

          let ejs = {
            title: 'Forgot Username & Password | BBQTracker', 
            user: req.session.passport, 
            errors: 'No account with that email address exists', 
            message: null, 
            username: null, 
            avatar: null
          };

          return res.render('forgot', ejs);
        }

        user.resetPasswordToken = token;
        user.resetPasswordExpires = Date.now() + 3600000; // 1 hour

        user.save(function(err) {
          done(err, token, user);
        });
      });
    },
    function(token, user, done) {
      var smtpTransport = nodemailer.createTransport({
        service: 'Gmail',
        auth:{
          type: 'OAuth2',
          user: 'grazingcattlebbq@gmail.com',
          clientId: process.env.CLIENT_ID,
          clientSecret: process.env.CLIENT_SECRET,
          refreshToken: process.env.REFRESH_TOKEN
        }
      });
      var mailOptions = {
        to: user.email,
        from: 'grazingcattlebbq@gmail.com',
        subject: 'BBQTracker Username & Password Reset',
        text: 'Hello,\n\n' + 
          'Username: ' + user.username + '\n\n' +
          'To reset your password, please click on the following link, or paste this into your browser to complete the process:\n\n' +
          'http://' + req.headers.host + '/reset/' + token + '\n\n' +
          'If you did not request this, please ignore this email and your password will remain unchanged.\n'
      };
      smtpTransport.sendMail(mailOptions, function(err) {

        if (err) {
          console.log('Error: ', err)
        }
        else {
          console.log('Email Sent')

          let ejs = {
            title: 'Forgot Username & Password | BBQTracker', 
            user: req.session.passport, 
            errors: null, 
            message: 'An e-mail has been sent to ' + user.email, 
            username: null, 
            avatar: null
          };

          res.render('forgot', ejs);
          done(err, 'done');
        }
      });
    }
  ], function(err) {
    if (err) return next(err);
    res.redirect('/forgot');
  });
  }
}