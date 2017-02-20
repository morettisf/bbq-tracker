console.log('server is running')

const micro = require('micro')
const express = require('express')
const session = require('express-session')
const bodyParser = require('body-parser')
const routes = require('./routes/routes')
const app = express()
const mongoose = require('mongoose')
const cookieParser = require('cookie-parser')
const MongoStore = require('connect-mongo')(session) // stores session in mongo

mongoose.Promise = global.Promise
if (process.env.NODE_ENV !== 'test') { // package.json specifies a test database connection when running mocha
//  mongoose.connect('mongodb://localhost/bbq-tracker') // mongoose connects into mongo
  mongoose.connect(process.env.MLAB_KEY)
}

app.use(express.static('public'))

app.set('view engine', 'ejs') // enabling view engine templates

app.use(bodyParser.urlencoded({ extended: true }))
app.use(bodyParser.json())

app.use(cookieParser())

app.use(session({ 
  secret: 'secret',
  saveUninitialized: true,
  resave: false,
  rolling: true,
  cookie: { secure: false, maxAge: 1440000 }, // 24 hours
//  store: new MongoStore({ mongooseConnection: mongoose.createConnection('mongodb://localhost/bbq-tracker') }) // stores session in mongo
  store: new MongoStore({ mongooseConnection: mongoose.createConnection(process.env.MLAB_KEY) })
}))

app.use((err, req, res, next) => { // middleware to handle errors. "Next" is a function to pass to next middleware in chain
  res.status(422).send({ error: err.message })
})

routes(app)

app.listen(process.env.PORT || 8080)

module.exports = app