const User = require('../models/users')
const chai = require('chai')
const chaiHttp = require('chai-http');
const should = chai.should()
chai.use(chaiHttp);
const app = require('../server')

describe('Registration', () => {
  it('saves a new user to database', (done) => {
    User.count().then(count => {
      chai.request(app)
        .post('/register')
        .send({ username: 'joe', email: 'joe@test.com', password: 'bestpassword123', password2: 'bestpassword123' })
        .end(() => {
          User.count().then(newCount => {
            newCount.should.equal(count + 1)
            done()
          })
        })
    })
  })

  it('rejects if no username is submitted', (done) => {
    chai.request(app)
      .post('/register')
      .send({ username: '', email: 'joe@test.com', password: 'bestpassword123', password2: 'bestpassword123' })
      .end((err, res) => {
        res.text.should.have.string('Supply a username')
        done()
      })
  })

  it('rejects if username has spaces', (done) => {
    chai.request(app)
      .post('/register')
      .send({ username: 'joe joe', email: 'joe@test.com', password: 'bestpassword123', password2: 'bestpassword123' })
      .end((err, res) => {
        res.text.should.have.string('No spaces allowed in username')
        done()
      })
  })

  it('rejects if no email is submitted', (done) => {
    chai.request(app)
      .post('/register')
      .send({ username: 'joe', email: '', password: 'bestpassword123', password2: 'bestpassword123' })
      .end((err, res) => {
        res.text.should.have.string('Supply an email address')
        done()
      })
  })

  it('rejects if spaces are in email', (done) => {
    chai.request(app)
      .post('/register')
      .send({ username: 'joe', email: 'email@ test.com', password: 'bestpassword123', password2: 'bestpassword123' })
      .end((err, res) => {
        res.text.should.have.string('No spaces allowed in email address')
        done()
      })
  })

  it('rejects if no @ in email', (done) => {
    chai.request(app)
      .post('/register')
      .send({ username: 'joe', email: 'emailtest.com', password: 'bestpassword123', password2: 'bestpassword123' })
      .end((err, res) => {
        res.text.should.have.string('Email does not contain @')
        done()
      })
  })

  it('rejects if no . in email', (done) => {
    chai.request(app)
      .post('/register')
      .send({ username: 'joe', email: 'email@testcom', password: 'bestpassword123', password2: 'bestpassword123' })
      .end((err, res) => {
        res.text.should.have.string('Email does not contain .')
        done()
      })
  })

  it('rejects if no password supplied', (done) => {
    chai.request(app)
      .post('/register')
      .send({ username: 'joe', email: 'email@test.com', password: '', password2: 'bestpassword123' })
      .end((err, res) => {
        res.text.should.have.string('Supply a password')
        done()
      })
  })

  it('rejects if password is less than 5 characters', (done) => {
    chai.request(app)
      .post('/register')
      .send({ username: 'joe', email: 'email@test.com', password: 'best', password2: 'best' })
      .end((err, res) => {
        res.text.should.have.string('Password must be a minimum of 5 characters')
        done()
      })
  })

  it('rejects if confirmation password is blank', (done) => {
    chai.request(app)
      .post('/register')
      .send({ username: 'joe', email: 'email@test.com', password: 'bestpassword123', password2: '' })
      .end((err, res) => {
        res.text.should.have.string('Confirm your password')
        done()
      })
  })

  it('rejects if password is missing a number', (done) => {
    chai.request(app)
      .post('/register')
      .send({ username: 'joe', email: 'email@test.com', password: 'bestpassword', password2: 'bestpassword' })
      .end((err, res) => {
        res.text.should.have.string('Password must contain at least one number')
        done()
      })
  })

  it('rejects if passwords do not match', (done) => {
    chai.request(app)
      .post('/register')
      .send({ username: 'joe', email: 'email@test.com', password: 'bestpassword123', password2: 'besterpass' })
      .end((err, res) => {
        res.text.should.have.string('Passwords do not match')
        done()
      })
  })

})