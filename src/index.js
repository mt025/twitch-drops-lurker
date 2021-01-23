import {prepareBrowser,preparePage}from './puppeteerPage'
import './webserver'
import { UserPage } from './userpage'
import { waitAsync } from './utils'
import logger from './logger'
import fs from 'fs';

export const pages = [];
pages.push(new UserPage("rust","magictree","new","Rust"));
pages.push(new UserPage("alt","magictree","new",["https://www.twitch.tv/Rubius","https://www.twitch.tv/juansguarnizo","https://www.twitch.tv/Mizkif"]));
pages.push(new UserPage("alt2","magictree","legacy","Tom%20Clancy's%20Rainbow%20Six%20Siege"));

export const settings = {
	CHROME_EXEC_PATH : "/usr/bin/chromium-browser",
	SCREENSHOT_INTERVAL : 5	
}

export function getPageByName(name){
	for(let i = 0; i < pages.length; i++){
		if(name.toLowerCase() == pages[i].name.toLowerCase()){
			return pages[i]
		}
	}
}


main();

async function main() {
	
	//Delete old screenshot
    try {
        fs.unlinkSync('./public/status.jpg');
    } catch (e) {}

    //Start the chrome browser
    await prepareBrowser()
	
	//Create the required pages
	pages.forEach(async function(userpage){
		try{
			await preparePage(userpage)
			console.log("Created page for " + userpage.name + " using account " + userpage.account);
		}
		catch (e)
		{
			console.error("Failed to create page - " + userpage.name + " - " + e.message);
		}
		
	});

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
