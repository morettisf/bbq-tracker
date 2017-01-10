'use strict'

$(document).ready(function() {
  $('#date-select').datepicker()
})

var stepHTML = "<li><div class='step-box'><div class='step-notes'><textarea placeholder='Write step here'></textarea></div><div class='complete'><input type='checkbox' name='step-complete'><input type='text' class='time' name='time' value='09:00 AM'></div><div class='complete-notes'><textarea placeholder='Write notes here'></textarea><button type='button' class='remove-step'>Remove Step</button></div></div></li>"

$('#add-step').on('click', function() {
  $('ol').append(stepHTML)

  $('.remove-step').on('click', function(event) {
    $(this).parents('li').remove()
  })
})


$('#reg-btn').on('click', function(event) {
  event.preventDefault()
  var email = $('#reg-email').val()
  var password = $('#reg-pw').val()
  registerUser(email, password)
})

function registerUser(email, password) {
  $.ajax({
    method: 'POST',
    url: '/register',
    dataType: 'json',
    contentType: 'application/json',
    data: JSON.stringify({
      email: email,
      password: password
    }),
    success: response
  })
}

function response(res) {
  console.log(res)
}