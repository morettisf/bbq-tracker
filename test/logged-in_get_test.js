const chai = require('chai')
const chaiHttp = require('chai-http');
const should = chai.should()
const expect = chai.expect
chai.use(chaiHttp);
const app = require('../server')

describe('Logged in', () => {
  it('handles a GET request to Log History', (done) => {
    chai.request(app)
      .post('/register')
      .send({ username: 'phil', email: 'phil@test.com', password: 'bestpassword123', password2: 'bestpassword123' })
      .then(() => {
        var agent = chai.request.agent(app)
          agent.post('/sign-in')
          .send({ username: 'phil', password: 'bestpassword123' })
          .then((res) => {
            res.text.should.have.string('Log History')
            done()
          })
      })
  })

  it('handles a GET request to Account page', (done) => {
    chai.request(app)
      .post('/register')
      .send({ username: 'phil', email: 'phil@test.com', password: 'bestpassword123', password2: 'bestpassword123' })
      .then(() => {
        var agent = chai.request.agent(app)
          agent.post('/sign-in')
          .send({ username: 'phil', password: 'bestpassword123' })
          .then(() => {
            agent.get('/account')
            .then((res) => {
              res.text.should.have.string('My Account')
              done()
            })
          })
      })
  })

  it('handles a GET request to Create Log', (done) => {
    chai.request(app)
      .post('/register')
      .send({ username: 'phil', email: 'phil@test.com', password: 'bestpassword123', password2: 'bestpassword123' })
      .then(() => {
        var agent = chai.request.agent(app)
          agent.post('/sign-in')
          .send({ username: 'phil', password: 'bestpassword123' })
          .then(() => {
            agent.get('/create-log')
            .then((res) => {
              res.text.should.have.string('New BBQ Log Entry')
              done()
            })
          })
      })
  })

})