const User = require('../models/users')
const bcrypt = require('bcryptjs')
const passport = require('passport')
const LocalStrategy = require('passport-local').Strategy


module.exports = (app) => {

  app.use(passport.initialize())
  app.use(passport.session())

  app.get('/', function(req, res) {
    res.render('index', { title: 'BBQ Tracker', message: 'HOMEPAGE content', user: req.session.passport })
    console.log(req.session.passport)
  })

  app.get('/sign-in', function(req, res) {
    res.render('sign-in', { title: 'Sign In | BBQ Tracker', user: req.session.passport, reg: null })
  })

  app.get('/register', function(req, res) {
    res.render('register', { title: 'Register | BBQ Tracker', user: req.session.passport, message: null })
  })

  app.get('/create-log', function(req, res) {
    res.render('create-log', { title: 'Create New BBQ Log | BBQ Tracker', message: 'NEW LOG content', user: req.session.passport  })
  })

  app.get('/log-history', isLoggedIn, function(req, res) {
    var logs = [{ title: 'Log A' }, { title: 'Log B' }, { title: 'Log C' }]
    res.render('log-history', { title: 'Log History | BBQ Tracker', message: 'LOG HISTORY content', logs: logs, user: req.session.passport })
  })

  app.post('/register', function(req, res, next) {
    var userInfo = req.body
    var emailReq = req.body.email
    var password = req.body.password

    User.findOne({ email: emailReq }, function(err, user) {
      if (err) {
        return done(err)
      }

      if (user) {
        res.render('register', { title: 'Register | BBQ Tracker', user: req.session.passport, message: 'Email already taken, please try another' })
      }

      else {

        bcrypt.genSalt(10, function(err, salt) {
          bcrypt.hash(userInfo.password, salt, function(err, hash) {
            userInfo.password = hash
            User.create(userInfo)
              .then(res.render('sign-in', { title: 'Sign In | BBQ Tracker', user: null, reg: 'ok' }))
              .catch(next)
          })
        })

      }

    })

   })

  app.post('/sign-in',
    passport.authenticate('local-sign-in', {session: true}),
    function(req, res) {
      return res.redirect('log-history')
  })

  app.get('/logout', function(req, res) {
    req.session.destroy(function(err) {
      res.redirect('/')
    })
  })

}


passport.use('local-sign-in', new LocalStrategy({
  usernameField: 'email',
  passwordField: 'password',
  passReqToCallback: true,
  },
  function(req, email, password, done) {
    User.findOne({ 'email':  email }, function(err, user) {
      if (err)
        return done(err)
      if (!user)
        return done(null, false, { message: 'Incorrect username.' })
    
      User.comparePassword(password, user.password, function(err, isMatch) {
        if (err) throw err
        if (isMatch) {
          return done(null, user)
        }
        else {
          return done(err)
        }
      })
    })
}))

passport.serializeUser(function(user, done) {
  done(null, user.id);
})

passport.deserializeUser(function(id, done) {
  User.findById(id, function(err, user) {
    done(err, user);
  })
})

function isLoggedIn(req, res, next) {
  if (req.isAuthenticated())
    return next()
  else {
    res.redirect('/')
  }
}

// linking to new page template with dynamic log ID URL
// <li><a href="/logs/<%= log.id %>"><%= log.title %></a></li> (ejs file)