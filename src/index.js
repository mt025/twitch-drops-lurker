export const settings = {
    CHROME_EXEC_PATH: "/usr/bin/chromium-browser",
    VIEWPORT_WIDTH: 1080,
    VIEWPORT_HEIGHT: 720,
    DROPS_ENABLED_TAGID:  'c2542d6d-cd10-4532-919b-3d19f30a768b'
};

import { prepareBrowser } from './puppeteerPage';
import { Idler } from './idlers';
import fs from 'fs';
import path from 'path';
import { waitAsync } from './utils';
import './webserver';

//Get the idler object by name
export function getIdlersByName(name) {
    for (let i = 0; i < idlers.length; i++) {
        if (name.toLowerCase() == idlers[i].name.toLowerCase()) {
            return idlers[i]
        }
    }
}

export const idlers = [];
async function createIdlers() {
    var usersFile = path.join(__dirname, '..', "userlogins", `users.json`);

    //Do we have a file?
    if (!fs.existsSync(usersFile)) { return false; }

    //Process the file
    const idlerData = require(usersFile);

    idlerData.forEach(async function (idler) {
        var idlerObj = Object.assign(new Idler(), idler);
        idlers.push(idlerObj);

        if (idlerObj == null || !idlerObj.autostart) return;
        await idlerObj.start();
    });

    keepIdlersAlive();

    return true;

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
    await prepareBrowser();

    //Create idlers 
    await createIdlers();

}
