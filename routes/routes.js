const User = require('../models/users')
const bcrypt = require('bcryptjs')
const passport = require('passport')
const LocalStrategy = require('passport-local').Strategy
const moment = require('moment')

module.exports = (app) => {

  app.use(passport.initialize())
  app.use(passport.session())

  app.get('/', function(req, res) {
    res.render('index', { title: 'BBQ Tracker', message: 'HOMEPAGE content', user: req.session.passport })
    console.log(req.session.passport)
  })

  app.get('/sign-in', function(req, res) {
    res.render('sign-in', { title: 'Sign In | BBQ Tracker', user: req.session.passport, errors: null, message: req.session.message })
  })

  app.get('/register', function(req, res) {
    res.render('register', { title: 'Register | BBQ Tracker', user: req.session.passport, errors: null })
  })

  app.get('/create-log', function(req, res) {
    res.render('create-log', { title: 'Create New BBQ Log | BBQ Tracker', user: req.session.passport })
  })

  app.get('/view-log/:log', function(req, res) {
    var userId = req.session.passport.user
    var logId = req.params.log

//    console.log('target:' + logId)
    var logInfo

    User.findOne({ _id: userId }, function(err, user) {
      user.logs.forEach(function(log) {
        if (log._id == logId) {  // CONVERT TO SAME FORMAT
          logInfo = log
        }
        //console.log(log._id)
      })
      
      res.render('view-log', { title: logInfo.session_name + ' | BBQ Tracker', logInfo: logInfo, user: req.session.passport })

    })

  })

  app.put('/update-log/:log', function(req, res) {
    var userId = req.session.passport.user
    var logId = req.params.log
    var info = req.body

    User.findOne({ _id: userId }, function(err, user) {
      var log = user.logs.id(logId)

      log.date = info.date
      log.rating = info.rating
      log.wood = info.wood
      log.brand = info.brand
      log.fuel = info.fuel
      log.estimated_time = info.estimated_time
      log.cook_temperature = info.cook_temperature
      log.meat_notes = info.meat_notes
      log.weight = info.weight
      log.meat = info.meat
      log.cooking_device = info.cooking_device
      log.session_name = info.session_name
      
      log.steps = []
      info.steps.forEach(function(item) {
        var stepObj = {}

        stepObj.step = item.step
        stepObj.completed = item.completed
        stepObj.time = item.time
        stepObj.notes = item.notes
        log.steps.push(stepObj)
      })
      
      user.save()

    })
    res.send('ok')

  })

  app.get('/log-history', isLoggedIn, function(req, res) {

    var userId = req.session.passport.user

    User.findOne({ _id: userId }, function(err, user) {
      var logs = user.logs
      console.log(logs)
      res.render('log-history', { title: 'Log History | BBQ Tracker', message: 'LOG HISTORY content', logList: logs, user: req.session.passport, moment: moment })
    })
  })

  app.post('/register', function(req, res, next) {

    var userInfo = { email: req.body.email, password: req.body.password }
    var emailReq = req.body.email
    var passwordReq = req.body.password
    var password2Req = req.body.password2
    var errors = []


    if (emailReq === '') {
      errors.push('Supply an email address')
    }

    if (emailReq.indexOf(' ') !== -1) {
      errors.push('No spaces allowed in email address')
    }

    if (emailReq.indexOf('@') < 0) {
      errors.push('Email does not contain @')
    }

    if (passwordReq === '') {
      errors.push('Supply a password')
    }

    if (password2Req === '') {
      errors.push('Confirm your password')
    }

    if (passwordReq !== password2Req) {
      errors.push('Passwords do not match')
    }

    if (errors.length > 0) {
      res.render('register', { title: 'Register | BBQ Tracker', user: req.session.passport, errors })
    }

    else {

      User.findOne({ email: emailReq }, function(err, user) {

        if (err) {
          return done(err)
        }

        if (user) {
          res.render('register', { title: 'Register | BBQ Tracker', user: req.session.passport, error: 'Email already taken, please try another' })
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


  app.post('/sign-in', function(req, res, next) {
    passport.authenticate('local-sign-in', function(err, user, info) {

      var emailReq = req.body.email
      var passwordReq = req.body.password

      if (info) {
        res.render('sign-in', { title: 'Sign-In | BBQ Tracker', user: req.session.passport, errors: info.message, message: null })
      }

      else {
        req.logIn(user, function(err) {
          if (err) { return next(err) }
          return res.redirect('log-history')
        })
      }
    })(req, res, next)
  })


  app.post('/create-log', function(req, res, next) {

    var info = req.body
    var userId = req.session.passport.user

    console.log(info)

    User.findOne({ _id: userId }, function(err, user) {

      user.logs.push(info)
      user.save()

      res.send('ok')
    })

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
      if (err) {
        return done(err)
      }

      if (!user) {
        return done(null, false, { message: 'Incorrect username.' })
      }
    
      else {

        User.comparePassword(password, user.password, function(err, isMatch) {
          if (err) throw err
          if (isMatch) {
            return done(null, user)
          }
          else {
            return done(err)
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
