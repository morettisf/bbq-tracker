'use strict'

var hamburger = document.querySelector('#hamburger')

if (hamburger) {
  hamburger.addEventListener('click', function() {
    var mobileOut = document.querySelector('#mobile-out')

    if (mobileOut.classList.contains('visible')) {

      setTimeout(function() {
        mobileOut.classList.add('animateNav')
        mobileOut.classList.toggle('nav-open')

        setTimeout(function() {
          mobileOut.classList.remove('visible')
        }, 400)

      }, 0)
      
    }

    else {

      setTimeout(function() {
        mobileOut.classList.add('visible')

        setTimeout(function() {
          mobileOut.classList.add('animateNav')
          mobileOut.classList.toggle('nav-open')

          setTimeout(function() {
            mobileOut.classList.remove('animateNav')
          }, 400)

        }, 100)

      }, 0)



      // mobileOut.classList.add('animateNav')
      // mobileOut.classList.toggle('nav-open')

      // setTimeout(function() {
      //   mobileOut.classList.remove('animateNav')
      // }, 1500)

    }
  })
}