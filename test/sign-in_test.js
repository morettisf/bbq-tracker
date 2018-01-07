const User = require('../models/users')
const chai = require('chai')
const chaiHttp = require('chai-http');
const should = chai.should()
chai.use(chaiHttp);

const app = require('../server')


describe('Sign-In', () => {
  it('logs in a user', (done) => {
    chai.request(app)
      .post('/register')
      .send({ username: 'greg', email: 'greg@test.com', password: 'bestpassword123', password2: 'bestpassword123' })
      .then(() => {
        var agent = chai.request.agent(app)
          agent.post('/sign-in')
          .send({ username: 'greg', password: 'bestpassword123' })
          .end((err, res) => {
            res.text.should.have.string('Log History')
            done()
          })
      })
  })

  it('rejects if no username is submitted', (done) => {
    User.count().then(count => {
      chai.request(app)
        .post('/sign-in')
        .send({ username: '', password: 'bestpassword123' })
        .end((err, res) => {
          res.text.should.have.string('Missing credentials')
          done()
        })
    })
  })

  it('rejects if no password is submitted', (done) => {
    User.count().then(count => {
      chai.request(app)
        .post('/sign-in')
        .send({ username: 'greg', password: '' })
        .end((err, res) => {
          res.text.should.have.string('Missing credentials')
          done()
        })
    })
  })

  it('rejects if no username in database', (done) => {
    User.count().then(count => {
      chai.request(app)
        .post('/sign-in')
        .send({ username: 'joeslow', password: 'bestpassword123' })
        .end((err, res) => {
          res.text.should.have.string('Incorrect username, try again')
          done()
        })
    })
  })

  it('rejects if password is incorrect', (done) => {
    User.count().then(count => {
      chai.request(app)
        .post('/sign-in')
        .send({ username: 'greg', password: 'bestpassword' })
        .end((err, res) => {
          res.text.should.have.string('Incorrect password, try again')
          done()
        })
    })
  })

})