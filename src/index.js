export const settings = {
    CHROME_EXEC_PATH: "/usr/bin/chromium-browser",
    VIEWPORT_WIDTH: 1080,
    VIEWPORT_HEIGHT: 720
}

import {
    prepareBrowser,
    preparePage
}
    from './puppeteerPage'
import './webserver'
import {
    Idler
}
    from './idlers'
import {
    waitAsync
}
    from './utils'
import fs from 'fs';

export const idlers = [];
//idlers.push(new Idler("siege", "magictree", "legacy", "Tom%20Clancy's%20Rainbow%20Six%20Siege", true));
idlers.push(new Idler("siege2", "magictree", "legacy", "Tom%20Clancy's%20Rainbow%20Six%20Siege", true));



//Get the idler object by name
export function getIdlersByName(name) {
    for (let i = 0; i < idlers.length; i++) {
        if (name.toLowerCase() == idlers[i].name.toLowerCase()) {
            return idlers[i]
        }
    }
}

//Move mouse and swap tab every 10 seconds
async function keepIdlersAlive() {
    while (true) {
        for (let i = 0; i < idlers.length; i++) {
            try {
                await idlers[i].keepAlive();
            } catch (e) { }
            await waitAsync(10000);
        }
        await waitAsync(1000);
    }

}

main();

async function main() {

    //Start the chrome browser
    await prepareBrowser()

    //Create the required idlers
    idlers.forEach(async function (idler) {
        try {
            //Prepare the page
            await preparePage(idler)

            //Go to streamer
            idler.goToLiveStreamer();

            //Refresh
            setInterval(async () => {

                if (idler.currentStreamer == null)
                    return;

                // Watch for live status, and go to another streamer if needed
                if (!(await idler.isPageOnValidStreamer())) {
                    await idler.goToLiveStreamer();
                }

                // Reload page every hour to avoid watching X streamer status going away if the user navigates twitch
                const msElapsed = Date.now() - idler.startTime;
                if (msElapsed < 1000 * 60 * 60) {
                    return;
                }
                await idler.hourReload();

            }, 1000 * 60)

            console.log(`Created page for ${idler.name} using account ${idler.account}`);
        } catch (e) {
            console.error(`Failed to create page -  ${idler.name} - ${e.message}`);
        }

    });

    keepIdlersAlive();

}
