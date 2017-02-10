const User = require('../../models/users')
const bcrypt = require('bcryptjs')

module.exports = {

  get: function(req, res, next) {
    var userId = req.session.passport.user
    var username
    var avatar
    var email

    // grab their username for the nav if logged in
    User.findOne({ _id: userId }, function(err, user) {

      if (err) throw err

      if (user) {
        username = user.username
        avatar = user.avatar
        email = user.email
      }

      else {
        username = null
      }

      var ejs = { 
        title: 'My Account | BBQ Tracker', 
        user: req.session.passport, 
        message: req.query.message || null, 
        error: req.query.error || null, 
        username: username, 
        email: email, 
        avatar: avatar 
      }

      res.render('account', ejs)

    })

  },

  username: function(req, res, next) {
    var userId = req.session.passport.user
    var userNameReq = req.body.username
    var username

    if (userNameReq === '') {
      res.json({ error: 'Supply a new username' })
    }

    if (userNameReq.length > 15) {
      res.json({ error: 'Username is limited to 15 characters' })
    }

    else if (userNameReq.indexOf(' ') !== -1) {
      res.json({ error: 'No spaces allowed in username' })
    }

    else {
      // if valid username, proceed
      User.findOne({ _id: userId }, function(err, user) {

        if (err) throw err

        user.username = userNameReq

        user.logs.forEach(function(log) {
          log.username = user.username
        })

        user.save()

        res.json({ message: 'Username changed' })

      })
    }

  },

  avatar: function(req, res, next) {
    var userId = req.session.passport.user
    var avatarReq = req.body.avatar

    User.findOne({ _id: userId }, function(err, user) {

      if (err) throw err

      user.avatar = avatarReq

      user.save()

      res.json({ message: 'Avatar changed' })

    })

  },

  email: function(req, res, next) {
    var userId = req.session.passport.user
    var emailReq = req.body.email
    var email

    // grab their username for the nav
    User.findOne({ _id: userId }, function(err, user) {

      if (err) throw err

      // run checks on valid username
      if (emailReq === '') {
        res.json({ error: 'Supply an email address' })
      }

      else if (emailReq.indexOf(' ') !== -1) {
        res.json({ error: 'No spaces allowed in email address' })
      }

      else if (emailReq.indexOf('@') < 0) {
        res.json({ error: 'Email does not contain @' })
      }

      else if (emailReq.indexOf('.') < 0) {
        res.json({ error: 'Email does not contain .' })
      }

      else {
        user.email = emailReq

        user.save()

        res.json({ message: 'Email changed' })
      }

    })

  },

  password: function(req, res, next) {
    var userId = req.session.passport.user
    var passwordReq = req.body.password
    var password2Req = req.body.password2

    if (passwordReq === '') {
      res.json({ error: 'Supply a new password' })
    }

    else if (passwordReq.length < 5) {
      res.json({ error: 'Password must be a minimum of 5 characters' })
    }

    else if (!/[0-9]/.test(passwordReq)) {
      res.json({ error: 'Password must contain at least one number' })
    }

    else if (password2Req === '') {
      res.json({ error: 'Confirm your password' })
    }

    else if (passwordReq !== password2Req) {
      res.json({ error: 'Passwords do not match' })
    }

    else {

      User.findOne({ _id: userId }, function(err, user) {
        
        if (err) throw err

        else {
          bcrypt.genSalt(10, function(err, salt) {
            bcrypt.hash(passwordReq, salt, function(err, hash) {
              passwordReq = hash
              user.password = passwordReq
              user.save()
              
              res.json({ message: 'Password changed'})

            })
          })
        }

      })

    }

  },

  delete: function(req, res, next) {
    var userId = req.session.passport.user

    User.findOne({ _id: userId }, function(err, user) {
      user.remove()
      req.session.destroy()
    })

    res.json({ message: 'User deleted' })
  }

}