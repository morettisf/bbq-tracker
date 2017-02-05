'use strict'

var hamburger = document.querySelector('#hamburger')

if (hamburger) {
  hamburger.addEventListener('click', function() {
    var mobileOut = document.querySelector('#mobile-out')
    mobileOut.classList.add('animateNav')
    mobileOut.classList.toggle('nav-open')

    setTimeout(function() {
      mobileOut.classList.remove('animateNav')
    }, 1500)
  })
}