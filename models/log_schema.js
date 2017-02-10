const mongoose = require('mongoose')
const Schema = mongoose.Schema
const stepSchema = require('./step_schema')
const voterIdSchema = require('./voter_schema')

const LogSchema = new Schema({
  date: { type: Date },
  session_name: { type: String },
  cooking_device: { type: String },
  device_other: { type: String },
  meat: { type: String },
  meat_other: { type: String },
  weight: { type: String },
  meat_notes: { type: String },
  cook_temperature: { type: String },
  estimated_time: { type: String },
  fuel: { type: String },
  brand: { type: String },
  wood: { type: String },
  wood_other: { type: String },
  steps: [stepSchema],
  rating: { type: Number },
  status: { type: String },
  username: { type: String },
  updated: { type: Date },
  votes: { type: Number },
  other_ingredients: { type: String },
  voters: [voterIdSchema],
  final: { type: String }
})

module.exports = LogSchema