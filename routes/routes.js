const User = require('../models/users')
const bcrypt = require('bcryptjs')
const passport = require('passport')
const LocalStrategy = require('passport-local').Strategy
const moment = require('moment')

module.exports = (app) => {

  app.use(passport.initialize())
  app.use(passport.session())

  app.get('/', function(req, res) {

  var userLogs = []
  var userLogsConcat

    User.find({ 'logs.status': 'Public' })
      .exec(function (err, users) {
        if (err) throw err

      users.forEach(function(user) {
        userLogs.push(user.logs)
      })

      userLogsConcat = [].concat.apply([], userLogs)

    res.render('index', { title: 'BBQ Tracker', message: 'HOMEPAGE content', user: req.session.passport, logList: userLogsConcat, moment: moment })
    console.log(req.session.passport)

    })

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

    var logInfo

    User.findOne({ _id: userId }, function(err, user) {
      user.logs.forEach(function(log) {
        if (log._id == logId) {  // CONVERT TO SAME FORMAT
          logInfo = log
        }
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
      log.status = info.status
      
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

      res.render('log-history', { title: 'Log History | BBQ Tracker', message: req.query.message || null, logList: logs, user: req.session.passport, moment: moment })
    })
  })

  app.post('/register', function(req, res, next) {

    var userInfo = { username: req.body.username, email: req.body.email, password: req.body.password }
    var resInfo = { username: req.body.username, email: req.body.email, password: req.body.password }
    var userNameReq = req.body.username
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
//        res.json(errors)
    }

    else {

      User.findOne({ username: userNameReq }, function(err, user) {

        if (err) {
          return done(err)
        }

        if (user) {
          res.render('register', { title: 'Register | BBQ Tracker', user: req.session.passport, errors: ['Username already taken, please try another'] })
//          res.json({ error: 'Username already taken, please try another' })
        }

        else {
          bcrypt.genSalt(10, function(err, salt) {
            bcrypt.hash(userInfo.password, salt, function(err, hash) {
              userInfo.password = hash
              User.create(userInfo)
                .then(function(){
                  req.session.message = 'Registration successful, now sign in'
                  res.redirect('/sign-in')
//                    res.json(resInfo)
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

      var userNameReq = req.body.username
      var passwordReq = req.body.password

      if (info) {
        res.render('sign-in', { title: 'Sign-In | BBQ Tracker', user: req.session.passport, errors: info.message, message: null })
      }

      else {
        req.logIn(user, function(err) {
          if (err) { return next(err) }
          return res.redirect('log-history')

 //         return res.json('ok')
        })
      }
    })(req, res, next)
  })


  app.post('/create-log', function(req, res, next) {

    var info = req.body
    var userId = req.session.passport.user

    User.findOne({ _id: userId }, function(err, user) {

      user.logs.push(info)
      user.save()

      res.send('ok')
    })

  })

  app.post('/log-history', function(req, res, next) {

    var reqLogs = req.body
    var userId = req.session.passport.user

    var logs

    User.findOne({ _id: userId }, function(err, user) {

      logs = user.logs

      reqLogs.forEach(function(item) {
        var log = user.logs.id(item)
        var newLog = {}

        newLog.date = log.date
        newLog.rating = log.rating
        newLog.wood = log.wood
        newLog.brand = log.brand
        newLog.fuel = log.fuel
        newLog.estimated_time = log.estimated_time
        newLog.cook_temperature = log.cook_temperature
        newLog.meat_notes = log.meat_notes
        newLog.weight = log.weight
        newLog.meat = log.meat
        newLog.cooking_device = log.cooking_device
        newLog.session_name = log.session_name
        
        newLog.steps = []
        log.steps.forEach(function(itemStep) {
          var stepObj = {}

          stepObj.step = itemStep.step
          stepObj.completed = itemStep.completed
          stepObj.time = itemStep.time
          stepObj.notes = itemStep.notes
          newLog.steps.push(stepObj)
        })

        user.logs.push(newLog)

      })

      user.save()

    res.json({ message: 'Logs copied' })

    })

  })

  app.put('/log-history', function(req, res, next) {

    var reqLogs = req.body
    var userId = req.session.passport.user

    User.findOne({ _id: userId }, function(err, user) {

      logs = user.logs

      reqLogs.forEach(function(item) {
        var log = user.logs.id(item)

        if (log.status === 'Private') {
          log.status = 'Public'
        }

        else {
          log.status = 'Private'
        }

      })

      user.save()

      res.json({ message: 'Log Status Switched' })

    })

  })

  app.delete('/log-history', function(req, res, next) {
    var reqLogs = req.body
    
    var userId = req.session.passport.user

    User.findOne({ _id: userId }, function(err, user) {

      reqLogs.forEach(function(item) {
        var log = user.logs.id(item)
        log.remove()
      })

      user.save()
    })

    res.json({ message: 'Logs deleted' })

  })


  app.get('/logout', function(req, res) {
    req.session.destroy(function(err) {
      res.redirect('/')
    })
  })

}


passport.use('local-sign-in', new LocalStrategy({
  usernameField: 'username',
  passwordField: 'password',
  passReqToCallback: true,
  },
  function(req, userName, password, done) {

    User.findOne({ 'username':  userName }, function(err, user) {
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
