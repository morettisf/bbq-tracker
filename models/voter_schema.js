const mongoose = require('mongoose')
const Schema = mongoose.Schema

const voterIdSchema = new Schema({
  voter_id: { type: String }
})

module.exports = voterIdSchema