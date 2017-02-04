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
  
})