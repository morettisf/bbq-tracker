const User = require('../../models/users')

module.exports = {

  get: function(req, res, next) {

    var ejs = {
      title: 'Register | BBQ Tracker', 
      user: req.session.passport, 
      errors: null, 
      username: null, 
      avatar: null
    }

    res.render('register', ejs)
  },

  post: function(req, res, next) {

    var userInfo = { 
      username: req.body.username.toLowerCase(), 
      email: req.body.email, 
      password: req.body.password, 
      avatar: '../images/cow.svg' 
    }

    var resInfo = { 
      username: req.body.username.toLowerCase(), 
      email: req.body.email, 
      password: req.body.password 
    }

    var userNameReq = req.body.username.toLowerCase()
    var emailReq = req.body.email
    var passwordReq = req.body.password
    var password2Req = req.body.password2

    var errors = []

    if (userNameReq === '') {
      errors.push('Supply a username')
    }

    if (userNameReq.indexOf(' ') !== -1) {
      errors.push('No spaces allowed in username')
    }

    if (emailReq === '') {
      errors.push('Supply an email address')
    }

    if (emailReq.indexOf(' ') !== -1) {
      errors.push('No spaces allowed in email address')
    }

    if (emailReq.indexOf('@') < 0) {
      errors.push('Email does not contain @')
    }

    if (emailReq.indexOf('.') < 0) {
      errors.push('Email does not contain .')
    }

    if (passwordReq === '') {
      errors.push('Supply a password')
    }

    if (passwordReq.length < 5) {
      errors.push('Password must be a minimum of 5 characters')
    }

    if (!/[0-9]/.test(passwordReq)) {
      errors.push('Password must contain at least one number')
    }

    if (password2Req === '') {
      errors.push('Confirm your password')
    }

    if (passwordReq !== password2Req) {
      errors.push('Passwords do not match')
    }

    if (errors.length > 0) {

      var ejs = {
        title: 'Register | BBQ Tracker', 
        user: req.session.passport, 
        errors, 
        username: null, 
        avatar: null
      }

      res.render('register', ejs)

    }

    else {

      User.findOne({ username: userNameReq }, function(err, user) {

        if (err) throw err

        if (user) {

          var ejs = {
            title: 'Register | BBQ Tracker', 
            user: req.session.passport, 
            errors: ['Username already taken, please try another'], 
            username: null, 
            avatar: null
          }

          res.render('register', ejs)

        }

        else {

          User.findOne({ email: emailReq }, function(err, user) { 

            if (err) throw err

            if (user) {

              var ejs = {
                title: 'Register | BBQ Tracker', 
                user: req.session.passport, 
                errors: ['Email already in use, please try another'], 
                username: null, 
                avatar: null
              }

              res.render('register', ejs)

            }

            else {

              bcrypt.genSalt(10, function(err, salt) {
                bcrypt.hash(userInfo.password, salt, function(err, hash) {
                  userInfo.password = hash
                  User.create(userInfo)
                    .then(function(){
                      req.session.message = 'Registration successful, now sign in'
                      res.redirect('/sign-in')
                    })
                    .catch(next)
                })
              })
              
            }

          })

        }

      })

    }

  }

}