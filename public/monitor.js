/* eslint-env browser */

const interval = parseInt(findGetParameter("interval"));

setInterval(() => {
  updateImage()
  updateLogs()
}, (isNaN(interval) ? 5 : interval) * 1000)

updateImage()
updateLogs()

function updateImage () {
  document.getElementById('statusImage').src = '/status.jpg?t=' + Date.now()
}

function updateLogs () {
  fetch('logs').then(r => r.json()).then(res => {
    document.getElementById('statusLog').innerHTML = JSON.stringify(res, null, 2)
  }).catch(() => {})
}

function sendMouseClick (x, y) {
  fetch('mouseClick', {
    method: 'POST',
    body: JSON.stringify({ x, y }), // data can be `string` or {object}!
    headers: {
      'Content-Type': 'application/json'
    }
  })
}

document.getElementById('statusImage').addEventListener('click', e => {
  var rect = e.currentTarget.getBoundingClientRect()
  const offsetX = e.clientX - rect.left
  const offsetY = e.clientY - rect.top
  sendMouseClick(offsetX, offsetY)
})

document.getElementById('killButton').addEventListener('click', () => {
  fetch('kill', { method: 'POST' }).then(() => {
    setTimeout(window.location.reload, 2000)
  }).catch(err => alert(err.message))
})

//Get param from query string - https://stackoverflow.com/questions/5448545/how-to-retrieve-get-parameters-from-javascript/
function findGetParameter(parameterName) {
    var result = null,
        tmp = [];
    location.search
        .substr(1)
        .split("&")
        .forEach(function (item) {
          tmp = item.split("=");
          if (tmp[0] === parameterName) result = decodeURIComponent(tmp[1]);
        });
    return result;
}
