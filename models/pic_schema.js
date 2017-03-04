const mongoose = require('mongoose')
const Schema = mongoose.Schema

const picSchema = new Schema ({
  filename: { type: String }
})

module.exports = picSchema