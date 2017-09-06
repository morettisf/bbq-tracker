/***** LOG HISTORY *****/

var modify = document.querySelector('#log-action-btn')
if (modify) {
  modify.addEventListener('click', function() {
    var modOption = document.querySelector('#log-action-options').value
    var logs = document.querySelectorAll('.log-select')
    var selectedLogs = []

    for (var i = 0; i < logs.length; i++) {
      if (logs[i].checked) {
        var id = logs[i].closest('tr').getAttribute('id')
        selectedLogs.push(id)
      }
    }

      if (modOption === 'Copy') {
        copyLogs(selectedLogs)
      }

      else if (modOption === 'Delete') {
        deleteLogs(selectedLogs)
      }

      else if (modOption === 'Switch Status') {
        statusLogs(selectedLogs)
      }

  })
}

function copyLogs(selected) {
  fetch('/log-history', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(selected),
    mode: 'cors',
    cache: 'default',
    credentials: 'include'
  })
    .then(function(res) {
      return res.json()
    })
    .then(function(res) {
      if (res.message === "Logs copied") {
        window.location = '/log-history?message=Logs%20copied'
      }
      else if (res.error === "No logs selected") {
        window.location = '/log-history?error=No%20logs%20selected'
      }
   })
}

function deleteLogs(selected) {
  fetch('/log-history', {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(selected),
    mode: 'cors',
    cache: 'default',
    credentials: 'include'
  })
    .then(function(res) {
      window.location = '/log-history?message=Logs%20deleted'
    })
}

function statusLogs(selected) {
  fetch('/log-history', {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(selected),
    mode: 'cors',
    cache: 'default',
    credentials: 'include'
  })
    .then(function(res) {
     window.location = '/log-history?message=Log%20status%20switched'
    })
}

// add votes to public log
var voteBtn = document.querySelector('#vote-btn')
if (voteBtn) {
  voteBtn.addEventListener('click', function() {

  var url = window.location.pathname
  var logId = url.split('/').pop()

    var log = {
      author: document.querySelector('#author').textContent,
      logId: logId
    }

    addVote(log)
  })
}

function addVote(log) {
  fetch('/public-log', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(log),
    mode: 'cors',
    cache: 'default',
    credentials: 'include'
  })
    .then(function(res) {
      return res.json()
    })
    .then(function(res) {
      var updatedVotes = res.votes
      var voteCount = document.querySelector('#vote-count')
      var voteCountBox = document.querySelector('#vote-count-box')
      var voteBtn = document.querySelector('#vote-btn')

      voteCount.innerHTML = updatedVotes
      voteBtn.parentNode.removeChild(voteBtn)

      var div = document.createElement('div')
      div.style.float = 'right'
      voteCountBox.appendChild(div)
      div.innerHTML = 'Voted'
    })
}


