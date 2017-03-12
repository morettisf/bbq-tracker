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

    // console.log(req)
    console.log('hit post')
    console.log(req.body)

    var userId = req.session.passport.user

    if (req.files) {

      var info = JSON.parse(req.body.logData)

      var pics = req.files

      for (i=0; i < pics.length; i++) {
        info.pics.push({ filename: pics[i].key })
      }

    }

    else {
      var info = req.body
    }

    User.findOne({ _id: userId }, function(err, user) {

      if (err) throw err

      user.logs.push(info)
      user.save()

      res.send('ok')
      
    })

  }

}