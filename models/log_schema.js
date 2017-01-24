const mongoose = require('mongoose')
const Schema = mongoose.Schema
const stepSchema = require('./step_schema')

const LogSchema = new Schema({
  date: { type: Date },
  session_name: { type: String },
  cooking_device: { type: String },
  meat: { type: String },
  weight: { type: String },
  meat_notes: { type: String },
  cook_temperature: { type: String },
  estimated_time: { type: String },
  fuel: { type: String },
  brand: { type: String },
  wood: { type: String },
  steps: [stepSchema],
  rating: { type: Number }
})

module.exports = LogSchema