const User = require('../../models/users');
const async = require('async');
const crypto = require('crypto');
const nodemailer = require('nodemailer');
const bcrypt = require('bcryptjs');

module.exports = {
  get: function(req, res, next) {

    User.findOne({ resetPasswordToken: req.params.token, resetPasswordExpires: { $gt: Date.now() } }, function(err, user) {
      if (!user) {

        let ejs = {
          title: 'Reset Password | BBQTracker', 
          user: req.session.passport, 
          errors: ['Password reset token is invalid or has expired'], 
          message: null, 
          username: null, 
          avatar: null,
          token: req.params.token
        };

        return res.render('reset', ejs);

      }

      let ejs = {
        title: 'Reset Password | BBQTracker', 
        user: req.session.passport, 
        errors: [], 
        message: null, 
        username: null, 
        avatar: null,
        token: req.params.token
      };

      res.render('reset', ejs);
    });
  },

  post: function(req, res, next) {

    let errors = [];

    let passwordReq = req.body.password;
    let password2Req = req.body.password2;

    if (passwordReq === '') {
      errors.push('Supply a password');
    }

    if (passwordReq.length < 5) {
      errors.push('Password must be a minimum of 5 characters');
    }

    if (!/[0-9]/.test(passwordReq)) {
      errors.push('Password must contain at least one number');
    }

    if (password2Req === '') {
      errors.push('Confirm your password');
    }

    if (passwordReq !== password2Req) {
      errors.push('Passwords do not match');
    }

    if (errors.length > 0) {

      let ejs = {
        title: 'Reset Password | BBQTracker', 
        user: req.session.passport, 
        errors: errors, 
        message: null, 
        username: null,
        avatar: null,
        token: req.params.token
      };

      return res.render('reset', ejs);

    }

    async.waterfall([
        function(done) {
          User.findOne({ resetPasswordToken: req.params.token, resetPasswordExpires: { $gt: Date.now() } }, function(err, user) {
            if (!user) {

              let ejs = {
                title: 'Reset Password | BBQTracker', 
                user: req.session.passport, 
                errors: 'Password reset token is invalid or has expired.', 
                message: null, 
                username: username, 
                avatar: null
              };

              return res.render('reset', ejs);
            }

            let newPassword = req.body.password;

            bcrypt.genSalt(10, function(err, salt) {
              bcrypt.hash(newPassword, salt, function(err, hash) {
                newPassword = hash;

                user.password = newPassword;
                user.resetPasswordToken = undefined;
                user.resetPasswordExpires = undefined;

                user.save(function(err) {
                  req.logIn(user, function(err) {
                    done(err, user);
                  });
                });

              })
            })

          });
        },
        function(user, done) {
          var smtpTransport = nodemailer.createTransport({
            service: 'Gmail',
            auth: {
              user: 'grazingcattlebbq@gmail.com',
              pass: process.env.EMAIL
            }
          });
          var mailOptions = {
            to: user.email,
            from: 'grazingcattlebbq@gmail.com',
            subject: 'Your password has been changed',
            text: 'Hello ' + user.username + ',\n\n' +
              'This is a confirmation that the password for your account ' + user.email + ' has just been changed.\n'
          };
          smtpTransport.sendMail(mailOptions, function(err) {

            return res.redirect('/log-history?message=Success!%20Your%20password%20has%20been%20changed');

            done(err);
          });
        }
      ], function(err) {
        res.redirect('/');
      });
  }
}