/* eslint-disable no-undef */
let height = 1080
let width = 720

let imageLoadFinished = true
let logsLoadFinished = true

const logIntervalTime = 1000
let imageIntervalTime = localStorage.getItem('imageIntervalTime') ? parseInt(localStorage.getItem('imageIntervalTime')) : 1000

setInterval(updateLogs, logIntervalTime)
let imageInterval = setInterval(updateImage, imageIntervalTime)

const selectedIdlerName = () => selectedIdlerButton().getAttribute('data-name')
const selectedIdlerButton = () => document.querySelector('#mainTabs .nav-link.active')
const selectedIdlerPage = () => document.querySelector('#mainTabs .tab-pane.active')

const stripTags = /<\/?[^>]+(>|$)/g

function createNewTab (idler) {
  var name = idler.attr.name

  // create the tab
  document.querySelector('#v-pills-home-tab').insertAdjacentHTML('afterend', `<a class="nav-link" data-name="${name}" id="v-pills-${name}-tab" data-bs-toggle="pill" href="#v-pills-${name}" role="tab" aria-controls="v-pills-${name}" aria-selected="true"><span class='status-icon'>🔷</span>&nbsp;${name}</a>`)

  // create the tab content
  document.querySelector('#v-pills-tabContent').insertAdjacentHTML('beforeend', `<div class="tab-pane" data-name="${name}" id="v-pills-${name}" role="tabpanel" aria-labelledby="v-pills-${name}-tab"></div>`)

  var temp = document.querySelector('#idlerContent')
  var cloneNode = temp.content.cloneNode(true)

  var tabPage = document.querySelector(`#v-pills-${name}`)
  var tabButton = document.querySelector(`#v-pills-${name}-tab`)

  tabPage.appendChild(cloneNode)

  // Set change tab event
  tabButton.addEventListener('shown.bs.tab', () => {
    updateImage()
    updateLogs()
  })

  // Set image click handler
  tabPage.querySelector('.statusImage').addEventListener('click', (e) => {
    var rect = e.currentTarget.getBoundingClientRect()
    const offsetX = map(e.clientX - rect.left - 1, 0, e.currentTarget.width, 0, width)
    const offsetY = map(e.clientY - rect.top - 1, 0, e.currentTarget.height, 0, height)

    sendMouseClick(offsetX, offsetY, name)
  })

  // Set interval change handler
  tabPage.querySelector('.interval-spinner').addEventListener('change', updateRate)
  tabPage.querySelector('.interval-spinner').addEventListener('keyup', updateRate)

  // Set next streamer button handler
  tabPage.querySelector('.next-streamer').addEventListener('click', () => {
    goToNextStreamer(name)
  })

  // Set edit idler button handler

  tabPage.querySelector('.edit-idler').setAttribute('data-bs-edit', name)

  tabPage.querySelector('.start-stop-idler').addEventListener('click', () => {
    stopStartIdler(name)
  })

  // Set refresh button handler
  tabPage.querySelector('.refresh-logs-screenshot').addEventListener('click', () => {
    updateLogs()
    updateImage()
    fetch(`${name}/refresh`, {
      method: 'POST'
    }).then(catchError).catch((e) => {
      console.log(e)
      showAlert('Failed to refresh page - ' + e.replace(stripTags, ' '), 'danger')
    })
  })

  // Update page info
  tabPage.querySelector('.info-bot .data').textContent = name
  tabPage.querySelector('.interval-spinner').value = 60 / (imageIntervalTime * 0.001)
}

function setOrClearForm (idler) {
  document.querySelector('#createEditIdler-form').classList.remove('was-validated')
  document.querySelector('#form-lastbotname').value = idler ? idler.name : ''
  document.querySelector('#form-botname').value = idler ? idler.name : ''
  document.querySelector('#form-gamename').value = idler ? idler.game : ''
  document.querySelector('#form-type').value = idler ? idler.type : 'none'
  document.querySelector('#form-autostart').checked = idler ? idler.autostart : ''
  document.querySelector('#form-points').checked = idler ? idler.channelPoints : ''

  document.querySelector('#form-gamename-checkbox').checked = false
  document.querySelector('#form-gamename').setAttribute('placeholder', document.querySelector('#form-gamename').getAttribute('data-placeholder'))
  document.querySelector('#form-gamename').removeAttribute('disabled')
  document.querySelector('#form-gamename').setAttribute('data-last-game', '')

  if (idler && (idler.game == null || idler.game === '')) {
    document.querySelector('#form-gamename-checkbox').checked = true
    document.querySelector('#form-gamename').setAttribute('placeholder', '')
    document.querySelector('#form-gamename').setAttribute('disabled', true)
  }

  document.querySelector('#form-streamer').value = ''
  document.querySelector('#form-streamer').setAttribute('placeholder', document.querySelector('#form-streamer').getAttribute('data-placeholder'))
  document.querySelector('#form-streamer').setAttribute('data-last-streamer', '')
  document.querySelector('#form-streamer').removeAttribute('disabled')
  document.querySelector('#form-streamer-checkbox').checked = false

  if (idler) {
    if (idler.streamerList == null || idler.streamerList.length === 0) {
      document.querySelector('#form-streamer').setAttribute('placeholder', '')
      document.querySelector('#form-streamer').setAttribute('disabled', true)
      document.querySelector('#form-streamer-checkbox').checked = true
    } else {
      document.querySelector('#form-streamer').value = idler.streamerList.join('\n')
    }
  }
}

function loadForm (name) {
  showSpinner(true)

  fetch('settings').then(catchError).then(res => res.json()).then(res => {
    showSpinner(false)
    const idler = getIdlerFromSettings(res, name)
    if (idler == null) return
    setOrClearForm(idler.attr)
  }).catch((e) => {
    console.log(e)
    showSpinner(false)
  })
}

function saveIdler (event) {
  event.preventDefault()
  event.stopPropagation()
  event.target.classList.add('was-validated')
  if (!event.target.checkValidity()) {
    return
  }

  // let botnameChk = document.querySelector("#form-gamename-checkbox");
  // let streamerChk = document.querySelector("#form-streamer-checkbox");

  const previousName = document.querySelector('#form-lastbotname')
  // Max 40 chars, no spaces only A-Za-z0-9_\-
  const botname = document.querySelector('#form-botname')
  const gamename = document.querySelector('#form-gamename')
  const type = document.querySelector('#form-type')
  const account = document.querySelector('#form-account')
  // No spaces
  const streamer = document.querySelector('#form-streamer')
  const autostart = document.querySelector('#form-autostart')
  const points = document.querySelector('#form-points')

  var botObj = {
    name: botname.value.trim(),
    game: gamename.value.trim(),
    type: type.value.toLowerCase().trim(),
    account: account.value.trim(),
    autostart: autostart.checked,
    channelPoints: points.checked,
    streamerList: streamer.value.split('\n')
  }

  var sendData = {}
  sendData.bot = botObj
  sendData.lastname = previousName.value.trim()

  lockForm(true)
  showSpinner(true)

  fetch('saveIdler', {
    method: 'POST',
    body: JSON.stringify(sendData), // data can be `string` or {object}!
    headers: {
      'Content-Type': 'application/json'
    }
  }).then(catchError)
    .then(res => res.text()).then((res) => {
      showAlert('Added idler - ' + botObj.name, 'success')
      closeModal()
      // TODO - This a cheat
      window.location.reload()
    }).catch(res => {
      console.log(res)
      showAlert('Failed to save idler - ' + res.replace(stripTags, ' '), 'danger')
    }).finally(() => {
      showSpinner(false)
      lockForm(false)
    })

  console.log(sendData)
}

function deleteIdler () {
  const idler = document.querySelector('#form-lastbotname').value
  const exit = confirm(`Are you sure you want to delete ${idler}?`)

  if (!exit) { return }
  lockForm(true)
  showSpinner(true)
  fetch(`${idler}/delete`, {
    method: 'POST'
  }).then(catchError).then(() => {
    showAlert(`Deleted ${idler}`, 'success')
    closeModal()
    // TODO - This a cheat
    window.location.reload()
  }).catch((e) => {
    console.log(e)
    showAlert(`Failed to delete ${idler} - ${e.replace(stripTags, ' ')}`, 'danger')
  }).finally(() => {
    showSpinner(false)
    lockForm(false)
  })
}

function stopStartIdler (name) {
  var page = selectedIdlerPage()
  var running = page.querySelector('.start-stop-idler').getAttribute('data-running')
  if (running === undefined || running === null) { return }
  page.querySelector('.start-stop-idler').classList.add('disabled')
  fetch(`${name}/${running === 'true' ? 'stop' : 'start'}`, {
    method: 'POST'
  }).then(catchError).then(() => {
    page.querySelector('.start-stop-idler').classList.remove('disabled')
    showAlert(`${running === 'true' ? 'Stopped' : 'Started'} idler - ${name}`, 'success')
  }).catch((e) => {
    console.log(e)
    page.querySelector('.start-stop-idler').classList.remove('disabled')
    showAlert(`Failed to ${running === 'true' ? 'stop' : 'start'} idler ${name} - ${e.replace(stripTags, ' ')}`, 'danger')
  })
}

function goToNextStreamer (name) {
  fetch(`${name}/nextstreamer`, {
    method: 'POST'
  }).then(catchError).catch((e) => {
    console.log(e)
    showAlert('Failed to go to next streamer - ' + e.replace(stripTags, ' '), 'danger')
  })
}

function updateRate (e) {
  imageIntervalTime = (60 / parseInt(e.target.value)) * 1000
  clearInterval(imageInterval)
  imageInterval = setInterval(updateImage, imageIntervalTime)
  localStorage.setItem('imageIntervalTime', imageIntervalTime)
}

async function updateLogs () {
  // skip to avoid flooding server
  if (!logsLoadFinished) return
  logsLoadFinished = false

  fetch('settings').then(catchError).then(res => res.json()).then(res => {
    // Global updates
    res.idlers.forEach(function (e) {
      var name = e.attr.name
      var running = e.running
      document.querySelector(`#v-pills-${name}-tab .status-icon`).textContent = (running ? '✔️' : '⭕')
    })
    // Current page updates
    const page = selectedIdlerPage()
    const name = selectedIdlerName()
    if (name == null) return

    const idler = getIdlerFromSettings(res, name)
    if (idler == null) return

    page.querySelector('.info-bot .data').textContent = idler.attr.name
    page.querySelector('.info-account .data').textContent = idler.attr.account
    page.querySelector('.info-game .data').textContent = idler.attr.game ? decodeURIComponent(idler.attr.game) : 'Any'

    page.querySelector('.info-status').classList.forEach(function (e) {
      if (e.toLowerCase().indexOf('bg-') !== -1) {
        page.querySelector('.info-status').classList.remove(e)
      }
    })

    if (idler.navigating) {
      page.querySelector('.info-status .data').textContent = 'Navigating'
      page.querySelector('.info-status').classList.add('bg-warning')
      page.querySelector('.info-status').setAttribute('data-status', 'navigating')
      page.querySelector('.holdingImage').style.display = 'none'
      page.querySelector('.statusImage').style.display = 'inline-block'
    } else if (idler.running) {
      page.querySelector('.info-status .data').textContent = 'Running'
      page.querySelector('.info-status').classList.add('bg-success')
      page.querySelector('.info-status').classList.add('bg-success')
      page.querySelector('.info-status').setAttribute('data-status', 'running')
      page.querySelector('.holdingImage').style.display = 'none'
      page.querySelector('.statusImage').style.display = 'inline-block'
    } else {
      page.querySelector('.info-status .data').textContent = 'Stopped'
      page.querySelector('.info-status').classList.add('bg-danger')
      page.querySelector('.info-status').setAttribute('data-status', 'stopped')
      page.querySelector('.holdingImage').style.display = 'inline-block'
      page.querySelector('.statusImage').style.display = 'none'
    }

    const streamer = page.querySelector('.info-streamer .data')
    streamer.textContent = idler.currentStreamer || '...'
    streamer.setAttribute('href', `https://twitch.tv/${idler.currentStreamer}`)

    page.querySelector('.info-time .data').textContent = (idler.startTime === 0) ? '...' : secondsToHms((Date.now() - idler.startTime) / 1000)
    page.querySelector('.info-type .data').textContent = idler.attr.type
    page.querySelector('.holdingLogs').style.display = 'none'

    if (idler.logs.length > 0) {
      const logArea = page.querySelector('.statusLog')
      const logIndex = parseInt(logArea.getAttribute('data-index') || 0)
      for (let i = 0; i < idler.logs.length; i++) {
        var item = idler.logs[i]
        var output = item.status
        if (item.index <= logIndex) {
          continue
        }

        if (item.includedLink) {
          output = output.replace(item.includedLink, `<a href='https://twitch.tv/${item.includedLink}' target='_blank'>${item.includedLink}</a>`)
        }

        logArea.insertAdjacentHTML('afterbegin', `<p>${output}</p>`)
      }

      logArea.setAttribute('data-index', idler.logindex)
    }

    page.querySelector('.start-stop-idler').setAttribute('data-running', idler.running.toString())
    page.querySelector('.start-stop-idler').classList.remove('btn-warning')
    page.querySelector('.start-stop-idler').classList.remove('btn-danger')
    page.querySelector('.start-stop-idler').classList.remove('btn-success')
    page.querySelector('.start-stop-idler').classList.add(idler.running ? 'btn-danger' : 'btn-success')
    page.querySelector('.start-stop-idler').textContent = idler.running ? 'Stop Idler' : 'Start Idler'
  }).catch((e) => {
    console.log(e)
    console.log(`Failed to get logs: ${e.message}`)
  }).finally(() => {
    logsLoadFinished = true
  })
}

async function updateImage () {
  var name = selectedIdlerName()
  if (!name) {
    return
  }
  var status = selectedIdlerPage().querySelector('.info-status').getAttribute('data-status')

  if (status === 'stopped' || status === undefined || status === null) return

  // Make sure the last image has loaded so we don't flood the server
  if (imageLoadFinished) {
    imageLoadFinished = false
    fetch(`${name}/screenshot`).then(catchError).then(res => res.text()).then(res => {
      var page = selectedIdlerPage()
      page.querySelector('.holdingImage').style.display = 'none'
      page.querySelector('.statusImage').style.display = 'inline-block'
      page.querySelector('.statusImage').setAttribute('src', `data:image/jpg;base64,${res}`)
      imageLoadFinished = true
    }).catch((e) => {
      console.log(e)
      imageLoadFinished = true
      console.log(`Failed to get image: ${e.message}`)
    })
  }
}

function sendMouseClick (x, y, name) {
  fetch('mouseClick', {
    method: 'POST',
    body: JSON.stringify({
      x,
      y,
      name
    }), // data can be `string` or {object}!
    headers: {
      'Content-Type': 'application/json'
    }
  })
}

function prepareCreateEditModal (accounts) {
  document.getElementById('deleteButton').addEventListener('click', deleteIdler)

  var modal = document.querySelector('#createEditIdler')

  accounts.forEach(function (e) {
    modal.querySelector('#form-account').insertAdjacentHTML('beforeend', `<option>${e}</option>`)
  })

  modal.querySelector('#form-gamename-checkbox').addEventListener('change', function (e) {
    if (modal.querySelector('#form-gamename-checkbox').checked) {
      modal.querySelector('#form-gamename').setAttribute('data-last-game', modal.querySelector('#form-gamename').value)
      modal.querySelector('#form-gamename').value = ''
      modal.querySelector('#form-gamename').setAttribute('placeholder', '')
      modal.querySelector('#form-gamename').setAttribute('disabled', 'true')
    } else {
      modal.querySelector('#form-gamename').value = modal.querySelector('#form-gamename').getAttribute('data-last-game')
      modal.querySelector('#form-gamename').setAttribute('data-last-game', '')
      modal.querySelector('#form-gamename').setAttribute('placeholder', modal.querySelector('#form-gamename').getAttribute('data-placeholder'))
      modal.querySelector('#form-gamename').removeAttribute('disabled')
    }
  })

  modal.querySelector('#form-streamer-checkbox').addEventListener('change', function (e) {
    if (modal.querySelector('#form-streamer-checkbox').checked) {
      modal.querySelector('#form-streamer').setAttribute('data-last-streamer', modal.querySelector('#form-streamer').value)
      modal.querySelector('#form-streamer').value = ''
      modal.querySelector('#form-streamer').setAttribute('placeholder', '')
      modal.querySelector('#form-streamer').setAttribute('disabled', 'true')
    } else {
      modal.querySelector('#form-streamer').value = modal.querySelector('#form-streamer').getAttribute('data-last-streamer')
      modal.querySelector('#form-streamer').setAttribute('data-last-streamer', '')
      modal.querySelector('#form-streamer').setAttribute('placeholder', modal.querySelector('#form-streamer').getAttribute('data-placeholder'))
      modal.querySelector('#form-streamer').removeAttribute('disabled')
    }
  })

  modal.querySelector('#createEditIdler-form').addEventListener('submit', saveIdler, true)
}

// Start

document.getElementById('killButton').addEventListener('click', () => {
  var exit = confirm('Are you sure you want to stop the twitch-drops-lurker process?')

  if (!exit) { return }

  fetch('kill', {
    method: 'POST'
  }).then(catchError).then(() => {
    setTimeout(window.location.reload, 2000)
  }).catch((e) => {
    console.log(e)
    showAlert('Failed to stop process', 'danger')
  })
})

// Update settings and populate idlers
fetch('settings').then(catchError).then(r => r.json()).then(res => {
  height = res.settings.VIEWPORT_HEIGHT
  width = res.settings.VIEWPORT_WIDTH
  res.idlers.forEach(createNewTab)
  prepareCreateEditModal(res.accounts)
}).catch((e) => {
  console.log(e)
  showAlert('Failed to get global settings - ' + e.replace(stripTags, ' '), 'danger')
})

document.getElementById('createEditIdler').addEventListener('show.bs.modal', function (event) {
  var button = event.relatedTarget
  var name = button.getAttribute('data-bs-edit')
  setOrClearForm()
  document.getElementById('createEditIdler').querySelector('.modal-title').textContent = (name ? `Edit Idler - ${name}` : 'Create New Idler')
  document.getElementById('createEditIdler').querySelector('#form-lastbotname').value = (name || '')
  document.getElementById('createEditIdler').querySelector('#deleteButton').style.display = (name ? '' : 'none')
  if (name) loadForm(name)
})

// idlerModal.addEventListener('hide.bs.modal', function (event) {
//     hideAlert();
// })

// Map one number to another
function map (x, inMin, inMax, outMin, outMax) {
  return (x - inMin) * (outMax - outMin) / (inMax - inMin) + outMin
}

// https://stackoverflow.com/questions/37096367/how-to-convert-seconds-to-minutes-and-hours-in-javascript
function secondsToHms (d) {
  d = Number(d)
  var h = Math.floor(d / 3600)
  var m = Math.floor(d % 3600 / 60)
  var s = Math.floor(d % 3600 % 60)

  var hDisplay = h > 0 ? h + (h === 1 ? ' hour, ' : ' hours, ') : ''
  var mDisplay = m > 0 ? m + (m === 1 ? ' minute, ' : ' minutes, ') : ''
  var sDisplay = s + (s === 1 ? ' second' : ' seconds')
  return hDisplay + mDisplay + sDisplay
}

async function catchError (response) {
  if (response.status >= 200 && response.status <= 299) {
    return response
  } else {
    const data = await response.text()
    throw data
  }
}

let alertTimeout = null
function showAlert (data, type) {
  if (alertTimeout) { clearTimeout(alertTimeout) }

  document.querySelector('.alert').classList.forEach(function (e) {
    if (e.indexOf('dismissible') === -1 && e.indexOf('alert-') !== -1) {
      document.querySelector('.alert').classList.remove(e)
    }
  })
  document.querySelector('.alert-body').textContent = data
  document.querySelector('.alert').classList.add(`alert-${type}`)
  document.querySelector('.alert').classList.add('show')
  alertTimeout = setTimeout(hideAlert, 5000)
}

function hideAlert () {
  document.querySelector('.alert').classList.remove('show')
}

function showSpinner (show) {
  document.querySelector('#createEditIdler #createEditIdler-body').style.display = (show ? 'none' : '')
  document.querySelector('#createEditIdler #modalSpinner').style.display = (show ? '' : 'none')
}

function lockForm (lock) {
  document.querySelectorAll(
    '#createEditIdler form input,' +
    '#createEditIdler form textarea,' +
    '#createEditIdler form select' +
    '#deleteButton',
    '#saveButton'
  ).forEach(function (e) {
    if (lock) {
      e.setAttribute('disabled', 'true')
    } else {
      e.removeAttribute('disabled')
    }
  })
}

function closeModal () {
  var modal = bootstrap.Modal.getInstance(document.getElementById('createEditIdler'))
  modal.hide()
}

function getIdlerFromSettings (res, name) {
  for (let i = 0; i < res.idlers.length; i++) {
    const current = res.idlers[i]
    if (current.attr.name.toLowerCase() === name.toLowerCase()) {
      return current
    }
  }
  return null
}
