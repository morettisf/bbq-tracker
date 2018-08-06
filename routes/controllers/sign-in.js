const User = require('../../models/users')
const bcrypt = require('bcryptjs')
const passport = require('passport')
const LocalStrategy = require('passport-local').Strategy
const FacebookStrategy = require('passport-facebook').Strategy
const nodemailer = require('nodemailer')

module.exports = {

  get: function(req, res, next) {

    if (req.session.passport) {
      res.redirect('/');
    }
    
    var ejs = {
      title: 'Sign In | BBQ Tracker', 
      user: req.session.passport, 
      errors: null, 
      message: req.session.message, 
      username: null, 
      avatar: null
    }

    res.render('sign-in', ejs)
  },
  
  post: function(req, res, next) {
    passport.authenticate('local-sign-in', function(err, user, info) {

      if (err) throw err

      var userNameReq = req.body.username.toLowerCase()
      var passwordReq = req.body.password

      if (info) {

        var ejs = {
          title: 'Sign-In | BBQ Tracker', 
          user: req.session.passport, 
          errors: info.message, 
          message: null, 
          username: null, 
          avatar: null
        }

        res.render('sign-in', ejs)
      }

      else {

        req.logIn(user, function(err) {

          if (err) { 
            return next(err) 
          }

          return res.redirect('log-history')

        })
      }
    }) (req, res)
  }

}

passport.use('local-sign-in', new LocalStrategy({
  usernameField: 'username',
  passwordField: 'password',
  passReqToCallback: true,
  },

  function(req, userName, password, done) {

    var userNameLower = userName.toLowerCase()

    User.findOne({ 'username':  userNameLower }, function(err, user) {

      if (err) throw err

      if (!user) {
        return done(null, false, { message: 'Incorrect username, try again' })
      }
    
      else {

        User.comparePassword(password, user.password, function(err, isMatch) {
          if (err) throw err

          if (isMatch) {
            return done(null, user)
          }
          else {
            return done (null, false, { message: 'Incorrect password, try again'})
          }
        })

      }

    })

}))

passport.use(new FacebookStrategy({

    clientID        : 246036765904174,
    clientSecret    : process.env.FB_CLIENT_SECRET,
    callbackURL     : 'https://bbqtracker.herokuapp.com/auth/facebook.callback',
    profileFields: ['id', 'displayName', 'email', 'first_name', 'last_name']

    },

    // facebook will send back the token and profile
    function(token, refreshToken, profile, done) {

        // asynchronous
        process.nextTick(function() {

          console.log(profile)

            // find the user in the database based on their facebook id
            User.findOne({ 'email' : profile.emails[0].value }, function(err, user) {

                // if there is an error, stop everything and return that
                // ie an error connecting to the database
                if (err)
                    return done(err);

                // if the user is found, then log them in
                if (user) {
                    return done(null, user); // user found, return that user
                } else {
                    // if there is no user found with that facebook id, create them
                    var newUser = new User();

                    // set all of the facebook information in our user model
                    newUser.username = profile.emails[0].value;
                    newUser.email = profile.emails[0].value; // facebook can return multiple emails so we'll take the first
                    newUser.password = 'fbprofile';
                    newUser.avatar = '../images/cow.svg';

                    // save our user to the database
                    newUser.save(function(err) {
                        if (err)
                            throw err;

                        // if successful, return the new user
                        else {

                          if (process.env.NODE_ENV !== 'test') {
                            introEmail(userInfo.email, userInfo.username)
                          }

                          return done(null, newUser);
                        }
                    });
                }

            });
        });

    }));


passport.serializeUser(function(user, done) {
  done(null, user.id);
})

passport.deserializeUser(function(id, done) {
  User.findById(id, function(err, user) {
    if (err) throw err
    done(err, user);
  })
})

function introEmail(email, username, done) {
  var smtpTransport = nodemailer.createTransport({
    service: 'Gmail',
    auth:{
      type: 'OAuth2',
      user: 'grazingcattlebbq@gmail.com',
      clientId: process.env.CLIENT_ID,
      clientSecret: process.env.CLIENT_SECRET,
      refreshToken: process.env.REFRESH_TOKEN
    }
  });
  var mailOptions = {
    to: email,
    from: 'grazingcattlebbq@gmail.com',
    bcc: 'grazingcattlebbq@gmail.com',
    subject: 'Welcome to BBQTracker',
    text: 'Hello ' + username + ',\n\n' +
      "This is confirmation you've created an account on www.bbqtracker.com. If you need further assistance, feel free to reach out to grazingcattlebbq@gmail.com. Enjoy!\n"
  };
  smtpTransport.sendMail(mailOptions, function(err, res) {
    if (err) {
      console.log('Error: ', err)
    }
    else {
      console.log('Email Sent')
    }
  });
}


