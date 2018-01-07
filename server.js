console.log('server is running')

const express = require('express')
const session = require('express-session')
const bodyParser = require('body-parser')
const routes = require('./routes/routes')
const app = express()
const mongoose = require('mongoose')
const cookieParser = require('cookie-parser')
const MongoStore = require('connect-mongo')(session) // stores session in mongo
const enforce = require('express-sslify');

mongoose.Promise = global.Promise
if (process.env.NODE_ENV !== 'test') { // package.json specifies a test database connection when running mocha
  // mongoose.connect('mongodb://localhost/bbq-tracker') // mongoose connects into mongo
  mongoose.connect(process.env.MLAB_KEY, { server: { reconnectTries: Number.MAX_VALUE } })
}

app.use(express.static('public'))

app.set('view engine', 'ejs') // enabling view engine templates

app.use([bodyParser.urlencoded({ extended: true }), bodyParser.json()])

app.use(cookieParser())

if (process.env.NODE_ENV !== 'test') {

  app.use(session({ 
    secret: 'secret',
    saveUninitialized: true,
    resave: false,
    rolling: true,
    cookie: { secure: false, maxAge: 1000 * 60 * 60 * 24 }, // 24 hours
    // store: new MongoStore({ mongooseConnection: mongoose.createConnection('mongodb://localhost/bbq-tracker') }) // stores session in mongo
    store: new MongoStore({ mongooseConnection: mongoose.createConnection(process.env.MLAB_KEY) })
  }))

}

else if (process.env.NODE_ENV === 'test') {

  app.use(session({ 
    secret: 'secret',
    saveUninitialized: true,
    resave: false,
    rolling: true,
    cookie: { secure: false, maxAge: 1000 * 60 * 60 * 24 }, // 24 hours
  }))

}

app.use((err, req, res, next) => { // middleware to handle errors. "Next" is a function to pass to next middleware in chain
  res.status(422).send({ error: err.message })
})

app.use(enforce.HTTPS({ trustProtoHeader: true }))

routes(app)

app.listen(process.env.PORT || 8080)

module.exports = app