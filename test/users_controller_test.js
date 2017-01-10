const assert = require('assert')
const User = require('../models/users')
const request = require('supertest')
const app = require('../server')

describe('Creating records', () => {
  it('saves a new user', (done) => {
    User.count().then(count => {
      request(app)
        .post('/register')
        .send({ email: 'joe@test.com', password: 'bestpassword123' })
        .end(() => {
          User.count().then(newCount => {
            assert(count + 1 === newCount)
            done()
          })
        })
    })
  })
})