const chai = require('chai')
const chaiHttp = require('chai-http');
const should = chai.should()
const expect = chai.expect
chai.use(chaiHttp);
const app = require('../server')
const User = require('../models/users')

var logInfo = { 
  steps: 
   [ { step: 'Hose down the hog',
       completed: true,
       time: '09:00',
       notes: 'Took a long time' },
     { step: 'Eat the thing',
       completed: true,
       time: '12:00',
       notes: 'really good!' } ],
  date: 'March-03-2017',
  session_name: 'Whole Pig',
  cooking_device: 'Weber Smokey Mountain',
  device_other: '',
  meat: 'Pork Shoulder',
  meat_other: '',
  weight: '20 lbs',
  meat_notes: 'Prime',
  cook_temperature: '330',
  estimated_time: '20 hours',
  fuel: 'Lump Charcoal',
  brand: 'Stubbs',
  wood: 'Oak',
  wood_other: '',
  rating: '4',
  status: 'Public',
  username: 'c',
  updated: '2017-02-03T22:27:06.388Z',
  votes: 0,
  voters: [],
  other_ingredients: '- rub\n- sauce',
  pics: [],
  final: 'blah',
  recipe_guideline: 'nothing'
}

var logInfoUpdate = { 
  steps: 
   [ { step: 'Hose down the hog',
       completed: true,
       time: '09:00',
       notes: 'Took a long time' },
     { step: 'Eat the thing',
       completed: true,
       time: '12:00',
       notes: 'really good!' } ],
  date: 'March-03-2017',
  session_name: 'Piggy Piggy',
  cooking_device: 'Weber Smokey Mountain',
  device_other: '',
  meat: 'Pork Shoulder',
  meat_other: '',
  weight: '20 lbs',
  meat_notes: 'Prime',
  cook_temperature: '330',
  estimated_time: '20 hours',
  fuel: 'Lump Charcoal',
  brand: 'Stubbs',
  wood: 'Oak',
  wood_other: '',
  rating: '4',
  status: 'Public',
  username: 'c',
  updated: '2017-02-03T22:27:06.388Z',
  votes: 0,
  other_ingredients: '- rub\n- sauce',
  pics: [],
  final: 'blah',
  recipe_guideline: 'nothing',
  voters: []
}

var logInfoUpdateBad = { 
  blah: 'blah'
}

// describe('Logged in', () => {
//   it('handles a creating a new log', (done) => {
//     chai.request(app)
//       .post('/register')
//       .send({ username: 'steve', email: 'steve@test.com', password: 'bestpassword123', password2: 'bestpassword123' })
//       .then(() => {
//         var agent = chai.request.agent(app)
//           agent.post('/sign-in')
//           .send({ username: 'steve', password: 'bestpassword123' })
//           .then(() => {
//             agent.get('/create-log')
//             .then(() => {
//               agent.post('/create-log')
//               .send(logInfo)
//               .then((res) => {
//                 console.log(res.text)
//                 // res.text.should.contain('log created')
//                 done()
//               })
//             })
//           })
//       })
//   })

//   it('handles viewing a saved log', (done) => {
//     chai.request(app)
//       .post('/register')
//       .send({ username: 'steve', email: 'steve@test.com', password: 'bestpassword123', password2: 'bestpassword123' })
//       .then(() => {
//         var agent = chai.request.agent(app)
//           agent.post('/sign-in')
//           .send({ username: 'steve', password: 'bestpassword123' })
//           .then(() => {
//             agent.get('/create-log')
//             .then(() => {
//               agent.post('/create-log')
//               .send(logInfo)
//               .then(() => {
//                 User.findOne({ username: 'steve' }, function(err, user) {
//                   var logId = user.logs[0]._id
//                   agent.get('/view-log/' + logId)
//                   .then((res) => {
//                     res.text.should.have.string('Saved BBQ Log')
//                     done()
//                   })
//                 })
//               })
//             })
//           })
//       })
//   })

//   it('handles updating a saved log', (done) => {
//     chai.request(app)
//       .post('/register')
//       .send({ username: 'steve', email: 'steve@test.com', password: 'bestpassword123', password2: 'bestpassword123' })
//       .then(() => {
//         var agent = chai.request.agent(app)
//           agent.post('/sign-in')
//           .send({ username: 'steve', password: 'bestpassword123' })
//           .then(() => {
//             agent.get('/create-log')
//             .then(() => {
//               agent.post('/create-log')
//               .send(logInfo)
//               .then(() => {
//                 User.findOne({ username: 'steve' }, function(err, user) {
//                   var logId = user.logs[0]._id
//                   agent.get('/view-log/' + logId)
//                   .then(() => {
//                     agent.put('/view-log/' + logId)
//                     .send(logInfoUpdate)
//                     .then((res)=> {
//                       res.should.be.status(200)
//                       done()
//                     })
//                   })
//                 })
//               })
//             })
//           })
//       })
//   })

//   it('handles copying a saved log', (done) => {
//     chai.request(app)
//       .post('/register')
//       .send({ username: 'steve', email: 'steve@test.com', password: 'bestpassword123', password2: 'bestpassword123' })
//       .then(() => {
//         var agent = chai.request.agent(app)
//           agent.post('/sign-in')
//           .send({ username: 'steve', password: 'bestpassword123' })
//           .then(() => {
//             agent.get('/create-log')
//             .then(() => {
//               agent.post('/create-log')
//               .send(logInfo)
//               .then(() => {
//                 User.findOne({ username: 'steve' }, function(err, user) {
//                   var logId = [user.logs[0]._id]
//                   agent.post('/log-history')
//                   .send(logId)
//                   .then((res) => {
//                     res.text.should.have.string('Logs copied')
//                     done()
//                   })
//                 })
//               })
//             })
//           })
//       })
//   })

//   it('handles deleting a saved log', (done) => {
//     chai.request(app)
//       .post('/register')
//       .send({ username: 'steve', email: 'steve@test.com', password: 'bestpassword123', password2: 'bestpassword123' })
//       .then(() => {
//         var agent = chai.request.agent(app)
//           agent.post('/sign-in')
//           .send({ username: 'steve', password: 'bestpassword123' })
//           .then(() => {
//             agent.get('/create-log')
//             .then(() => {
//               agent.post('/create-log')
//               .send(logInfo)
//               .then(() => {
//                 User.findOne({ username: 'steve' }, function(err, user) {
//                   var logId = [user.logs[0]._id]
//                   agent.delete('/log-history')
//                   .send(logId)
//                   .then((res) => {
//                     res.text.should.have.string('Logs deleted')
//                     done()
//                   })
//                 })
//               })
//             })
//           })
//       })
//   })


//   it('handles voting for a public log', (done) => {
//     chai.request(app)
//       .post('/register')
//       .send({ username: 'steve', email: 'steve@test.com', password: 'bestpassword123', password2: 'bestpassword123' })
//       .send({ username: 'rick', email: 'rick@test.com', password: 'bestpassword123', password2: 'bestpassword123' })
//       .then(() => {
//         var agent = chai.request.agent(app)
//           agent.post('/sign-in')
//           .send({ username: 'steve', password: 'bestpassword123' })
//           .then(() => {
//             agent.get('/create-log')
//             .then(() => {
//               agent.post('/create-log')
//               .send(logInfo)
//               .then(() => {
//                 User.findOne({ username: 'steve' }, function(err, user) {
//                   var logId = [user.logs[0]._id].toString()
//                   agent.get('/logout')
//                   .then(()=> {
//                     var agent2 = chai.request.agent(app)
//                       agent2.post('/sign-in')
//                       .send({ username: 'rick', password: 'bestpassword123' })
//                       .then(()=> {
//                         agent2.get('/public-log/' + logId)
//                         .then(()=> {
//                           agent2.post('/public-log')
//                           .send({ author: 'steve', logId: logId })
//                           .then(()=> {
//                             User.findOne({ username: 'steve' }, function(err, user) {
//                               var votes = user.logs[0].votes
//                               votes.should.equal(1)
//                               done()
//                             })
//                           })
//                         })
//                       })
//                   })
//                 })
//               })
//             })
//           })
//       })
//   })

//   it('handles a post request error', (done) => {
//     chai.request(app)
//       .post('/register')
//       .send({ username: 'steve', email: 'steve@test.com', password: 'bestpassword123', password2: 'bestpassword123' })
//       .then(() => {
//         var agent = chai.request.agent(app)
//           agent.post('/sign-in')
//           .send({ username: 'steve', password: 'bestpassword123' })
//           .then(() => {
//             agent.get('/create-log')
//             .then(() => {
//               agent.post('/create-log')
//               .send(logInfo)
//               .then(() => {
//                 User.findOne({ username: 'steve' }, function(err, user) {
//                   var logId = user.logs[0]._id
//                   agent.get('/view-log/' + logId)
//                   .then(() => {
//                     agent.post('/view-log-bad/' + logId)
//                     .send('')
//                     .then(() => {
//                     })
//                     .catch((err) => {
//                       err.should.have.status(404)
//                       err.response.error.text.should.have.string('Sorry, page not found!')
//                       done()
//                     })
//                   })
//                 })
//               })
//             })
//           })
//       })
//   })

//   it('handles a put request error', (done) => {
//     chai.request(app)
//       .post('/register')
//       .send({ username: 'steve', email: 'steve@test.com', password: 'bestpassword123', password2: 'bestpassword123' })
//       .then(() => {
//         var agent = chai.request.agent(app)
//           agent.post('/sign-in')
//           .send({ username: 'steve', password: 'bestpassword123' })
//             .then(() => {
//               agent.put('/vi')
//               .send('somethingbogus')
//               .then((res) => {
//               })
//               .catch((err) => {
//                 console.log(err)
//                 err.should.have.status(404)
//                 err.response.error.text.should.have.string('Sorry, page not found!')
//                 done()
//               })
//           })
//       })
//   })

// })