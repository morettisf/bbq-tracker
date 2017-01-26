const mongoose = require('mongoose')
const Schema = mongoose.Schema
const logSchema = require('./log_schema')
const bcrypt = require('bcryptjs')

const UserSchema = new Schema({
  username: {type: String, required: true, unique: true},
  email: { type: String, required: true },
  password: { type: String, required: true },
  logs: [logSchema]
})

var User = mongoose.model('user', UserSchema)

User.comparePassword = function(candidatePassword, hash, callback) {
  bcrypt.compare(candidatePassword, hash, function(err, isMatch) {
    if(err) throw err
    callback(null, isMatch)
  })
}

module.exports = User