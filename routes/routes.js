module.exports = (app) => {
  app.get('/', function(req, res) {
    var logs = [{ title: 'Log A' }, { title: 'Log B' }, { title: 'Log C' }]
    res.render('index', { title: 'Hey', message: 'Hello there!', logs: logs }) // pug dynamic content
  })

  app.get('/create-log', function(req, res) {
    res.render('create-log', { title: 'BBQ Tracker | Create New BBQ Log', message: 'NEW LOG content' })
  })

  app.get('/log-history', function(req, res) {
    res.render('log-history', { title: 'BBQ Tracker | Log History', message: 'LOG HISTORY content' })
  })
}

// build separate ejs files for each screen, create separate routes

// linking to new page template with dynamic log ID URL
// <li><a href="/logs/<%= log.id %>"><%= log.title %></a></li> (ejs file)