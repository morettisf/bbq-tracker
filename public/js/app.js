'use strict'

$(document).ready(function() {
  $('#date-select').datepicker()
})

var ol = document.createElement('ol')
var stepHTML = "<li><div class='step-box'><div class='step-notes'><textarea placeholder='Write step here'></textarea></div><div class='complete'><input type='checkbox' name='step-complete'><input type='text' class='time' name='time' value='09:00 AM'></div><div class='complete-notes'><textarea placeholder='Write notes here'></textarea></div></div></li>"

document.querySelector('#add-step').addEventListener('click', function() {
  var recipeList = document.querySelector('#recipe-list')

  recipeList.appendChild(ol).innerHTML += stepHTML
})