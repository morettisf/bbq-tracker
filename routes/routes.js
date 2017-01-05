module.exports = (app) => {
  app.get('/index', function(req, res) {
    res.send({hi: 'there'})
  })
}