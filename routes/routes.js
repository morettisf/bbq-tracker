const UsersController = require('../controllers/users_controller')

module.exports = (app) => {
  app.get('/', function(req, res) {
    res.render('index', { title: 'BBQ Tracker', message: 'HOMEPAGE content' })
  })

  app.get('/sign-in', function(req, res) {
    res.render('sign-in', { title: 'Sign In | BBQ Tracker' })
  })

  app.get('/create-log', function(req, res) {
    res.render('create-log', { title: 'Create New BBQ Log | BBQ Tracker', message: 'NEW LOG content' })
  })

  app.get('/log-history', function(req, res) {
    var logs = [{ title: 'Log A' }, { title: 'Log B' }, { title: 'Log C' }]
    res.render('log-history', { title: 'Log History | BBQ Tracker', message: 'LOG HISTORY content', logs: logs }) // pug dynamic content
  })

  // app.post('/register', function(req, res) {
  //   console.log(req.body)
  //   var email = req.body.email
  //   var password = req.body.password
  //   console.log(email, password)
  //   UsersController.create
  // })

  app.post('/register', UsersController.create)

}


// linking to new page template with dynamic log ID URL
// <li><a href="/logs/<%= log.id %>"><%= log.title %></a></li> (ejs file)