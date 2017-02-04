const chai = require('chai')
const chaiHttp = require('chai-http');
const should = chai.should()
const expect = chai.expect
chai.use(chaiHttp);
const app = require('../server')
const User = require('../models/users')

describe('Logged in account settings', () => {
  it('handles changing a username', (done) => {
    chai.request(app)
      .post('/register')
      .send({ username: 'jake', email: 'jake@test.com', password: 'bestpassword123', password2: 'bestpassword123' })
      .then(() => {
        var agent = chai.request.agent(app)
          agent.post('/sign-in')
          .send({ username: 'jake', password: 'bestpassword123' })
          .then(() => {
            agent.put('/account/username')
            .send({ username: 'frank' })
            .then((res) => {
              res.text.should.contain('Username changed')
              done()
            })
          })
      })
  })

  it('rejects if no username is submitted', (done) => {
    var agent = chai.request.agent(app)
      agent.post('/sign-in')
      .send({ username: 'frank', password: 'bestpassword123' })
      .then(() => {
        agent.put('/account/username')
        .send({ username: '' })
        .then((res) => {
          res.text.should.have.string('Supply a new username')
          done()
        })
      })
  })


  it('rejects if username has spaces', (done) => {
    var agent = chai.request.agent(app)
      agent.post('/sign-in')
      .send({ username: 'frank', password: 'bestpassword123' })
      .then(() => {
        agent.put('/account/username')
        .send({ username: 'frank ie' })
        .then((res) => {
          res.text.should.have.string('No spaces allowed in username')
          done()
        })
      })
  })

  it('handles changing an avatar', (done) => {
    chai.request(app)
      .post('/register')
      .send({ username: 'matt', email: 'matt@test.com', password: 'bestpassword123', password2: 'bestpassword123' })
      .then(() => {
        var agent = chai.request.agent(app)
          agent.post('/sign-in')
          .send({ username: 'matt', password: 'bestpassword123' })
          .then(() => {
            agent.put('/account/avatar')
            .send({ avatar: '../images/chicken.svg' })
            .then((res) => {
              res.text.should.contain('Avatar changed')
              done()
            })
          })
      })
  })

  it('handles changing a password', (done) => {
    chai.request(app)
      .post('/register')
      .send({ username: 'kelly', email: 'kelly@test.com', password: 'bestpassword123', password2: 'bestpassword123' })
      .then(() => {
        var agent = chai.request.agent(app)
          agent.post('/sign-in')
          .send({ username: 'kelly', password: 'bestpassword123' })
          .then(() => {
            agent.put('/account/password')
            .send({ password: 'evenbetterPW2', password2: 'evenbetterPW2' })
            .then((res) => {
              res.text.should.contain('Password changed')
              done()
            })
          })
      })
  })

  it('rejects if new password is blank', (done) => {
    var agent = chai.request.agent(app)
      agent.post('/sign-in')
      .send({ username: 'kelly', password: 'evenbetterPW2' })
      .then(() => {
        agent.put('/account/password')
        .send({ password: '', password2: '' })
        .then((res) => {
          res.text.should.contain('Supply a new password')
          done()
        })
      })
  })

  it('rejects if new password is less than 5 characters', (done) => {
    var agent = chai.request.agent(app)
      agent.post('/sign-in')
      .send({ username: 'kelly', password: 'evenbetterPW2' })
      .then(() => {
        agent.put('/account/password')
        .send({ password: 'jdhe', password2: 'jdhe' })
        .then((res) => {
          res.text.should.contain('Password must be a minimum of 5 characters')
          done()
        })
      })
  })

  it('rejects if new password does not contain a number', (done) => {
    var agent = chai.request.agent(app)
      agent.post('/sign-in')
      .send({ username: 'kelly', password: 'evenbetterPW2' })
      .then(() => {
        agent.put('/account/password')
        .send({ password: 'jdhejjk', password2: 'jdhejjk' })
        .then((res) => {
          res.text.should.contain('Password must contain at least one number')
          done()
        })
      })
  })

  it('rejects if new password is not confirmed', (done) => {
    var agent = chai.request.agent(app)
      agent.post('/sign-in')
      .send({ username: 'kelly', password: 'evenbetterPW2' })
      .then(() => {
        agent.put('/account/password')
        .send({ password: 'jdhejjk3', password2: '' })
        .then((res) => {
          res.text.should.contain('Confirm your password')
          done()
        })
      })
  })

  it('rejects if new passwords do not match', (done) => {
    var agent = chai.request.agent(app)
      agent.post('/sign-in')
      .send({ username: 'kelly', password: 'evenbetterPW2' })
      .then(() => {
        agent.put('/account/password')
        .send({ password: 'jdhejjk7', password2: 'nnnjpl0n' })
        .then((res) => {
          res.text.should.contain('Passwords do not match')
          done()
        })
      })
  })

  it('handles changing an email', (done) => {
    chai.request(app)
      .post('/register')
      .send({ username: 'sammy', email: 'sammy@test.com', password: 'bestpassword123', password2: 'bestpassword123' })
      .then(() => {
        var agent = chai.request.agent(app)
          agent.post('/sign-in')
          .send({ username: 'sammy', password: 'bestpassword123' })
          .then(() => {
            agent.put('/account/email')
            .send({ email: 'sammy2@email.com' })
            .then((res) => {
              res.text.should.contain('Email changed')
              done()
            })
          })
      })
  })

  it('rejects if new email is blank', (done) => {
    var agent = chai.request.agent(app)
      agent.post('/sign-in')
      .send({ username: 'sammy', password: 'bestpassword123' })
      .then(() => {
        agent.put('/account/email')
        .send({ email: '' })
        .then((res) => {
          res.text.should.contain('Supply an email address')
          done()
        })
      })
  })

  it('rejects if new email has spaces', (done) => {
    var agent = chai.request.agent(app)
      agent.post('/sign-in')
      .send({ username: 'sammy', password: 'bestpassword123' })
      .then(() => {
        agent.put('/account/email')
        .send({ email: 'jkjk@ .com' })
        .then((res) => {
          res.text.should.contain('No spaces allowed in email address')
          done()
        })
      })
  })

  it('rejects if new email has no @', (done) => {
    var agent = chai.request.agent(app)
      agent.post('/sign-in')
      .send({ username: 'sammy', password: 'bestpassword123' })
      .then(() => {
        agent.put('/account/email')
        .send({ email: 'jkjk.com' })
        .then((res) => {
          res.text.should.contain('Email does not contain @')
          done()
        })
      })
  })

  it('rejects if new email has no .', (done) => {
    var agent = chai.request.agent(app)
      agent.post('/sign-in')
      .send({ username: 'sammy', password: 'bestpassword123' })
      .then(() => {
        agent.put('/account/email')
        .send({ email: 'jkjk@com' })
        .then((res) => {
          res.text.should.contain('Email does not contain .')
          done()
        })
      })
  })

  it('handles deleting an account', (done) => {
    chai.request(app)
      .post('/register')
      .send({ username: 'lilly', email: 'lilly@test.com', password: 'bestpassword123', password2: 'bestpassword123' })
      .then(() => {
        var agent = chai.request.agent(app)
          agent.post('/sign-in')
          .send({ username: 'lilly', password: 'bestpassword123' })
          .then(() => {
            agent.delete('/account')
            .then((res) => {
              res.text.should.contain('User deleted')
              done()
            })
          })
      })
  })

})