console.log('server is running')

const express = require('express')
const session = require('express-session')
const bodyParser = require('body-parser')
const routes = require('./routes/routes')
const app = express()
const mongoose = require('mongoose')
const cookieParser = require('cookie-parser')

mongoose.Promise = global.Promise
if (process.env.NODE_ENV !== 'test') { // package.json specifies a test database connection when running mocha
  mongoose.connect('mongodb://localhost/bbq-tracker') // mongoose connects into mongo
}

app.use(express.static('public'))

app.set('view engine', 'ejs') // enabling view engine templates

app.use(bodyParser.urlencoded({ extended: true }))
app.use(bodyParser.json())

app.use(cookieParser())

app.use(session({ 
  secret: 'secret',
  saveUninitialized: true,
  resave: true,
  cookie: { secure: false }
}))

routes(app)

app.listen(process.env.PORT || 8080)

module.exports = app