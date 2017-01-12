const mongoose = require('mongoose')
const Schema = mongoose.Schema
const bcrypt = require('bcryptjs')

const UserSchema = new Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true }
})

var User = mongoose.model('user', UserSchema)

module.exports = User

module.exports.comparePassword = function(candidatePassword, hash, callback) {
  bcrypt.compare(candidatePassword, hash, function(err, isMatch) {
    if(err) throw err
    callback(null, isMatch)
  })
}