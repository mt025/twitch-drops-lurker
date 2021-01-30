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
import { startServer } from './webserver';

//Get the idler object by name
export function getIdlersByName(name) {
    for (let i = 0; i < idlers.length; i++) {
        if (name.toLowerCase() == idlers[i].attr.name.toLowerCase()) {
            return {key: i, value: idlers[i]}
        }
    }
    return null;
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
        let template = {};

        //Idler default settings
        template.type = "new";
        template.account = (accounts.length > 0) ? accounts[0] : null;
        template.game = null;
        template.streamerList = null;
        template.autostart = false;
        template.channelPoints = false;

        let attrObj = {};
        attrObj.attr = Object.assign(template, idler);
        var idlerObj = Object.assign(new Idler(), attrObj);
        idlers.push(idlerObj);

        if (idlerObj == null || !idlerObj.attr.autostart) return;
        idlerObj.start();
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

export function saveIdersToFile(){
    var usersFile = path.join(__dirname, '..', "userlogins", `users.json`);
    var outData = [];
    for(let i =0; i < idlers.length;i++)
    {
        outData.push(idlers[i].attr);
    }

    fs.writeFileSync(usersFile,JSON.stringify(outData));

}

main();


async function main() {

    //Populate accounts
    await populateAccounts();

    //Start the chrome browser
    await prepareBrowser();

    //Create idlers 
    await createIdlers();

    startServer();
}
