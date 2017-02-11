'use strict'

/***** LOGS *****/

// displaying other device textbox
var deviceList = document.querySelector('#cooking-device')
var otherDevice = document.querySelector('#device-other-box')

if (deviceList) {
  deviceList.addEventListener('change', function() {
  
    if (deviceList.value === 'Other') {
      otherDevice.classList.remove('hidden')
    }

    else if (deviceList.value !== 'Other') {
      otherDevice.classList.add('hidden')
    }

  })
}

// displaying other meat textbox
var meatList = document.querySelector('#meat-type')
var otherMeat = document.querySelector('#meat-other-text')

if (meatList) {
  meatList.addEventListener('change', function() {
  
    if (meatList.value === 'Other') {
      otherMeat.classList.remove('hidden')
    }

    else if (meatList.value !== 'Other') {
      otherMeat.classList.add('hidden')
    }

  })
}

// displaying other wood textbox
var woodList = document.querySelector('#wood')
var otherWood = document.querySelector('#wood-other-text')

if (woodList) {
  woodList.addEventListener('change', function() {
  
    if (woodList.value === 'Other') {
      otherWood.classList.remove('hidden')
    }

    else if (woodList.value !== 'Other') {
      otherWood.classList.add('hidden')
    }

  })
}

// adding step to recipe
var addStepBtn = document.querySelector('#add-step')
var list = document.querySelector('ol')

if (addStepBtn) {
  addStepBtn.addEventListener('click', function() {
    var li = document.createElement('li')
    var stepHTML = "<div class='step-box'><div class='step-notes'><textarea class='step-text' placeholder='Write step here'></textarea></div><div class='complete-box'><label for='complete'><input type='checkbox' class='complete-check' name='step-complete'>Complete</label><input type='time' class='time' name='time' value='09:00'></div><div class='complete-notes'><textarea class='complete-notes-text' placeholder='Write notes here'></textarea><button type='button' class='remove-step'>Remove Step</button></div></div>"
    li.innerHTML = stepHTML

    list.appendChild(li)

  })

  document.querySelector('#recipe-list ol').addEventListener('click', function(event) {
    if (event.target.classList.contains('remove-step')) {
      var li = event.target.closest('li')
      li.parentNode.removeChild(li)
    }
  })
}

// temperature slider output
window.outputUpdate = function (temp) {
  document.querySelector('#temp-slider-output').value = temp;
}

// save new log data to Mongo
var save = document.querySelector('#save')

if (save) {
  save.addEventListener('click', function() {

    var radios = document.querySelectorAll('.rating input')
    var ratingSelected
    radios.forEach(function(radio) {
      if (radio.checked) {
        ratingSelected = radio.value
      }
    })

    if (!ratingSelected) {
      ratingSelected = 0
    }

    var status = document.querySelectorAll('#status-box input')
    var statusSelected
    status.forEach(function(item) {
      if (item.checked) {
        statusSelected = item.value
      }
    })

    var basicData = {
      date: document.querySelector('#date-select').value,
      session_name: document.querySelector('#session-name').value,
      cooking_device: document.querySelector('#cooking-device').value,
      device_other: document.querySelector('#device-other-text').value,
      meat: document.querySelector('#meat-type').value,
      meat_other: document.querySelector('#meat-other-text').value,
      weight: document.querySelector('#weight').value,
      meat_notes: document.querySelector('#meat-notes').value,
      cook_temperature: document.querySelector('#temp-slider').value,
      estimated_time: document.querySelector('#estimated-time').value,
      fuel: document.querySelector('#fuel').value,
      brand: document.querySelector('#brand').value,
      wood: document.querySelector('#wood').value,
      wood_other: document.querySelector('#wood-other-text').value,
      rating: ratingSelected,
      status: statusSelected,
      username: document.querySelector('#username').innerHTML,
      updated: new Date(),
      votes: 0,
      voters: [],
      other_ingredients: document.querySelector('#other-ingredients').value,
      final: document.querySelector('#final-comments').value
    }

    var ol = document.querySelector('ol')
    var items = ol.getElementsByTagName('li')
    var stepInfo = []
    
    Array.from(items).forEach(function(item) {
      var stepObject = {}
      stepObject.step = item.querySelector('.step-text').value
      stepObject.completed = item.querySelector('.complete-check').checked
      stepObject.time = item.querySelector('.time').value
      stepObject.notes = item.querySelector('.complete-notes-text').value
      stepInfo.push(stepObject)
    })

    var logData = Object.assign({ steps: stepInfo }, basicData)

    sendLog(logData)
  })
}


function sendLog(logData) {
  fetch('/create-log', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(logData),
    mode: 'cors',
    cache: 'default',
    credentials: 'include'
  })
    .then(function() {
      window.location = '/log-history?message=Log%20created'
    })
}

// update log data to Mongo
var update = document.querySelector('#update')

if (update) {
  update.addEventListener('click', function() {

    var radios = document.querySelectorAll('.rating input')
    var ratingSelected
    radios.forEach(function(radio) {
      if (radio.checked) {
        ratingSelected = radio.value
      }
    })

    if (!ratingSelected) {
      ratingSelected = 0
    }

    var status = document.querySelectorAll('#status-box input')
    var statusSelected
    status.forEach(function(item) {
      if (item.checked) {
        statusSelected = item.value
      }
    })

    var meat = document.querySelector('#meat-type').value

    if (otherMeat.value !== '') {
      meat = otherMeat.value
    }

    var cookingDevice = document.querySelector('#cooking-device').value

    if (otherDevice.value !== '') {
      cookingDevice = otherDevice.value
    }

    var basicData = {
      date: document.querySelector('#date-select').value, // find a way to get this value
      session_name: document.querySelector('#session-name').value,
      cooking_device: document.querySelector('#cooking-device').value,
      device_other: document.querySelector('#device-other-text').value,
      meat: document.querySelector('#meat-type').value,
      meat_other: document.querySelector('#meat-other-text').value,
      weight: document.querySelector('#weight').value,
      meat_notes: document.querySelector('#meat-notes').value,
      cook_temperature: document.querySelector('#temp-slider').value,
      estimated_time: document.querySelector('#estimated-time').value,
      fuel: document.querySelector('#fuel').value,
      brand: document.querySelector('#brand').value,
      wood: document.querySelector('#wood').value,
      wood_other: document.querySelector('#wood-other-text').value,
      rating: ratingSelected,
      status: statusSelected,
      username: document.querySelector('#username').innerHTML,
      updated: new Date(),
      other_ingredients: document.querySelector('#other-ingredients').value,
      final: document.querySelector('#final-comments').value
    }

    var ol = document.querySelector('ol')
    var items = ol.getElementsByTagName('li')
    var stepInfo = []
    
    Array.from(items).forEach(function(item) {
      var stepObject = {}
      stepObject.step = item.querySelector('.step-text').value
      stepObject.completed = item.querySelector('.complete-check').checked
      stepObject.time = item.querySelector('.time').value
      stepObject.notes = item.querySelector('.complete-notes').value
      stepInfo.push(stepObject)
    })

    var logData = Object.assign({ steps: stepInfo }, basicData)
    
    updateLog(logData)
  })
}

// updating log
var url = window.location.pathname
var logId = url.split('/').pop()

function updateLog(logData) {
  import 'whatwg-fetch'
  fetch('/view-log/' + logId, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(logData),
    mode: 'cors',
    cache: 'default',
    credentials: 'include'
  })
    .then(function() {
      var logBody = document.querySelector('#log-body')
      var div = document.createElement('div')
      var popHTML = "<p>Log updated</p>"

      div.classList.add('pop-update')
      div.innerHTML = popHTML
      logBody.appendChild(div)


      setTimeout(function(){
        div.classList.add('pop-update-fade')
      }, 0)

      setTimeout(function(){
        div.classList.remove('pop-update-fade')

        setTimeout(function() {
        div.parentNode.removeChild(div)        
        }, 1000)

      }, 2000)

    })
}


// log history controls
var modify = document.querySelector('#log-action-btn')
if (modify) {
  modify.addEventListener('click', function() {
    var modOption = document.querySelector('#log-action-options').value
    var logs = document.querySelectorAll('.log-select')
    var selectedLogs = []

    logs.forEach(function(log) {
      if (log.checked) {
        var id = log.closest('tr').getAttribute('id')
        selectedLogs.push(id)
      }
    })

      if (modOption === 'Copy') {
        copyLogs(selectedLogs)
      }

      else if (modOption === 'Delete') {
        deleteLogs(selectedLogs)
      }

      else if (modOption === 'Switch Status') {
        statusLogs(selectedLogs)
      }

  })
}

function copyLogs(selected) {
  fetch('/log-history', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(selected),
    mode: 'cors',
    cache: 'default',
    credentials: 'include'
  })
    .then(function(res) {
      return res.json()
    })
    .then(function(res) {
      if (res.message === "Logs copied") {
        window.location = '/log-history?message=Logs%20copied'
      }
      else if (res.error === "No logs selected") {
        window.location = '/log-history?error=No%20logs%20selected'
      }
   })
}

function deleteLogs(selected) {
  fetch('/log-history', {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(selected),
    mode: 'cors',
    cache: 'default',
    credentials: 'include'
  })
    .then(function(res) {
      console.log(res)
      window.location = '/log-history?message=Logs%20deleted'
    })
}

function statusLogs(selected) {
  fetch('/log-history', {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(selected),
    mode: 'cors',
    cache: 'default',
    credentials: 'include'
  })
    .then(function(res) {
     window.location = '/log-history?message=Log%20status%20switched'
    })
}

// add votes to public log
var voteBtn = document.querySelector('#vote-btn')
if (voteBtn) {
  voteBtn.addEventListener('click', function() {

  var url = window.location.pathname
  var logId = url.split('/').pop()

    var log = {
      author: document.querySelector('#author').innerHTML,
      logId: logId
    }

    addVote(log)
  })
}

function addVote(log) {
  fetch('/public-log', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(log),
    mode: 'cors',
    cache: 'default',
    credentials: 'include'
  })
    .then(function(res) {
      return res.json()
    })
    .then(function(res) {
      var updatedVotes = res.votes
      var voteCount = document.querySelector('#vote-count')
      var voteCountBox = document.querySelector('#vote-count-box')
      var voteBtn = document.querySelector('#vote-btn')

      voteCount.innerHTML = updatedVotes
      voteBtn.parentNode.removeChild(voteBtn)

      var div = document.createElement('div')
      div.style.float = 'right'
      voteCountBox.appendChild(div)
      div.innerHTML = 'Voted'
    })
}




/***** ACCOUNTS PAGE *****/

// displaying option fields on click
var newUsername = document.querySelector('#new-username-btn')
var newEmail = document.querySelector('#new-email-btn')
var newPW = document.querySelector('#new-pw-btn')
var deleteAccount = document.querySelector('#delete-account-btn')

if (newUsername) {
  newUsername.addEventListener('click', function(event) {
    var field = document.querySelector('#new-username-field')
    field.classList.toggle('hidden')
  })
}

if (newEmail) {
  newEmail.addEventListener('click', function(event) {
    var field = document.querySelector('#new-email-field')
    field.classList.toggle('hidden')
  })
}

if (newPW) {
  newPW.addEventListener('click', function(event) {
    var field = document.querySelector('#new-pw-field')
    field.classList.toggle('hidden')
  })
}

if (deleteAccount) {
  deleteAccount.addEventListener('click', function(event) {
    var field = document.querySelector('#delete-account-field')
    field.classList.toggle('hidden')
  })
}

// new username
var newUsernameSubmit = document.querySelector('#new-username-submit')
if (newUsernameSubmit) {
  newUsernameSubmit.addEventListener('click', function() {

  var newUsernameValue = { username: document.querySelector('#new-username').value }
  changeUsername(newUsernameValue)

  })
}

function changeUsername(newUsernameValue) {
  fetch('/account/username', {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(newUsernameValue),
    mode: 'cors',
    cache: 'default',
    credentials: 'include'
  })
    .then(function(res) {
      return res.json()
    })
    .then(function(res) {
      if (res.message === "Username changed") {
        window.location = '/account?message=Username%20changed'
      }
      else if (res.error === "Supply a new username") {
        window.location = '/account?error=Supply%20a%20new%20username'
      }
      else if (res.error === "No spaces allowed in username") {
        window.location = '/account?error=No%20spaces%20allowed%20in%20username'
      }
      else if (res.error === "Username is limited to 15 characters") {
        window.location = '/account?error=Username%20is%20limited%20to%2015%20characters'
      }

    })
}

// change avatar
var cowAvatar = document.querySelector('#cow-avatar')
var chickenAvatar = document.querySelector('#chicken-avatar')
var pigAvatar = document.querySelector('#pig-avatar')

if (cowAvatar && !cowAvatar.classList.contains('avatar-highlight')) {
  cowAvatar.addEventListener('click', function() {
    var avatarReq = { avatar: '../images/cow.svg' }
    changeAvatar(avatarReq)
  })
}

if (chickenAvatar && !chickenAvatar.classList.contains('avatar-highlight')) {
  chickenAvatar.addEventListener('click', function() {
    var avatarReq = { avatar: '../images/chicken.svg' }
    changeAvatar(avatarReq)
  })
}

if (pigAvatar && !pigAvatar.classList.contains('avatar-highlight')) {
  pigAvatar.addEventListener('click', function() {
    var avatarReq = { avatar: '../images/pig.svg' }
    changeAvatar(avatarReq)
  })
}

function changeAvatar(avatarReq) {
  fetch('/account/avatar', {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(avatarReq),
    mode: 'cors',
    cache: 'default',
    credentials: 'include'
  })
    .then(function(res) {
      window.location = '/account?message=Avatar%20changed'
    })
}


// change email
var newEmailSubmit = document.querySelector('#new-email-submit')
if (newEmailSubmit) {
  newEmailSubmit.addEventListener('click', function() {

  var newEmailValue = { email: document.querySelector('#new-reg-email').value }
  changeEmail(newEmailValue)

  })
}

function changeEmail(newEmailValue) {
  fetch('/account/email', {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(newEmailValue),
    mode: 'cors',
    cache: 'default',
    credentials: 'include'
  })
    .then(function(res) {
      return res.json()
    })
    .then(function(res) {
      if (res.message === 'Email changed') {
        window.location = '/account?message=Email%20changed'
      }
      else if (res.error === 'Supply an email address') {
        window.location = '/account?error=Supply%20an%20email%20address'
      }
      else if (res.error === 'No spaces allowed in email address') {
        window.location = '/account?error=No%20spaces%20allowed%20in%20email%20address'
      }
      else if (res.error === 'Email does not contain @') {
        window.location = '/account?error=Email%20does%20not%20contain%20@'
      }
    })
}

// change password
var newPasswordSubmit = document.querySelector('#new-pw-submit')
if (newPasswordSubmit) {
  newPasswordSubmit.addEventListener('click', function() {

  var newPW = { 
    password: document.querySelector('#new-pw').value,
    password2: document.querySelector('#new-pw2').value,
  }

  changePW(newPW)

  })
}

function changePW(newPW) {
  fetch('/account/password', {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(newPW),
    mode: 'cors',
    cache: 'default',
    credentials: 'include'
  })
    .then(function(res) {
      return res.json()
    })
    .then(function(res) {
      if (res.message === 'Password changed') {
        window.location = '/account?message=Password%20changed'
      }
      else if (res.error === 'Supply a password') {
        window.location = '/account?error=Supply%20a%20password'
      }
      else if (res.error === 'Password must be a minimum of 5 characters') {
        window.location = '/account?error=Password%20must%20be%20a%20minimum%20of%205%20characters'
      }
      else if (res.error === 'Confirm your password') {
        window.location = '/account?error=Confirm%20your%20password'
      }
      else if (res.error === 'Passwords do not match') {
        window.location = '/account?error=Passwords%20do%20not%20match'
      }
    })
}

// delete account
var popDeleteUser = document.querySelector('#pop-del-user')
var accountMain = document.querySelector('#account-main')

var deleteAccountSubmit = document.querySelector('#delete-account-submit')
if (deleteAccountSubmit) {
  deleteAccountSubmit.addEventListener('click', function() {
    var div = document.createElement('div')
    var popHTML = "<p>Confirming will delete your profile. Are you sure?</p><div id='pop-del-options'><button id='del-yes'>Yes</button><button id='del-no'>No</button></div>"

    div.setAttribute('id', 'pop-del')
    div.innerHTML = popHTML
    accountMain.appendChild(div)

    var delNo = document.querySelector('#del-no')
    if (delNo) {
      delNo.addEventListener('click', function() {
        var popDel = document.querySelector('#pop-del')
        popDel.parentNode.removeChild(popDel)
      })
    }

    var delYes = document.querySelector('#del-yes')
    if (delYes) {
      delYes.addEventListener('click', function() {
        deleteUser()
      })
    }

  })
}

function deleteUser() {
  fetch('/account', {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json'
    },
    mode: 'cors',
    cache: 'default',
    credentials: 'include'
  })
    .then(function(res) {
      window.location = '/'
    })
}