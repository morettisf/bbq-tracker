const User = require('../../models/users')
const moment = require('moment')

module.exports = {

  get: function(req, res, next) {

    var userId = req.session.passport.user

    User.findOne({ _id: userId }, function(err, user) {

      if (err) throw err

      var logs = user.logs

      var logsSorted = logs.sort(function(a,b) {
                        return b.date - a.date
                        })

      var username = user.username
      var avatar = user.avatar

      var ejs = { 
        title: 'Log History | BBQ Tracker', 
        error: req.query.error, 
        message: req.query.message || null, 
        logList: logsSorted, 
        logs: logs,
        user: req.session.passport, 
        moment: moment,
        username: username, 
        avatar: avatar 
      }

      res.render('log-history', ejs)
    })
  },

  post: function(req, res, next) {

    var reqLogs = req.body
    var userId = req.session.passport.user
    var logs

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
          newLog.recipe_guideline = log.recipe_guideline
          newLog.final = log.final
          
          newLog.steps = []
          log.steps.forEach(function(itemStep) {
            var stepObj = {}

            stepObj.step = itemStep.step
            stepObj.completed = itemStep.completed
            stepObj.time = itemStep.time
            stepObj.notes = itemStep.notes
            newLog.steps.push(stepObj)
          })

          newLog.pics = []
          log.pics.forEach(function(pic) {
            var picObj = {}

            picObj.filename = pic.filename
            newLog.pics.push(picObj)
          })

          user.logs.push(newLog)

        })

        user.save()

      res.json({ message: 'Logs copied' })

      })
    }

  },

  put: function(req, res, next) {

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

  },

  delete: function(req, res, next) {
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

  }


}