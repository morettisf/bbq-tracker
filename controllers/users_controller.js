const User = require('../models/users')

module.exports = {
  create(req, res) {
    const userInfo = req.body
    User.create(userInfo)
    .then(function(user) {
      res.send(user)
    .catch(next)
    })
  }
}