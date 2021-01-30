export const settings = {
    CHROME_EXEC_PATH: "/usr/bin/chromium-browser",
    VIEWPORT_WIDTH: 1080,
    VIEWPORT_HEIGHT: 720,
    DROPS_ENABLED_TAGID: 'c2542d6d-cd10-4532-919b-3d19f30a768b'
};

import { prepareBrowser } from './puppeteerPage';
import { Idler } from './idler';
import fs from 'fs';
import path from 'path';
import { waitAsync } from './utils';
import './webserver';

//Get the idler object by name
export function getIdlersByName(name) {
    for (let i = 0; i < idlers.length; i++) {
        if (name.toLowerCase() == idlers[i].attr.name.toLowerCase()) {
            return idlers[i]
        }
    }
}

export const accounts = [];
async function populateAccounts() {
    var accountPath = path.join(__dirname, '..', "userlogins");

    fs.readdir(accountPath, (err, files) => {
        if (err) {
            throw err;
        }
        files.forEach(file => {
            if (file.toLowerCase().indexOf("_cookies.json") != -1) {
                accounts.push(file.split("_")[0].toLowerCase());
            }

        });
    });
}




export const idlers = [];
async function createIdlers() {
    var usersFile = path.join(__dirname, '..', "userlogins", `users.json`);

    //Do we have a file?
    if (!fs.existsSync(usersFile)) { return false; }

    //Process the file
    const idlerData = require(usersFile);

    idlerData.forEach(async function (idler) {
        let attrObj = {};
        attrObj.attr = idler;
        var idlerObj = Object.assign(new Idler(), idler);
        idlers.push(idlerObj);

        if (idlerObj == null || !idlerObj.attr.autostart) return;
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

    //Populate accounts
    await populateAccounts();

    //Start the chrome browser
    await prepareBrowser();

    //Create idlers 
    await createIdlers();

}
