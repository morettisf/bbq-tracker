const User = require('../../models/users')
const moment = require('moment')

module.exports = {

  get: function(req, res, next) {

    var userId
    var username
    var avatar

    User.find({ 'logs.status': 'Public' })
      .exec(function (err, users) {

      if (err) throw err

      var logs = users.reduce(function(acc, row) {
       if (row.logs) acc = [].concat(acc, row.logs)
       return acc
      }, [])

      var publicLogs = logs.filter(function(log) {
       return log.status === 'Public'
      })

      var updatedLogs = [].concat(publicLogs).sort(function(a,b) {
        return b.updated - a.updated
      })

      var topVotedLogs = [].concat(publicLogs).sort(function(a,b) {
        return b.votes - a.votes
      })

      var updated20 = updatedLogs.slice(0, 21)
      var topVoted20 = topVotedLogs.slice(0, 21)

      // check if this is a logged in user or not
      if (req.session.passport) {
        userId = req.session.passport.user
      }
      else {
        userId = null
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

        res.render('index', { title: 'BBQ Tracker', user: req.session.passport, username: username, avatar: avatar, updated20: updated20, topVoted20: topVoted20, moment: moment })

      })

    })

  }
  
}