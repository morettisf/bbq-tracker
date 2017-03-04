const User = require('../../models/users')
const LogOptions = require('./log-options')

module.exports = {

  get: function(req, res, next) {
    var userId = req.session.passport.user

    User.findOne({ _id: userId }, function(err, user) {

      if (err) throw err

      var username = user.username
      var avatar = user.avatar

      var ejs = {
        title: 'Create New Log | BBQ Tracker', 
        h1: 'New BBQ Log', 
        logOptions: LogOptions, 
        user: req.session.passport, 
        username: username, 
        avatar: avatar
      }

      res.render('create-log', ejs)
    })

  },

  post: function(req, res, next) {

    var info = req.body
    var userId = req.session.passport.user

    // var picName = req.file.filename
    
    // info.pic1 = picName

    User.findOne({ _id: userId }, function(err, user) {

      if (err) throw err

      user.logs.push(info)
      user.save()

      res.send('ok')
    })

  }

}