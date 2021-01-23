import puppeteer from 'puppeteer-extra';
import fs from 'fs';
import path from 'path';
import { waitAsync } from './utils';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
import { settings } from './index'

puppeteer.use(StealthPlugin());

let headless = true;

if (process.argv.length > 3) {
    headless = !(process.argv[3].toLowerCase() === "false");
}

const chromeArgs = [
    '--proxy-server="direct://"', //Disable Proxy Servers, can cause headless time to increase
    '--proxy-bypass-list=*', //Disable Proxy Servers, can cause headless time to increase
    '--no-proxy-server', //Disable Proxy Servers, can cause headless time to increase
    //'--blink-settings=imagesEnabled=false', //Disable Images, TODO: make this an option to user
    '--no-sandbox', //Disable sandboxing
    '--disable-setuid-sandbox', //Disables setuid sandbox
    '--no-zygote', //Disable zygote sandbox
    '--window-position=0,0', //Always start window at 0,0
    '--ignore-certifcate-errors', //Ignore any cert issues
    '--ignore-certifcate-errors-spki-list', //Ignore any cert issues
    '--disable-canvas-aa', //Disable antialiasing on 2d canvas.
    '--disable-2d-canvas-clip-aa', //Disable antialiasing on 2d canvas clips
    '--disable-dev-shm-usage', //The /dev/shm partition is too small in certain VM environments, causing Chrome to fail or crash
    '--hide-scrollbars', //Hide scrollbars from screenshots
    '--mute-audio', //Mutes device audio
    '--no-first-run', //Disables first run tasks - TODO: TEST
    '--disable-breakpad' //Disables the crash reporting
];

if (headless) {
    chromeArgs.push('--disable-gl-drawing-for-tests'); //Disables GL drawing operations which produce pixel output. Required for headded mode

}

export let browser = null;

export async function prepareBrowser() {
    // Prepare browser
    browser = await puppeteer.launch({
            executablePath: settings.CHROME_EXEC_PATH,
            args: chromeArgs,
            headless,
            dumpio: false,
            defaultViewport: {
                width: 1080,
                height: 720
            }
        });
    return browser;
}

export async function preparePage(userpage) {

    if (!fs.existsSync(userpage.cookies) || !fs.existsSync(userpage.storage)) {
        throw new Error(userpage.account + '_cookies.json or ' + userpage.account + '_localStorage.json not found. Please check README for installation instructions')
    }
    const savedCookies = require(userpage.cookies);
    const savedLocalStorage = require(userpage.storage);
	
	//Setup page
    userpage.page = await browser.newPage();
    await userpage.page.setUserAgent('Mozilla/5.0 (X11; Linux armv7l) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/86.0.4240.197 Safari/537.36');

	//Setup cookies
    try {
        await userpage.page.setCookie(...savedCookies);
    } catch (e) {
        throw new Error("Failed to set cookies");
    }

    
    await userpage.page.goto('https://twitch.tv/');
    await waitAsync(100);

	// Setup localStorage for twitch.tv
    try {
        await userpage.page.evaluate((_savedLocalStorage) => {
            JSON.parse(_savedLocalStorage).forEach(([key, value]) => {
                window.localStorage.setItem(key, value)
            });
            // Override important values
            window.localStorage.setItem('mature', 'true');
            window.localStorage.setItem('video-quality', '{"default":"160p30"}');
        }, [JSON.stringify(savedLocalStorage)]);
    } catch (e) {
        throw new Error("Failed to set localstorage: " + e.message);

    }
	
	
	
	
    await waitAsync(500);

    return userpage.page;

}
