import readline from 'readline'

export function waitAsync (ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

// https://www.tutorialspoint.com/generate-random-string-characters-in-javascript
export function generateRandomString (numberOfCharacters) {
  var randomValues = ''
  var stringValues = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
  var sizeOfCharacter = stringValues.length
  for (var i = 0; i < numberOfCharacters; i++) {
    randomValues = randomValues + stringValues.charAt(Math.floor(Math.random() * sizeOfCharacter))
  }
  return randomValues
}

// https://stackoverflow.com/a/50890409/4775650
export function askQuestion (query) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  })

  return new Promise(resolve => rl.question(query, ans => {
    rl.close()
    resolve(ans)
  }))
}

export const chromePaths = {

  win32: [
    '%ProgramFiles(x86)%\\Google\\Chrome\\Application\\chrome.exe',
    '%ProgramFiles%\\Google\\Chrome\\Application\\chrome.exe',
    '%LocalAppData%\\Google\\Chrome\\Application\\chrome.exe'
  ],
  unix: [
    '/usr/bin/google-chrome-stable',
    '/bin/google-chrome-stable',
    '/usr/local/bin/google-chrome-stable',

    '/usr/bin/chrome-browser',
    '/bin/chrome-browser',
    '/usr/local/bin/chrome-browser',

    '/usr/bin/chrome',
    '/bin/chrome',
    '/usr/local/bin/chrome',

    '/usr/bin/chromium-browser',
    '/bin/chromium-browser',
    '/usr/local/bin/chromium-browser',

    '/usr/bin/chromium',
    '/bin/chromium',
    '/usr/local/bin/chromium',

    '/usr/bin/google-chrome-beta',
    '/bin/google-chrome-beta',
    '/usr/local/bin/google-chrome-beta',

    '/usr/bin/brave-browser',
    '/bin/brave-browser',
    '/usr/local/bin/brave-browser'

  ],
  osx: [
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
  ]

}
