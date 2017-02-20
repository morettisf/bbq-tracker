const User = require('../models/users')
const passport = require('passport')

const Index = require('./controllers/index')
const Register = require('./controllers/register')
const SignIn = require('./controllers/sign-in')
const Account = require('./controllers/account')
const CreateLog = require('./controllers/create-log')
const ViewLog = require('./controllers/view-log')
const PublicLog = require('./controllers/public-log')
const LogHistory = require('./controllers/log-history')
const About = require('./controllers/about')

module.exports = (app) => {

  app.use(passport.initialize())
  app.use(passport.session())

  app.get('/', Index.get)

  app.get('/register', Register.get)

  app.post('/register', Register.post)

  app.get('/sign-in', SignIn.get)

  app.post('/sign-in', SignIn.post)

  app.get('/account', isLoggedIn, Account.get)

  app.put('/account/username', Account.username)

  app.put('/account/avatar', Account.avatar)

  app.put('/account/email', Account.email)

  app.put('/account/password', Account.password)

  app.delete('/account', Account.delete)

  app.get('/create-log', isLoggedIn, CreateLog.get)

  app.post('/create-log', CreateLog.post)

  app.get('/view-log/:log', isLoggedIn, ViewLog.get)

  app.put('/view-log/:log', ViewLog.put)

  app.get('/public-log/:log', PublicLog.get)

  app.post('/public-log', PublicLog.post)

  app.get('/log-history', isLoggedIn, LogHistory.get)

  app.post('/log-history', LogHistory.post)

  app.put('/log-history', LogHistory.put)

  app.delete('/log-history', LogHistory.delete)

  app.get('/about', About)

  app.get('/logout', function(req, res, next) {
    req.session.destroy(function(err) {
      res.redirect('/')
    })
  })


  // Handle 404 errors
  app.use(function(req, res) {

    var userId
    var username
    var avatar

    // check if this is a logged in user or not
    if (req.session.passport) {
      var userId = req.session.passport.user
    }
    else {
      var userId = null
    }

    // grab their username for the nav if logged in
    User.findOne({ _id: userId }, function(err, user) {

      if (err) throw err

      if (user) {
        username = user.username
        avatar = user.avatar
      }

      else {
        username = null
      }

      var ejs = { 
        title: 'Page Not Found | BBQ Tracker', 
        h1: 'Sorry, page not found!', 
        user: req.session.passport, 
        username: username, 
        avatar: avatar 
      }

      res.status(404)
      res.render('not-found', ejs)
    })
  })

  // Handle 500 errors
  app.use(function(error, req, res, next) {
    var userId
    var username
    var avatar

    // check if this is a logged in user or not
    if (req.session.passport) {
      var userId = req.session.passport.user
    }
    else {
      var userId = null
    }

    // grab their username for the nav if logged in
    User.findOne({ _id: userId }, function(err, user) {

      if (err) throw err

      if (user) {
        username = user.username
        avatar = user.avatar
      }

      else {
        username = null
      }

      var ejs = { 
        title: 'Server Error | BBQ Tracker', 
        h1: 'Sorry, server error!', 
        user: req.session.passport, 
        username: username, 
        avatar: avatar 
      }

      res.status(500)
      res.render('not-found', ejs)
    })
  })

}

function isLoggedIn(req, res, next) {
  if (req.isAuthenticated())
    return next()

  else {

    var userId
    var username
    var avatar

    // check if this is a logged in user or not
    if (req.session.passport) {
      userId = req.session.passport.user
    }
    else {
      userId = null
    }

    // grab their username for the nav if logged in
    User.findOne({ _id: userId }, function(err, user) {

      if (err) throw err

      if (user) {
        username = user.username
        avatar = user.avatar
      }
      else {
        username = null
      }
    })

    var ejs = { 
      title: 'Logged In Only | BBQ Tracker', 
      h1: 'Sorry, this page is only available to the correct logged in user.', 
      user: req.session.passport, 
      username: username, 
      avatar: avatar 
    }

    res.status(404)
    res.render('not-found', ejs)
  }
}
