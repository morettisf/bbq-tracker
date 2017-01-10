console.log('server is running')

const express = require('express')
const bodyParser = require('body-parser')
const routes = require('./routes/routes')
const app = express()
const mongoose = require('mongoose')

mongoose.Promise = global.Promise
if (process.env.NODE_ENV !== 'test') {
  mongoose.connect('mongodb://localhost/bbq-tracker') // mongoose connects into mongo
}

app.use(express.static('public'))
app.use(express.static('node_modules')) // should i be doing this?
app.set('view engine', 'ejs') // enabling view engine templates
app.use(bodyParser.json())

routes(app)

app.use((err, req, res, next) => { // middleware to handle errors. "Next" is a function to pass to next middleware in chain
  res.status(422).send({ error: err.message })
})

app.listen(process.env.PORT || 8080)

module.exports = app