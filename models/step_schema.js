const mongoose = require('mongoose')
const Schema = mongoose.Schema

const stepSchema = new Schema ({
  step: { type: String },
  completed: { type: Boolean },
  time: { type: String },
  notes: { type: String }
})

module.exports = stepSchema