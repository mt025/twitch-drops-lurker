import { prepareBrowser } from './puppeteerPage'
import { Idler } from './idler'
import fs from 'fs'
import path from 'path'
import { waitAsync, askQuestion, chromePaths } from './utils'
import { startServer } from './webserver'
import { platform } from 'os'

export const settings = {
  VIEWPORT_WIDTH: 1080,
  VIEWPORT_HEIGHT: 792,
  DROPS_ENABLED_TAGID: 'c2542d6d-cd10-4532-919b-3d19f30a768b',
  CHECK_TIME_IN_SECONDS: 1 * 60
}

async function searchForBrowser () {
  const chromeLocationFile = path.join(__dirname, '..', '.chromelocation')
  if (fs.existsSync(chromeLocationFile)) {
    settings.CHROME_EXEC_PATH = fs.readFileSync(chromeLocationFile, 'utf8').toString()
    if (fs.existsSync(settings.CHROME_EXEC_PATH)) {
      return
    } else {
      console.log(`Could not find chrome at ${settings.CHROME_EXEC_PATH}`)
    }
  }

  // Search for chrome ELF/EXE
  let searchPath
  switch (platform()) {
    case 'win32':
      searchPath = chromePaths.win32
      break
    case 'darwin':
      searchPath = chromePaths.osx
      break
    default:
      searchPath = chromePaths.unix
      break
  }

  for (let i = 0; i < searchPath.length; i++) {
    const e = searchPath[i]

    if (fs.existsSync(e)) {
      settings.CHROME_EXEC_PATH = e
      fs.writeFileSync(chromeLocationFile, e)
      console.log(`Found chrome path ${e}.`)
      console.log(`Edit ${chromeLocationFile} if you wish to change the path.`)
      return
    }
  }

  // We didn't find the path, ask the user
  console.log("Couldn't automatically find chrome on your system.")

  let failed = false
  let res = ''
  while (true) {
    res = await askQuestion((failed ? `File "${res}" does not exist, try again: ` : 'Please enter the path to your chrome exe/elf file: '))
    if (fs.existsSync(res)) {
      settings.CHROME_EXEC_PATH = res
      fs.writeFileSync(chromeLocationFile, res)
      console.log(`Found chrome path ${res}.`)
      console.log(`Edit ${chromeLocationFile} if you wish to change the path.`)
      break
    } else {
      failed = true
    }
  }
}

// Get the idler object by name
export function getIdlersByName (name) {
  for (let i = 0; i < idlers.length; i++) {
    if (name.toLowerCase() === idlers[i].attr.name.toLowerCase()) {
      return { key: i, value: idlers[i] }
    }
  }
  return null
}

export const accounts = []
async function populateAccounts () {
  var accountPath = path.join(__dirname, '..', 'userlogins')

  fs.readdir(accountPath, (err, files) => {
    if (err) {
      throw err
    }
    files.forEach(file => {
      if (file.toLowerCase().indexOf('_cookies.json') !== -1) {
        accounts.push(file.split('_')[0].toLowerCase())
      }
    })
  })
}

export const idlers = []
async function createIdlers () {
  var usersFile = path.join(__dirname, '..', 'userlogins', 'users.json')

  // Do we have a file?
  if (!fs.existsSync(usersFile)) { return false }

  // Process the file
  const idlerData = require(usersFile)

  idlerData.forEach(async function (idler) {
    const template = {}

    // Idler default settings
    template.type = 'new'
    template.account = (accounts.length > 0) ? accounts[0] : null
    template.game = null
    template.streamerList = null
    template.autostart = false
    template.channelPoints = false
    template.hideVideo = false

    const attrObj = {}
    attrObj.attr = Object.assign(template, idler)
    var idlerObj = Object.assign(new Idler(), attrObj)
    idlers.push(idlerObj)

    if (idlerObj == null || !idlerObj.attr.autostart) return
    idlerObj.start()
  })

  keepIdlersAlive()

  return true
}

// Move mouse and swap tab every 10 seconds
async function keepIdlersAlive () {
  while (true) {
    for (let i = 0; i < idlers.length; i++) {
      if (!idlers[i].running) continue
      try {
        await idlers[i].keepAlive()
      } catch (e) {}
      await waitAsync(10000)
    }
    await waitAsync(1000)
  }
}

export function saveIdersToFile () {
  const usersFile = path.join(__dirname, '..', 'userlogins', 'users.json')
  const outData = []
  for (let i = 0; i < idlers.length; i++) {
    outData.push(idlers[i].attr)
  }

  fs.writeFileSync(usersFile, JSON.stringify(outData))
}

main()

async function main () {
  // Find the chrome browser
  await searchForBrowser()

  // Populate accounts
  await populateAccounts()

  // Start the chrome browser
  await prepareBrowser()

  // Create idlers
  await createIdlers()

  // Start the webserver
  startServer()
}
