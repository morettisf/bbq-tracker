console.log('server is running')

const express = require('express')
const bodyParser = require('body-parser')
const routes = require('./routes/routes')
const app = express()


app.use(express.static('public'))
app.use(express.static('node_modules')) // should i be doing this?
app.set('view engine', 'ejs') // enabling view engine templates
app.use(bodyParser.json())

routes(app)

app.listen(process.env.PORT || 8080)

module.exports = app