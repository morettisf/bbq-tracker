const chai = require('chai')
const chaiHttp = require('chai-http');
const should = chai.should()
chai.use(chaiHttp);
const app = require('../server')

describe('The express app', () => {
  it('handles a GET request to Homepage', (done) => {
    chai.request(app)
      .get('/')
      .end((err, res) => {
        res.should.be.html
        done()
      })
  })

  it('handles a GET request to the Register page', (done) => {
    chai.request(app)
      .get('/register')
      .end((err, res) => {
        res.should.be.html
        done()
      })
  })

  it('handles a GET request to the Sign-in page', (done) => {
    chai.request(app)
      .get('/sign-in')
      .end((err, res) => {
        res.should.be.html
        done()
      })
  })

  it('handles a GET request to the About page', (done) => {
    chai.request(app)
      .get('/about')
      .end((err, res) => {
        res.should.be.html
        done()
      })
  })
  
  it('handles an error accessing unknown URL', (done) => {
    chai.request(app)
      .get('/aboutasfasf')
      .then(() => {
      })
      .catch((err) => {
        err.should.have.status(404)
        err.response.error.text.should.have.string('Sorry, page not found!')
        done()
      })
  })

  it('handles a put request error', (done) => {
    chai.request(app)
      .put('/view-log/58a8a3ed33098517e884fe0d')
      .send('')
      .then(() => {
      })
      .catch((err) => {
        err.should.have.status(500)
        err.response.error.text.should.have.string('Sorry, server error!')
        done()
      })
  })

  it('handles a post request error', (done) => {
    chai.request(app)
      .post('/view-log/58a8a3ed33098517e884fe0d')
      .send('')
      .then(() => {
      })
      .catch((err) => {
        err.should.have.status(404)
        err.response.error.text.should.have.string('Sorry, page not found!')
        done()
      })
  })

})