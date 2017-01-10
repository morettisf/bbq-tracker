const User = require('../models/users')

module.exports = {
  create(req, res, next) {
    const userInfo = req.body
    
    User.create(userInfo)
      .then(user => res.send(user))
      .catch(next)
  }
}