const User = require('../../models/users')

module.exports = function(req, res, next) {

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
        title: 'About | BBQ Tracker', 
        message: null, 
        user: userId, 
        username: username, 
        avatar: avatar 
      }

    res.render('about', ejs)
    })
}