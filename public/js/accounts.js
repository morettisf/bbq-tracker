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