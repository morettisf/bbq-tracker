const User = require('../../models/users')
const LogOptions = require('./log-options')
const moment = require('moment')

module.exports = {

  get: function(req, res, next) {
    var userId = req.session.passport.user
    var logId = req.params.log

    var logInfo

    User.findOne({ _id: userId }, function(err, user) {
      
      if (err) throw err

      var ownLog = user.logs.some(function(log) {
        if (log._id.toString() === logId) {
          logInfo = log
          return true
        }
      })
      
      if (ownLog) {
          var username = user.username
          var avatar = user.avatar

          var ejs = { 
            title: logInfo.session_name + ' | BBQ Tracker', 
            h1: 'Saved BBQ Log', 
            logOptions: LogOptions, 
            logInfo: logInfo, 
            user: req.session.passport, 
            username: username, 
            avatar: avatar, 
            moment: moment 
          }

          return res.render('view-log', ejs)
        }

    })

  },

  put: function(req, res, next) {
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
      log.other_ingredients = info.other_ingredients,
      log.final = info.final
      
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

  }

}