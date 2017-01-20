'use strict'

var addStepBtn = document.querySelector('#add-step')
var list = document.querySelector('ol')

if (addStepBtn) {
  addStepBtn.addEventListener('click', function() {
    var li = document.createElement('li')
    var stepHTML = "<div class='step-box'><div class='step-notes'><textarea placeholder='Write step here'></textarea></div><div class='complete'><input type='checkbox' name='step-complete'><input type='time' class='time' name='time' value='09:00'></div><div class='complete-notes'><textarea placeholder='Write notes here'></textarea><button type='button' class='remove-step'>Remove Step</button></div></div>"
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