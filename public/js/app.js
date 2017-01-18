'use strict'


document.addEventListener('DOMContentLoaded', function() {
  $('#date-select').datepicker()
})


var addStepBtn = document.querySelector('#add-step')
var list = document.querySelector('ol')


if (addStepBtn) {
  addStepBtn.addEventListener('click', function() {
    var li = document.createElement('li')
    var stepHTML = "<div class='step-box'><div class='step-notes'><textarea placeholder='Write step here'></textarea></div><div class='complete'><input type='checkbox' name='step-complete'><input type='text' class='time' name='time' value='09:00 AM'></div><div class='complete-notes'><textarea placeholder='Write notes here'></textarea><button type='button' class='remove-step'>Remove Step</button></div></div>"
    li.innerHTML = stepHTML

    list.appendChild(li)

  // WORK ON THIS
    var remove = document.querySelector('.remove-step')
    remove.addEventListener('click', function(event) {
      this.parentNode.removeChild('li')
    })

    // $('.remove-step').on('click', function(event) {
    //   $(this).parents('li').remove()
    // })

  })

}

window.checkReg = function() {
  var email = document.querySelector('#reg-email').value
  var password = document.querySelector('#reg-pw').value
  var password2 = document.querySelector('#reg-pw2').value
 
  if (password === '') {
    alert('Supply a password')
    return false
  }

  if (password2 === '') {
    alert('Confirm your password')
    return false
  }

  if (password !== password2) {
    alert('Passwords do not match, try again')
    return false
  }

  if (email === '') {
    alert('Supply an email address')
    return false
  }

  if (email.indexOf(' ') !== -1) {
    alert('No spaces allowed in email address')
    return false
  }

  if (email.indexOf('@') < 0) {
    alert('Email does not contain @')
    return false
  }

}

window.checkSignIn = function() {
  var email = document.querySelector('#sign-email').value
  var password = document.querySelector('#sign-pw').value

  if (email.indexOf(' ') !== -1) {
    alert('No spaces allowed in email address')
    return false
  }

  if (email === '') {
    alert('Supply an email address')
    return false
  }

  if (email.indexOf('@') < 0) {
    alert('Email does not contain @')
    return false
  }

  if (password === '') {
    alert('Supply a password')
    return false
  }

}


function resSignIn(res) {
  window.location = '/log-history'
}

function resSignInError(res) {
  alert('Incorrect sign-in, please try again')
}

function resReg(res) {
  window.location = '/sign-in'
}

function resRegError(res) {
  alert('Problem registering, try again')
}

// create validation for inputs eventually