import path from 'path';
import {
    waitAsync
}
from './utils';

export class Idler {

    constructor(name, account, type, game, autostart, streamerList) {
        this.page = null;
        this.name = name;
        this.type = type;
        this.account = account;
        this.game = game;
        this.streamerList = streamerList;
        this.currentStreamer = null;
        this.startTime = 0;
        this.dropsEnabledTagID = 'c2542d6d-cd10-4532-919b-3d19f30a768b';
        this.loadCookiesStoragePath();
        this.streamerLink = null;
        this.logs = [];
        this.autostart = autostart;
        this.currentIndex = 0;
    }

    loadCookiesStoragePath() {
        this.cookies = path.join(__dirname, '..', "userlogins", this.account + '_cookies.json');
        this.storage = path.join(__dirname, '..', "userlogins", this.account + '_localStorage.json');
    }

    updateStatus(status) {
        status = new Date().toLocaleString() + ": " + status;
        console.debug(this.name + " - " + status);
        this.logs.unshift(status)
        if (this.logs.length > 100)
            this.logs.pop()
    }

    async keepAlive() {
        if (this.page == null) {
            return
        }
        this.page.bringToFront()
        const randomScreenPos = (max) => Math.floor(Math.random() * max)
        await this.page.mouse.move(randomScreenPos(1080), randomScreenPos(720))

    }

    async clickXY(x, y) {
        if (this.page == null) {
            return
        }
        await this.page.mouse.move(x, y);
        await this.emulateClickAsync();
        this.updateStatus(`🐭 Mouse click request received for ${x},${y}`);
    }

    async emulateClickAsync(selector) {
        if (this.page == null) {
            return
        }
        if (selector) {
            await this.page.click(selector, {
                delay: 50 + Math.random() * 100
            })
        } else {
            await this.page.mouse.down()
            await waitAsync(50 + Math.random() * 100)
            await this.page.mouse.up()
        }
    }

    async goToLiveStreamer() {
        if (this.page == null) {
            return
        }

        this.updateStatus('🔍 Looking for a streamer to watch');
        this.currentStreamer = null;
        this.streamerLink = null;
        this.startTime = 0;

        //We are using a search term, rather than a list
        if (!this.streamerList) {
            let streamsDirectoryUrl = `https://www.twitch.tv/directory/game/${this.game}?tl=${this.dropsEnabledTagID}`;

            if (this.type == "legacy") {
                streamsDirectoryUrl = `https://www.twitch.tv/directory/game/${this.game}`;
            }

            await this.page.goto(streamsDirectoryUrl, {
                waitUntil: 'networkidle2'
            });

            const streamHrefs = await this.page.$$eval('.tw-tower a[data-a-target="preview-card-image-link"]', links => links.map(link => link.href));

            if (!streamHrefs.length) {
                this.updateStatus('😥 No live streams found!');
                return;
            }

            this.streamerLink = streamHrefs[Math.floor(Math.random() * streamHrefs.length)];
        } else {
            //We are using a streamer link list
            let count = this.currentIndex++ % this.streamerList.length;
            this.streamerLink = this.streamerList[count];
        }

        this.currentStreamer = this.streamerLink.split('/').pop();
        this.startTime = Date.now();

        await this.page.goto(this.streamerLink);

        this.updateStatus(`✨ Started watching ${this.currentStreamer}`);
        await waitAsync(2000);

        // Sometimes it shows a click to unmute overlay. TODO: Investigate a better way to fix, maybe with cookies or localStorage
        //TODO look into this
        try {
            await this.emulateClickAsync('[data-a-target="player-overlay-click-handler"]');
        } catch (e) {
            console.log("failed to click");

        }
    }

    async isPageOnValidStreamer() {
        if (this.page == null) {
            return;
        }
        if (!this.currentStreamer)
            return false; // We're currently navigating to a streamer, so no

        const liveIndicatorElm = await this.page.$('[data-a-target="watch-mode-to-home"] .live-indicator-container');
        if (!liveIndicatorElm) {
            this.updateStatus(`⚠️ ${this.currentStreamer} is no longer live`);
            return false;
        }

        //TODO Catch eval errors
        const gameCategoryHref = await this.page.$eval('[data-a-target="stream-game-link"]', elm => elm.href);
        if (!gameCategoryHref || gameCategoryHref !== `https://www.twitch.tv/directory/game/${this.game}`) {
            this.updateStatus(`⚠️ ${this.currentStreamer} is no longer playing ${this.game}`);
            return false;
        }

        let dropsEnabled = true;

        if (this.type == "new") {
            dropsEnabled = !!await this.page.$('[data-a-target="Drops Enabled"]');

        } else if (this.type == "legacy") {
            dropsEnabled = !!await this.page.$('[data-test-selector="drops-campaign-details"] .drops-campaign-details__drops-success');

        }

        if (!dropsEnabled) {
            this.updateStatus(`⚠️ ${this.currentStreamer} is no longer having drops for ${this.game}`);
            return false
        }

        return true
    }

}
