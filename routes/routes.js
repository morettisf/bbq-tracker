const User = require('../models/users')
const passport = require('passport')

const Index = require('./controllers/index')
const Register = require('./controllers/register')
const SignIn = require('./controllers/sign-in')
const Forgot = require('./controllers/forgot')
const Reset = require('./controllers/reset')
const Account = require('./controllers/account')
const CreateLog = require('./controllers/create-log')
const ViewLog = require('./controllers/view-log')
const PublicLog = require('./controllers/public-log')
const LogHistory = require('./controllers/log-history')
const About = require('./controllers/about')

const multer = require('multer')
const multerS3 = require('multer-s3-transform')
const aws = require('aws-sdk')
const sharp = require('sharp')

var awsAccessKey = process.env.AWS_KEY
var awsSecretKey = process.env.AWS_SECRET

aws.config.update({
    secretAccessKey: awsSecretKey,
    accessKeyId: awsAccessKey
})

var s3 = new aws.S3()


var upload = multer({
  storage: multerS3({
    s3: s3,
    bucket: 'bbqtracker',
    contentType: multerS3.AUTO_CONTENT_TYPE,
    shouldTransform: function (req, file, cb) {
      cb(null, /^image/i.test(file.mimetype))
    },
    transforms: [{
      id: 'original',
      key: function (req, file, cb) {
        let fileSplit = file.originalname.split('.')

        let filename = fileSplit.slice(0, fileSplit.length - 1)
        filename.push(Date.now())
        filename = filename.join('_') + '.' + fileSplit[fileSplit.length - 1]

          cb(null, filename)
        },
      transform: function (req, file, cb) {
        cb(null, sharp().resize(1000))
      }
    }]
  }),
  limits: { fileSize: 5000000 },
  fileFilter: function (req, file, cb) {
    if (!file.originalname.match(/\.(jpg|JPG|jpeg|JPEG|png|PNG|gif|GIF)$/)) {
        return cb(new Error('Only image files are allowed!'));
    }
    cb(null, true)
  }
})


module.exports = (app) => {

  app.use(passport.initialize())
  app.use(passport.session())

  app.get('/', Index.get)

  app.get('/register', Register.get)

  app.post('/register', Register.post)

  app.get('/sign-in', SignIn.get)

  app.post('/sign-in', SignIn.post)

  app.get('/auth/facebook', passport.authenticate('facebook', { scope: 'email' }));

  // handle the callback after facebook has authenticated the user
  app.get('/auth/facebook/callback',
      passport.authenticate('facebook', {
          successRedirect : '/log-history',
          failureRedirect : '/'
      }));

  app.get('/forgot', Forgot.get);

  app.post('/forgot', Forgot.post);

  app.get('/reset/:token', Reset.get);

  app.post('/reset/:token', Reset.post);

  app.get('/account', isLoggedIn, Account.get)

  app.put('/account/username', Account.username)

  app.put('/account/avatar', Account.avatar)

  app.put('/account/email', Account.email)

  app.put('/account/password', Account.password)

  app.delete('/account', Account.delete)

  app.get('/create-log', isLoggedIn, CreateLog.get)

  app.post('/create-log', upload.array('pics'), CreateLog.post)

  app.get('/view-log/:log', isLoggedIn, ViewLog.get)

  app.put('/view-log/:log', upload.array('pics'), ViewLog.put)

  app.get('/public-log/:log', PublicLog.get)

  app.post('/public-log', PublicLog.post)

  app.get('/log-history', isLoggedIn, LogHistory.get)

  app.post('/log-history', LogHistory.post)

  app.put('/log-history', LogHistory.put)

  app.delete('/log-history', LogHistory.delete)

  app.get('/about', About)

  app.get('/logout', function(req, res, next) {
    req.session.destroy(function(err) {
      res.redirect('/')
    })
  })


  // Handle 404 errors
  app.use(function(req, res) {

    var userId
    var username
    var avatar

    // check if this is a logged in user or not
    if (req.session.passport) {
      var userId = req.session.passport.user
    }
    else {
      var userId = null
    }

    // grab their username for the nav if logged in
    User.findOne({ _id: userId }, function(err, user) {

      if (err) throw err

      if (user) {
        username = user.username
        avatar = user.avatar
      }

      else {
        username = null
      }

      var ejs = { 
        title: 'Page Not Found | BBQ Tracker', 
        h1: 'Sorry, page not found!', 
        user: req.session.passport, 
        username: username, 
        avatar: avatar 
      }

      res.status(404)
      res.render('not-found', ejs)
    })
  })

  // Handle 500 errors
  app.use(function(error, req, res, next) {
    var userId
    var username
    var avatar

    // check if this is a logged in user or not
    if (req.session.passport) {
      var userId = req.session.passport.user
    }
    else {
      var userId = null
    }

    // grab their username for the nav if logged in
    User.findOne({ _id: userId }, function(err, user) {

      if (err) throw err

      if (user) {
        username = user.username
        avatar = user.avatar
      }

      else {
        username = null
      }

      var ejs = { 
        title: 'Server Error | BBQ Tracker', 
        h1: 'Sorry, server error!', 
        user: req.session.passport, 
        username: username, 
        avatar: avatar 
      }

      res.status(500)
      res.render('not-found', ejs)
    })
  })

}

function isLoggedIn(req, res, next) {
  if (req.isAuthenticated())
    return next()

  else {

    var userId
    var username
    var avatar

    // check if this is a logged in user or not
    if (req.session.passport) {
      userId = req.session.passport.user
    }
    else {
      userId = null
    }

    // grab their username for the nav if logged in
    User.findOne({ _id: userId }, function(err, user) {

      if (err) throw err

      if (user) {
        username = user.username
        avatar = user.avatar
      }
      else {
        username = null
      }
    })

    var ejs = { 
      title: 'Logged In Only | BBQ Tracker', 
      h1: 'Sorry, this page is only available to the correct logged in user.', 
      user: req.session.passport, 
      username: username, 
      avatar: avatar 
    }

    res.status(404)
    res.render('not-found', ejs)
  }
}
