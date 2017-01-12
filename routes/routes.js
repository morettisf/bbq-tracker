const User = require('../models/users')
const bcrypt = require('bcryptjs')
const passport = require('passport')
const LocalStrategy = require('passport-local').Strategy


module.exports = (app) => {
  app.get('/', function(req, res) {
    res.render('index', { title: 'BBQ Tracker', message: 'HOMEPAGE content' })
  })

  app.get('/sign-in', function(req, res) {
    res.render('sign-in', { title: 'Sign In | BBQ Tracker' })
  })

  app.get('/create-log', function(req, res) {
    res.render('create-log', { title: 'Create New BBQ Log | BBQ Tracker', message: 'NEW LOG content' })
  })

  app.get('/log-history', function(req, res) {
    var logs = [{ title: 'Log A' }, { title: 'Log B' }, { title: 'Log C' }]
    res.render('log-history', { title: 'Log History | BBQ Tracker', message: 'LOG HISTORY content', logs: logs }) // pug dynamic content
  })

  app.post('/register', function(req, res, next) {
    const userInfo = req.body

    bcrypt.genSalt(10, function(err, salt) {
      bcrypt.hash(userInfo.password, salt, function(err, hash) {
        userInfo.password = hash
        User.create(userInfo)
          .then(user => res.send(user))
          .catch(next)
      })
    })
  })

  passport.use('local-login', new LocalStrategy({
    usernameField: 'email',
    passwordField: 'password',
    passReqToCallback: true,
    },
    function(req, email, password, done) {
      User.findOne({ 'email':  email }, function(err, user) {
        if (err)
          return done({message: 'Before User Auth'})
        if (!user)
          return done({message: 'Unknown User'})
      
        User.comparePassword(password, user.password, function(err, isMatch) {
          if (err) throw err
          if (isMatch) {
            return done(null, user)
          }
          else {
            return done({message: 'Invalid Password'})
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

  app.post('/sign-in', 
    passport.authenticate('local-login'), 
    function(req, res) {
      res.redirect('/')
    })
}


// linking to new page template with dynamic log ID URL
// <li><a href="/logs/<%= log.id %>"><%= log.title %></a></li> (ejs file)