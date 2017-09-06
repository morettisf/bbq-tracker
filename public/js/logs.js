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
var otherMeat = document.querySelector('#meat-other-box')

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
    li.classList.add('form-wrap-step')
    var stepHTML = "<div class='step-box'><div class='step-notes'><textarea class='step-text' placeholder='Write step here'></textarea></div><div class='complete-box'><label for='complete' class='non-inline-block-label'><input type='checkbox' class='complete-check' name='step-complete'>Complete</label><input type='time' class='time' name='time' value='09:00'></div><div class='complete-notes'><textarea class='complete-notes-text' placeholder='Write notes here'></textarea><button type='button' class='remove-step'>Remove Step</button></div></div>"
    li.innerHTML = stepHTML

    list.appendChild(li)

  })

  var logMain = document.querySelector('#log-main')

  document.querySelector('#recipe-list ol').addEventListener('click', function(event) {
    if (event.target.classList.contains('remove-step')) {
      var li = event.target.closest('li')

      var div = document.createElement('div')
      var popHTML = "<p style='margin-top: 40px;'>Confirm delete step?</p><div id='pop-del-options'><button id='del-yes'>Yes</button><button id='del-no'>No</button></div>"

      div.setAttribute('id', 'pop-del')
      div.innerHTML = popHTML
      logMain.appendChild(div)

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
          li.parentNode.removeChild(li)
          var popDel = document.querySelector('#pop-del')
          popDel.parentNode.removeChild(popDel)
        })
      }

    }
  })
}


// removing pic from log
var removePicBtn = document.querySelector('.remove-pic')
var picsBox = document.querySelector('.pics-box')

if (removePicBtn) {

  var logMain = document.querySelector('#log-main')

  picsBox.addEventListener('click', function(event) {
    if (event.target.classList.contains('remove-pic')) {
      var picDiv = event.target.closest('div')

      var div = document.createElement('div')
      var popHTML = "<p style='margin-top: 40px;'>Confirm delete pic?</p><div id='pop-del-options'><button id='del-yes'>Yes</button><button id='del-no'>No</button></div>"

      div.setAttribute('id', 'pop-del')
      div.innerHTML = popHTML
      logMain.appendChild(div)

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
          picDiv.parentNode.removeChild(picDiv)
          var popDel = document.querySelector('#pop-del')
          popDel.parentNode.removeChild(popDel)
        })
      }

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

    var logBody = document.querySelector('#log-body')
    var div = document.createElement('div')
    var popHTML = "<img src='../images/uploading.gif'>"

    div.classList.add('pop')
    div.innerHTML = popHTML
    logBody.appendChild(div)

    var radios = document.querySelectorAll('.rating input')
    var ratingSelected

    for (var i = 0; i < radios.length; i++) {
      if (radios[i].checked) {
        ratingSelected = radios[i].value
      }
    }

    if (!ratingSelected) {
      ratingSelected = 0
    }

    var status = document.querySelectorAll('#status-box input')
    var statusSelected

    for (var i = 0; i < status.length; i++) {
      if (status[i].checked) {
        statusSelected = status[i].value
      }
    }

    var formData = new FormData()
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
      username: document.querySelector('#username').textContent,
      updated: new Date(),
      votes: 0,
      voters: [],
      other_ingredients: document.querySelector('#other-ingredients').value,
      recipe_guideline: document.querySelector('#recipe-guideline').value,
      pics: [],
      final: document.querySelector('#final-comments').value
    }

    var ol = document.querySelector('ol')
    var items = ol.getElementsByTagName('li')
    var stepInfo = []
    
    var stepBuild = Array.from(items)

    for (var i = 0; i < stepBuild.length; i++) {
      var stepObject = {}
      stepObject.step = stepBuild[i].querySelector('.step-text').value
      stepObject.completed = stepBuild[i].querySelector('.complete-check').checked
      stepObject.time = stepBuild[i].querySelector('.time').value
      stepObject.notes = stepBuild[i].querySelector('.complete-notes-text').value
      stepInfo.push(stepObject)
    }

    // Array.from(items).forEach(function(item) {
    //   var stepObject = {}
    //   stepObject.step = item.querySelector('.step-text').value
    //   stepObject.completed = item.querySelector('.complete-check').checked
    //   stepObject.time = item.querySelector('.time').value
    //   stepObject.notes = item.querySelector('.complete-notes-text').value
    //   stepInfo.push(stepObject)
    // })

    var logData = Object.assign({ steps: stepInfo }, basicData)

    if ( navigator.userAgent.match(/Android/i)
     || navigator.userAgent.match(/webOS/i)
     || navigator.userAgent.match(/iPhone/i)
     || navigator.userAgent.match(/iPad/i)
     || navigator.userAgent.match(/iPod/i)
     || navigator.userAgent.match(/BlackBerry/i)
     || navigator.userAgent.match(/Windows Phone/i)
     ) {
      sendLog(logData)
    }

    else {

      var f = new FormData()

      f.append('logData', JSON.stringify(logData))

      f.append('pics', document.querySelector('#file1').files[0])
      f.append('pics', document.querySelector('#file2').files[0])
      f.append('pics', document.querySelector('#file3').files[0])
      f.append('pics', document.querySelector('#file4').files[0])
      f.append('pics', document.querySelector('#file5').files[0])

      xhrPromise(f)
        .then((res) => {
          window.location = '/log-history?message=Log%20created'
        })

    }

    })
}

function xhrPromise(f) {
  return new Promise(function (resolve, reject) {
    var xhr = new XMLHttpRequest()
    xhr.open('post', '/create-log')
    xhr.addEventListener('load', function(){
      if (xhr.readyState == XMLHttpRequest.DONE) {
        resolve(xhr.responseText)
      }
    })
    xhr.addEventListener('error', reject)

    xhr.send(f)

  })
}

function sendLog(logData) {
  console.log('sending fetch')
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

    var logBody = document.querySelector('#log-body')
    var div = document.createElement('div')
    var popHTML = "<img src='../images/uploading.gif'>"

    div.classList.add('pop')
    div.innerHTML = popHTML
    logBody.appendChild(div)

    var radios = document.querySelectorAll('.rating input')
    var ratingSelected

    for (var i = 0; i < radios.length; i++) {
      if (radios[i].checked) {
        ratingSelected = radios[i].value
      }
    }

    if (!ratingSelected) {
      ratingSelected = 0
    }

    var status = document.querySelectorAll('#status-box input')
    var statusSelected

    for (var i = 0; i < status.length; i++) {
      if (status[i].checked) {
        statusSelected = status[i].value
      }
    }

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
      username: document.querySelector('#username').textContent,
      updated: new Date(),
      other_ingredients: document.querySelector('#other-ingredients').value,
      recipe_guideline: document.querySelector('#recipe-guideline').value,
      final: document.querySelector('#final-comments').value
    }

    var ol = document.querySelector('ol')
    var items = ol.getElementsByTagName('li')
    var stepInfo = []
    
    // Array.from(items).forEach(function(item) {
    //   var stepObject = {}
    //   stepObject.step = item.querySelector('.step-text').value
    //   stepObject.completed = item.querySelector('.complete-check').checked
    //   stepObject.time = item.querySelector('.time').value
    //   stepObject.notes = item.querySelector('.complete-notes-text').value
    //   stepInfo.push(stepObject)
    // })

    var stepBuild = Array.from(items)

    for (var i = 0; i < stepBuild.length; i++) {
      var stepObject = {}
      stepObject.step = stepBuild[i].querySelector('.step-text').value
      stepObject.completed = stepBuild[i].querySelector('.complete-check').checked
      stepObject.time = stepBuild[i].querySelector('.time').value
      stepObject.notes = stepBuild[i].querySelector('.complete-notes-text').value
      stepInfo.push(stepObject)
    }


    var displayedPics = document.querySelectorAll('.pic img')
    var displayedPicsArray = []
    
    var picTemp = Array.from(displayedPics)

    for (var i = 0; i < picTemp.length; i++) {
      var picsObject = {}
      var attr = picTemp[i].getAttribute('src')
      var filename = attr.split('/').pop()
      picsObject.filename = filename
      displayedPicsArray.push(picsObject)
    }

    // Array.from(displayedPics).forEach(function(displayedPic) {
    //   var picsObject = {}
    //   var attr = displayedPic.getAttribute('src')
    //   var filename = attr.split('/').pop()
    //   picsObject.filename = filename
    //   displayedPicsArray.push(picsObject)
    // })

    var logData = Object.assign({ steps: stepInfo }, { pics: displayedPicsArray }, basicData)
    
    if ( navigator.userAgent.match(/Android/i)
     || navigator.userAgent.match(/webOS/i)
     || navigator.userAgent.match(/iPhone/i)
     || navigator.userAgent.match(/iPad/i)
     || navigator.userAgent.match(/iPod/i)
     || navigator.userAgent.match(/BlackBerry/i)
     || navigator.userAgent.match(/Windows Phone/i)
     ) {
      updateLog(logData)
    }

    else {

      var f = new FormData()
      f.append('logData', JSON.stringify(logData))

      f.append('pics', document.querySelector('#file1').files[0])
      f.append('pics', document.querySelector('#file2').files[0])
      f.append('pics', document.querySelector('#file3').files[0])
      f.append('pics', document.querySelector('#file4').files[0])
      f.append('pics', document.querySelector('#file5').files[0])

      var url = window.location.pathname
      var logId = url.split('/').pop()


      xhrPromiseUpdate(f)
        .then((res) => {

          var loader = document.querySelector('.pop')
          loader.parentNode.removeChild(loader)

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

          // add/remove public link on update without page refresh
          var h3 = document.querySelector('h3')
          var pubLink = document.querySelector('#pub-link')
          var status = document.querySelectorAll('#status-box input')
          var statusSelected

          for (var i = 0; i < status.length; i++) {
            if (status[i].checked) {
              statusSelected = status[i].value
            }
          }

          if ((statusSelected === 'Private') && h3) {
            pubLink.removeChild(h3)
          }

          if ((statusSelected === 'Public') && !h3) {
            var h3 = document.createElement('h3')
            var url = window.location.pathname
            var logId = url.split('/').pop()
            var h3Content = "<a href='/public-log/" + logId + "'>Public link here</a>"
            h3.innerHTML = h3Content
            pubLink.appendChild(h3)
          }

          // add/remove pictures on update without page refresh
          var picsBox = document.querySelector('.pics-box')
          var logPics = document.querySelectorAll('.pic')

          for (var i = 0; i < logPics.length; i++) {
            logPics[i].parentNode.removeChild(logPics[i])
          }

          var response = JSON.parse(res)
          var newPics = response.pics

          // if (newPics) {
          //   newPics.forEach(function(pic) {
          //     var picDiv = document.createElement('div')
          //     picDiv.classList.add('pic')

          //     picsBox.appendChild(picDiv)
          //     picDiv.innerHTML = "<img src='https://s3-us-west-1.amazonaws.com/bbqtracker/" + pic.filename + "'><button type='button' class='remove-pic'>Remove Picture</button>"
          //   })
          // }

          if (newPics) {
            for (var i = 0; i < newPics.length; i++) {
              var picDiv = document.createElement('div')
              picDiv.classList.add('pic')

              picsBox.appendChild(picDiv)
              picDiv.innerHTML = "<img src='https://s3-us-west-1.amazonaws.com/bbqtracker/" + newPics[i].filename + "'><button type='button' class='remove-pic'>Remove Picture</button>"
            }
          }
          

          // add/remove file upload fields on update without page refresh
          var uploadBox = document.querySelector('.pics-upload-box')
          var uploadBtns = document.querySelectorAll('.pic-upload')

          for (var i = 0; i < uploadBtns.length; i++) {
            uploadBtns[i].parentNode.removeChild(uploadBtns[i])
          }

          for (var i = 1; i < 6; i++) {
            var uploadDiv = document.createElement('div')
            uploadDiv.classList.add('pic-upload')

            uploadBox.appendChild(uploadDiv)
            uploadDiv.innerHTML = "<label>Upload Picture " + [i] + "</label><input id='file" + [i] + "' type='file' name='file" + [i] + "'>"
          }

        })
      }

  })
}

// updating log
var url = window.location.pathname
var logId = url.split('/').pop()

function xhrPromiseUpdate(f) {
  return new Promise(function (resolve, reject) {
    var xhr = new XMLHttpRequest()
    xhr.open('put', '/view-log/' + logId)
    xhr.addEventListener('load', function(){
      if (xhr.readyState == XMLHttpRequest.DONE) {
        resolve(xhr.responseText)
      }
    })
    xhr.addEventListener('error', reject)

    xhr.send(f)

  })
}


// updating log - mobile
function updateLog(logData) {
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

      var loader = document.querySelector('.pop')
      loader.parentNode.removeChild(loader)
          
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

      // add/remove public link on update without page refresh
      var h3 = document.querySelector('h3')
      var pubLink = document.querySelector('#pub-link')
      var status = document.querySelectorAll('#status-box input')
      var statusSelected

      for (var i = 0; i < status.length; i++) {
        if (status[i].checked) {
          statusSelected = status[i].value
        }
      }

      if ((statusSelected === 'Private') && h3) {
        pubLink.removeChild(h3)
      }

      if ((statusSelected === 'Public') && !h3) {
        var h3 = document.createElement('h3')
        var url = window.location.pathname
        var logId = url.split('/').pop()
        var h3Content = "<a href='/public-log/" + logId + "'>Public link here</a>"
        h3.innerHTML = h3Content
        pubLink.appendChild(h3)
      }

    })
}


