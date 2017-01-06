module.exports = (app) => {
  app.get('/', function(req, res) {
//    res.json({hi: 'there'})
  var logs = [{ title: 'Log A' }, { title: 'Log B' }, { title: 'Log C' }]
  res.render('index', { title: 'Hey', message: 'Hello there!', logs: logs }) // pug dynamic content
  })
}

// build separate ejs files for each screen, create separate routes

// linking to new page template with dynamic log ID URL
// <li><a href="/logs/<%= log.id %>"><%= log.title %></a></li> (ejs file)