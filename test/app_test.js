const assert = require('assert')
const request = require('supertest')
const app = require('../server')

describe('The express app', () => {
  it('handles a GET request to root URL', (done) => {
    request(app)
      .get('/index')
      .end((err, response) => {
        assert(response.status === 200)
        done()
      })
  })
})