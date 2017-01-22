'use strict'

var addStepBtn = document.querySelector('#add-step')
var list = document.querySelector('ol')

if (addStepBtn) {
  addStepBtn.addEventListener('click', function() {
    var li = document.createElement('li')
    var stepHTML = "<div class='step-box'><div class='step-notes'><textarea class='step-text' placeholder='Write step here'></textarea></div><div class='complete-box'><input type='checkbox' class='complete-check' name='step-complete'><input type='time' class='time' name='time' value='09:00'></div><div class='complete-notes'><textarea class='complete-notes-text' placeholder='Write notes here'></textarea><button type='button' class='remove-step'>Remove Step</button></div></div>"
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

window.outputUpdate = function (temp) {
  document.querySelector('#temp-slider-output').value = temp;
}

// gather log data for saving to database
var save = document.querySelector('#save')

if (save) {
  save.addEventListener('click', function() {

    var basicData = {
      date: document.querySelector('#date-select').value, // find a way to get this value
      session_name: document.querySelector('#session-name').value,
      cooking_device: document.querySelector('#cooking-device').value,
      meat: document.querySelector('#meat-type').value,
      weight: document.querySelector('#weight').value,
      meat_notes: document.querySelector('#meat-notes').value,
      cook_temperature: document.querySelector('#temp-slider').value,
      estimated_time: document.querySelector('#estimated-time').value,
      fuel: document.querySelector('#fuel').value,
      brand: document.querySelector('#brand').value,
      wood: document.querySelector('#wood').value,
      rating: document.querySelector('#rating').value
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
      alert('saved')
    })
}


// create FETCH to post log






