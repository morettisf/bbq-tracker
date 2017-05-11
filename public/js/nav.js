var hamburger = document.querySelector('#hamburger')
var x = document.querySelector('#x')

if (hamburger) {

  var mobileOut = document.querySelector('#mobile-out')

  hamburger.addEventListener('click', function() {

    setTimeout(function() {
      mobileOut.classList.add('visible')

      hamburger.classList.add('hide-nav')
      x.classList.remove('hide-nav')

      setTimeout(function() {
        hamburger.classList.add('hidden')
        x.classList.remove('hidden')
      }, 100)

      setTimeout(function() {
        mobileOut.classList.add('animateNav')
        mobileOut.classList.toggle('nav-open')

        setTimeout(function() {
          mobileOut.classList.remove('animateNav')
        }, 400)

      }, 100)

    }, 0)
      
  })

  x.addEventListener('click', function() {

    hamburger.classList.remove('hide-nav')
    x.classList.add('hide-nav')

    setTimeout(function() {
      hamburger.classList.remove('hidden')
      x.classList.add('hidden')
    }, 100)
  

    setTimeout(function() {
      mobileOut.classList.add('animateNav')
      mobileOut.classList.toggle('nav-open')

      setTimeout(function() {
        mobileOut.classList.remove('visible')
      }, 400)

    }, 0)

  })

}