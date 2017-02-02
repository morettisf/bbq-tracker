const User = require('../models/users')
const bcrypt = require('bcryptjs')
const passport = require('passport')
const LocalStrategy = require('passport-local').Strategy
const moment = require('moment')

module.exports = (app) => {

  app.use(passport.initialize())
  app.use(passport.session())

  app.get('/', function(req, res, next) {

    User.find({ 'logs.status': 'Public' })
      .exec(function (err, users) {

      if (err) throw err

      var logs = users.reduce(function (acc, row) {
       if (row.logs) acc = [].concat(acc, row.logs)
       return acc
      }, [])

      var publicLogs = logs.filter(function (log) {
       return log.status === 'Public'
      })

      var updatedLogs = publicLogs.sort(function(a,b) {
                          return b.updated - a.updated
                        })

      var topVotedLogs = publicLogs.sort(function(a,b) {
                          return b.votes - a.votes
                        })

      res.render('index', { title: 'BBQ Tracker', message: 'HOMEPAGE content', user: req.session.passport, updatedLogs: updatedLogs, topVotedLogs: topVotedLogs, moment: moment })
      console.log(req.session.passport)

    })

  })


  app.get('/register', function(req, res, next) {
    res.render('register', { title: 'Register | BBQ Tracker', user: req.session.passport, errors: null, username: null, avatar: null })
  })


  app.post('/register', function(req, res, next) {

    var userInfo = { username: req.body.username.toLowerCase(), email: req.body.email, password: req.body.password, avatar: '../images/cow.svg' }
    var resInfo = { username: req.body.username.toLowerCase(), email: req.body.email, password: req.body.password }
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

    if (passwordReq === '') {
      errors.push('Supply a password')
    }

    if (passwordReq.length < 5) {
      errors.push('Password must be a minimum of 5 characters')
    }

    // if (passwordReq !== /\d/) {
    //   errors.push('Password must contain at least one number')
    // }

    if (password2Req === '') {
      errors.push('Confirm your password')
    }

    if (passwordReq !== password2Req) {
      errors.push('Passwords do not match')
    }

    if (errors.length > 0) {
      res.render('register', { title: 'Register | BBQ Tracker', user: req.session.passport, errors, username: null, avatar: null })
//        res.json(errors)
    }

    else {

      User.findOne({ username: userNameReq }, function(err, user) {
        
        if (err) throw err

        if (user) {
          res.render('register', { title: 'Register | BBQ Tracker', user: req.session.passport, errors: ['Username already taken, please try another'], username: null, avatar: null })
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


  app.get('/sign-in', function(req, res, next) {
    res.render('sign-in', { title: 'Sign In | BBQ Tracker', user: req.session.passport, errors: null, message: req.session.message, username: null, avatar: null })
  })


  app.post('/sign-in', function(req, res, next) {
    passport.authenticate('local-sign-in', function(err, user, info) {

      var error

      // if (info) {
      //   error = 'Incorrect username, try again'
      // }

      // if (err) {
      //   error = 'Incorrect password, try again'
      // }

      var userNameReq = req.body.username.toLowerCase()
      var passwordReq = req.body.password

      if (info) {
        res.render('sign-in', { title: 'Sign-In | BBQ Tracker', user: req.session.passport, errors: error, message: info.message, username: null, avatar: null })
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

  app.get('/account', isLoggedIn, function(req, res, next) {
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

      res.render('account', { title: 'My Account | BBQ Tracker', user: req.session.passport, message: req.query.message || null, error: req.query.error || null, username: username, email: email, avatar: avatar })

    })

  })

  app.put('/account/username', function(req, res, next) {
    var userId = req.session.passport.user
    var userNameReq = req.body.username
    var username

    if (userNameReq === '') {
      res.json({ error: 'Supply a new username' })
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

  })

  app.put('/account/avatar', function(req, res, next) {
    var userId = req.session.passport.user
    var avatarReq = req.body.avatar

    User.findOne({ _id: userId }, function(err, user) {

      if (err) throw err

      user.avatar = avatarReq

      user.save()

      res.json({ message: 'Avatar changed' })

    })

  })

  app.put('/account/email', function(req, res, next) {
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

      else {
        user.email = emailReq

        user.save()

        res.json({ message: 'Email changed' })
      }

    })

  })

  app.put('/account/password', function(req, res, next) {
    var userId = req.session.passport.user
    var passwordReq = req.body.password
    var password2Req = req.body.password2

    if (passwordReq === '') {
      res.json({ error: 'Supply a password' })
    }

    else if (passwordReq.length < 5) {
      res.json({ error: 'Password must be a minimum of 5 characters' })
    }

    // if (passwordReq !== /\d/) {
    //   errors.push('Password must contain at least one number')
    // }

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

  })

  app.delete('/account', function(req, res, next) {
    var userId = req.session.passport.user

    User.findOne({ _id: userId }, function(err, user) {
      user.remove()
      req.session.destroy()
    })

    res.json({ message: 'User deleted' })
  })

  app.get('/create-log', isLoggedIn, function(req, res, next) {
    var userId = req.session.passport.user

    User.findOne({ _id: userId }, function(err, user) {

      if (err) throw err

      var username = user.username
      var avatar = user.avatar

      res.render('create-log', { title: 'Create New BBQ Log | BBQ Tracker', user: req.session.passport, username: username, avatar: avatar })

    })

  })


  app.post('/create-log', function(req, res, next) {

    var info = req.body
    var userId = req.session.passport.user

    User.findOne({ _id: userId }, function(err, user) {

      if (err) throw err

      user.logs.push(info)
      user.save()

      res.send('ok')
    })

  })


  app.put('/update-log/:log', function(req, res, next) {
    var userId = req.session.passport.user
    var logId = req.params.log
    var info = req.body

    User.findOne({ _id: userId }, function(err, user) {

      if (err) throw err

      var log = user.logs.id(logId)

      log.date = info.date
      log.rating = info.rating
      log.wood = info.wood
      log.wood_other = info.wood_other
      log.brand = info.brand
      log.fuel = info.fuel
      log.estimated_time = info.estimated_time
      log.cook_temperature = info.cook_temperature
      log.meat_notes = info.meat_notes
      log.weight = info.weight
      log.meat = info.meat
      log.meat_other = info.meat_other
      log.cooking_device = info.cooking_device
      log.device_other = info.device_other
      log.session_name = info.session_name
      log.status = info.status
      log.username = info.username
      log.updated = info.updated
      log.other_ingredients = info.other_ingredients
      
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


  app.get('/view-log/:log', isLoggedIn, function(req, res, next) {
    var userId = req.session.passport.user
    var logId = req.params.log

    var logInfo

    User.findOne({ _id: userId }, function(err, user) {
      
      if (err) throw err

      user.logs.forEach(function(log) {
        if (log._id == logId) {  // CONVERT TO SAME FORMAT
          logInfo = log
        }
      })
      
      var username = user.username
      var avatar = user.avatar

      res.render('view-log', { title: logInfo.session_name + ' | BBQ Tracker', logInfo: logInfo, user: req.session.passport, username: username, avatar: avatar, moment: moment })

    })

  })


  app.get('/public-log/:log', function(req, res, next) {
  
    var logId = req.params.log
    var selectedLog
    var username
    var avatar
    var logAvatar

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
    })

    // set default voting status to available
    var votingStatus = true

    // find the visited public log in database
    User.find({ 'logs._id': logId })
      .exec(function (err, user) {

        if (err) throw err

        logAvatar = user[0].avatar

      user[0].logs.forEach(function(log) {
        if (log._id == logId) { // CONVERT TO SAME FORMAT
          selectedLog = log
        }
      })

      // see if user has voted for visited log or not. If so, disable voting.
      selectedLog.voters.forEach(function(voter) {
        if (userId == voter.voter_id) {
          votingStatus = false
        }
      })

      console.log(user[0].avatar)

      res.render('view-public-log', { title: selectedLog.session_name + ' | BBQ Tracker', logInfo: selectedLog, user: req.session.passport, username: username, avatar: avatar, logAvatar: logAvatar, moment: moment, button: votingStatus })
    })
  })

  app.put('/public-log', function(req, res, next) {
    var author = req.body.author
    var logId = req.body.logId
    var voter = { voter_id: req.session.passport.user }
    var updatedVotes

    User.findOne({ username: author }, function(err, user) {
      var logs = user.logs

      logs.forEach(function(log) {
        if (logId == log._id) {
          log.votes++
          log.voters.push(voter)
          updatedVotes = log.votes
        }
      })
      user.save()
      res.json({ votes: updatedVotes })
    })
  })


  app.get('/log-history', isLoggedIn, function(req, res, next) {

    var userId = req.session.passport.user

    User.findOne({ _id: userId }, function(err, user) {

      if (err) throw err

      var logs = user.logs

      var logsSorted = logs.sort(function(a,b) {
                        return b.date - a.date
                        })

      var username = user.username
      var avatar = user.avatar

      res.render('log-history', { title: 'Log History | BBQ Tracker', error: req.query.error, message: req.query.message || null, logList: logsSorted, user: req.session.passport, moment: moment, username: username, avatar: avatar })
    })
  })


  app.post('/log-history', function(req, res, next) {

    var reqLogs = req.body
    var userId = req.session.passport.user
    var logs

console.log(reqLogs)
    if (reqLogs.length < 1) {
      res.json({ error: 'No logs selected' })
    }

    else {

      User.findOne({ _id: userId }, function(err, user) {

        if (err) throw err

        logs = user.logs

        reqLogs.forEach(function(item) {
          var log = user.logs.id(item)
          var newLog = {}

          newLog.date = log.date
          newLog.rating = log.rating
          newLog.wood = log.wood
          newLog.wood_other = log.wood_other
          newLog.brand = log.brand
          newLog.fuel = log.fuel
          newLog.estimated_time = log.estimated_time
          newLog.cook_temperature = log.cook_temperature
          newLog.meat_notes = log.meat_notes
          newLog.weight = log.weight
          newLog.meat = log.meat
          newLog.meat_other = log.meat_other
          newLog.cooking_device = log.cooking_device
          newLog.device_other = log.device_other
          newLog.session_name = log.session_name
          newLog.username = log.username
          newLog.updated = null
          newLog.status = 'Private'
          newLog.votes = 0
          newLog.other_ingredients = log.other_ingredients
          
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
    }

  })


  app.put('/log-history', function(req, res, next) {

    var reqLogs = req.body
    var userId = req.session.passport.user

    User.findOne({ _id: userId }, function(err, user) {

      if (err) throw err

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

      if (err) throw err

      reqLogs.forEach(function(item) {
        var log = user.logs.id(item)
        log.remove()
      })

      user.save()
    })

    res.json({ message: 'Logs deleted' })

  })


  app.get('/about', function(req, res) {

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

    res.render('about', { title: 'About | BBQ Tracker', message: null, user: userId, username: username, avatar: avatar })

    })
  })

  app.get('/goodbye', function(req, res) {

    var userId
    var username
    var avatar

    res.render('goodbye', { title: 'Goodbye | BBQ Tracker' })

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
//            return done(err)
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

function isLoggedIn(req, res, next) {
  if (req.isAuthenticated())
    return next()
  else {
    res.redirect('/')
  }
}
