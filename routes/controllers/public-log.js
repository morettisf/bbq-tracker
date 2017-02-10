const User = require('../../models/users')
const LogOptions = require('./log-options')
const moment = require('moment')

module.exports = {

  get: function(req, res, next) {
  
    var logId = req.params.log
    var userId
    var selectedLog
    var username
    var avatar
    var logAvatar
    var authorId
    var sameUserAuthor

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

    })

    // set default voting status to available
    var votingStatus = true

    // find the visited public log in database
    User.find({ 'logs._id': logId })
      .exec(function (err, user) {

        if (err) {

          var ejs = { 
            title: 'Page Not Found | BBQ Tracker', 
            h1: 'Page not found!', 
            user: req.session.passport, 
            username: username, 
            avatar: avatar 
          }

          res.render('not-found', ejs)
        }

        else {

          logAvatar = user[0].avatar
          authorId = user[0]._id

          user[0].logs.forEach(function(log) {
            if (log._id.toString() === logId) {
              selectedLog = log
            }
          })

          // see if user has voted for visited log or not. If so, disable voting.
          selectedLog.voters.forEach(function(voter) {
            if (userId === voter.voter_id) {
              votingStatus = false
            }
          })

          // remove voting ability if logged in user same as public log author
          if (userId === authorId) {
            sameUserAuthor = true
          }

          else {
            sameUserAuthor = false
          }

          var ejs = { 
            title: selectedLog.session_name + ' | BBQ Tracker', 
            h1: 'Public BBQ Log', 
            logOptions: LogOptions, 
            logInfo: selectedLog, 
            user: req.session.passport, 
            username: username, 
            avatar: avatar, 
            logAvatar: logAvatar, 
            moment: moment, 
            button: votingStatus, 
            sameUserAuthor: sameUserAuthor 
          }

          res.render('view-public-log', ejs)
        }

    })

  },

  // ***** VOTING - ADDING VOTES *****
  post: function(req, res, next) {
    var author = req.body.author
    var logId = req.body.logId
    var voter = { voter_id: req.session.passport.user }
    var updatedVotes
    var pastVoters = []
    var logObject

    User.findOne({ username: author }, function(err, user) {
      var logs = user.logs

      logs.forEach(function(log) {
        if (logId === log._id.toString()) {
          pastVoters = log.voters
          logObject = log
        }
      })

      pastVoters.forEach(function(pastVoter) {
        if (voter.voter_id === pastVoter.voter_id) {
          res.status(500)
        }
      })
              
      logObject.votes++
      logObject.voters.push(voter)
      updatedVotes = logObject.votes

      user.save()
      res.json({ votes: updatedVotes })

    })

  }

}