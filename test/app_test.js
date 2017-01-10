const assert = require('assert')
const request = require('supertest')
const app = require('../server')

describe('The express app', () => {
  it('handles a GET request to root URL', (done) => {
    request(app)
      .get('/')
      .end((err, response) => {
//        assert(response.status === 200)
        assert(response.header['content-type'] === 'text/html; charset=utf-8')
        done()
      })
  })
})