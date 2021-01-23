import puppeteer from 'puppeteer-extra'
import fs from 'fs'
import path from 'path'
import { waitAsync } from './utils'
import StealthPlugin from 'puppeteer-extra-plugin-stealth'

puppeteer.use(StealthPlugin())

const cookiesPath = path.join(__dirname, '..', 'cookies.json')
const localStoragePath = path.join(__dirname, '..', 'localStorage.json')
if (!fs.existsSync(cookiesPath) || !fs.existsSync(localStoragePath)) {
  throw new Error('cookies.json or localStorage.json not found. Please check README for installation instructions')
}

const savedCookies = require(cookiesPath)
const savedLocalStorage = require(localStoragePath)

export let page = null

let headless = true;

if (process.argv.length > 3) {
	headless = !(process.argv[3].toLowerCase() === "false");
}

export async function preparePage () {
  // Prepare browser
  const browser = await puppeteer.launch({
    executablePath: process.env.CHROME_EXEC_PATH,
    args: [
	  '--proxy-server="direct://"',
      '--proxy-bypass-list=*',
	  '--blink-settings=imagesEnabled=false',
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-infobars',
      '--window-position=0,0',
      '--ignore-certifcate-errors',
      '--ignore-certifcate-errors-spki-list',
	  '--no-proxy-server',
      '--disable-canvas-aa', 
      '--disable-2d-canvas-clip-aa',
      '--disable-gl-drawing-for-tests',
      '--disable-dev-shm-usage', 
      '--no-zygote', 
      '--use-gl=swiftshader', 
      '--enable-webgl',
      '--hide-scrollbars',
      '--mute-audio',
      '--no-first-run',
      '--disable-infobars',
      '--disable-breakpad'
    ],
    headless,
    dumpio: false,
    defaultViewport: {
      width: 1080,
      height: 720
    }
  })
  page = await browser.newPage()
  await page.setUserAgent('Mozilla/5.0 (X11; Linux armv7l) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/86.0.4240.197 Safari/537.36')
  await page.setCookie(...savedCookies)

  // Setup localStorage for twitch.tv
  await page.goto('https://twitch.tv/')
  await waitAsync(100)
  await page.evaluate((_savedLocalStorage) => {
    JSON.parse(_savedLocalStorage).forEach(([key, value]) => {
      window.localStorage.setItem(key, value)
    })
    // Override important values
    window.localStorage.setItem('mature', 'true')
    window.localStorage.setItem('video-quality', '{"default":"160p30"}')
  }, [JSON.stringify(savedLocalStorage)])
  await waitAsync(500)

  return page
}
