import {prepareBrowser,preparePage}from './puppeteerPage'
import './webserver'
import { UserPage } from './userpage'
import { waitAsync } from './utils'
import logger from './logger'
import fs from 'fs';

export const pages = [];
pages.push(new UserPage("main","legacy","Rust"));
pages.push(new UserPage("alt","new",["https://www.twitch.tv/Rubius","https://www.twitch.tv/juansguarnizo","https://www.twitch.tv/Mizkif"]));
pages.push(new UserPage("alt2","new","Tom%20Clancy's%20Rainbow%20Six%20Siege"));

const game = process.env.GAME;
const dropsEnabledTagID = 'c2542d6d-cd10-4532-919b-3d19f30a768b';

main();

let activeStreamerName = null;
let activeStreamerTimestamp = 0;




async function main() {
	
	    //Delete old screenshot
    try {
        fs.unlinkSync('./public/status.jpg');
    } catch (e) {}

    //Start the chrome browser
    await prepareBrowser()
	
	//Create the required pages
	pages.forEach(async function(page){
		try{
			page.page = await preparePage(page.name)
		}
		catch (e)
		{
			console.error("Failed to create page - " + page.name + " - " + e.message);
		}
		
	});

    // For debugging, take a pic at screenshot interval
    //setInterval(() => {
    //    try {
    //        page.screenshot({
    //            path: './public/status.jpg'
    //        })
    //    } catch (e) {
    //        console.error("Unable to take screenshot");
    //    }
	//
    //}, process.env.SCREENSHOT_INTERVAL * 1000)

    // Go watch a streamer
    //await goToRandomLiveStreamer()

    // Watch for live status, and go to another streamer if needed
    //setInterval(async() => {
    //    if (!(await isPageOnValidStreamer())) {
    //        await goToRandomLiveStreamer()
    //    }
    //}, 1000 * 60)

    // Reload page every hour to avoid watching X streamer status going away if the user navigates twitch
    //setInterval(async() => {
    //    if (activeStreamerName === null)
    //        return
    //        const msElapsed = Date.now() - activeStreamerTimestamp
    //            if (msElapsed < 1000 * 60 * 60)
    //                return
    //                await goToRandomLiveStreamer()
    //}, 1000 * 60)

    // Move mouse to random location every 10 sec. Does this do anything? Probably not
    //setInterval(async() => {
    //    try {
    //        const randomScreenPos = (max) => Math.floor(Math.random() * max)
    //        await page.mouse.move(randomScreenPos(1080), randomScreenPos(720))
    //    } catch (e) {
    //        console.error("Unable to move mouse");
	//
    //    }
    //}, 1000 * 10)

}
