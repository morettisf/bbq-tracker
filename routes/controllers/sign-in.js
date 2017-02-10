const User = require('../../models/users')
const bcrypt = require('bcryptjs')
const passport = require('passport')
const LocalStrategy = require('passport-local').Strategy

module.exports = {

  get: function(req, res, next) {

      var ejs = {
        title: 'Sign In | BBQ Tracker', 
        user: req.session.passport, 
        errors: null, 
        message: req.session.message, 
        username: null, 
        avatar: null
      }

      res.render('sign-in', ejs)
    },
  
  post: function(req, res, next) {
    passport.authenticate('local-sign-in', function(err, user, info) {

      if (err) throw err

      var userReq = {
        username: req.body.username.toLowerCase(),
        password: req.body.password
      }

      var userNameReq = req.body.username.toLowerCase()
      var passwordReq = req.body.password

      if (info) {

        var ejs = {
          title: 'Sign-In | BBQ Tracker', 
          user: req.session.passport, 
          errors: info.message, 
          message: null, 
          username: null, 
          avatar: null
        }

        res.render('sign-in', ejs)
      }

      else {

        req.logIn(userReq, function(err) {

          if (err) { 
            return next(err) 
          }

          return res.redirect('log-history')

        })
      }
    }) (req, res)
  }

}

passport.use('local-sign-in', new LocalStrategy({
  usernameField: 'username',
  passwordField: 'password',
  passReqToCallback: true,
  },
  function(req, userName, password, done) {

    User.findOne({ 'username':  userName }, function(err, user) {

      if (err) throw err

      if (!user) {
        return done(null, false, { message: 'Incorrect username, try again' })
      }
    
      else {

        User.comparePassword(password, user.password, function(err, isMatch) {
          if (err) throw err

          if (isMatch) {
            return done(null, user)
          }
          else {
            return done (null, false, { message: 'Incorrect password, try again'})
          }
        })

      }

    })

}))

passport.serializeUser(function(user, done) {
  done(null, user.id);
})

passport.deserializeUser(function(id, done) {
  User.findById(id, function(err, user) {
    if (err) throw err
    done(err, user);
  })
})