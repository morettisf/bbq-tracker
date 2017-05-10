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

    // set default voting status to available
    var votingStatus = true

    // check if this is a logged in user or not
    if (req.session.passport) {
      userId = req.session.passport.user
    }
    else {
      userId = null
    }

    // grab their username for the nav if logged in, pass to callback function
    function getNavUser(userId, callback) {

      User.findOne({ _id: userId }, function(err, user) {

        if (err) throw err

        if (user) {

          username = user.username
          avatar = user.avatar
          callback(null, username, avatar)

        }
        else {
          username = null

          callback(null, username, null)
        }

      })

    }

    // ***** receives logged in/out info from callback function, populates page or not *****
    getNavUser(userId, function(err, username, avatar) {

      // ***** find the visited public log in database, associate it to a user *****
      User.find({ 'logs._id': logId })
        .exec(function (err, user) {

        // *** if there's no such log in database ***
        if (err) {

            var ejs = { 
              title: 'Page Not Found | BBQ Tracker', 
              h1: 'Sorry, page not found!', 
              user: req.session.passport, 
              username: username, 
              avatar: avatar 
            }

            res.status(404)
            res.render('not-found', ejs)
        }

        // ***** if log was found and user was found, find log info to populate ***** 
        else {

          logAvatar = user[0].avatar
          authorId = user[0]._id

          for (var i = 0; i < user[0].logs.length; i++) {
            if (user[0].logs[i]._id.toString() === logId) {
              selectedLog = user[0].logs[i]
              break
            }
          }

          // *** check if log is Public or not before displaying ***
          if (selectedLog.status === 'Public') {

            // see if user has voted for visited log or not. If so, disable voting.
            for (var i = 0; i < selectedLog.voters.length; i++) {
              if (userId === selectedLog.voters[i].voter_id) {
                votingStatus = false
                break
              }
            }

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

          // *** if log is not public, show page not found ***
          else {

            var ejs = { 
              title: 'Not a Public Log | BBQ Tracker', 
              h1: 'Sorry, not a public log!', 
              user: req.session.passport, 
              username: username, 
              avatar: avatar 
            }

            res.status(404)
            res.render('not-found', ejs)

          }

        }

      })

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

      for (var i = 0; i < logs.length; i++) {
        if (logId === logs[i]._id.toString()) {
          pastVoters = logs[i].voters
          logObject = logs[i]
          break
        }
      }

      for (var i = 0; i < pastVoters.length; i++) {
        if (voter.voter_id === pastVoters[i].voter_id) {
          res.status(500)
          break
        }
      }
              
      logObject.votes++
      logObject.voters.push(voter)
      updatedVotes = logObject.votes

      user.save()
      res.json({ votes: updatedVotes })

    })

  }

}