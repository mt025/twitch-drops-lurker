import path from 'path';
import { preparePage, disposePage } from './puppeteerPage';
import {
    waitAsync
}
    from './utils';

export class Idler {

    constructor(name, account, type, game, autostart, streamerList) {
        //Idler settings
        this.name = name;
        this.type = type;
        this.account = account;
        this.game = game;
        this.streamerList = streamerList;
        this.autostart = autostart;

        //Const
        this.dropsEnabledTagID = 'c2542d6d-cd10-4532-919b-3d19f30a768b';

        //Dynamic
        this.loadCookiesStoragePath();

        //vars
        this.page = null;
        this.logs = [];

        this.currentStreamer = null;
        this.startTime = 0;

        this.currentStreamerListIndex = 0;
        this.logindex = 0;
        this.navigating = false;
        this.runningID = null;
    }

    loadCookiesStoragePath() {
        this.cookies = path.join(__dirname, '..', "userlogins", `${this.account}_cookies.json`);
        this.storage = path.join(__dirname, '..', "userlogins", `${this.account}_localStorage.json`);
    }

    updateStatus(status, includedLink) {
        let date = new Date();
        status = date.getHours().toLocaleString('en-US', { minimumIntegerDigits: 2, useGrouping: false })
            + ":"
            + date.getMinutes().toLocaleString('en-US', { minimumIntegerDigits: 2, useGrouping: false })
            + ": "
            + status;

        console.debug(`${this.name} - ${status}`);
        this.logs.push({
            index: this.logindex++,
            status,
            includedLink
        });

        if (this.logs.length > 100)
            this.logs.shift()
    }

    async start() {
        try {
            //Refresh
            this.runningID = setInterval(async () => {

                if (this.currentStreamer == null)
                    return;

                // Watch for live status, and go to another streamer if needed
                if (!(await this.isPageOnValidStreamer())) {
                    await this.goToLiveStreamer();
                }

                // Reload page every hour to avoid watching X streamer status going away if the user navigates twitch
                const msElapsed = Date.now() - this.startTime;
                if (msElapsed < 1000 * 60 * 60) {
                    return;
                }
                await this.hourReload();

            }, 1000 * 60)

            //Prepare the page
            await preparePage(this);

            this.updateStatus(`✔️ Started idler`);

            //Go to streamer
            await this.goToLiveStreamer();


        } catch (e) {
            this.updateStatus(`❌ Failed to start idler`);
        }
    }

    async stop() {
        try {
            clearInterval(this.runningID);
            this.runningID = null;
            disposePage(this);
            this.updateStatus(`❌ Stopped idler`);

        } catch (e) {
            this.updateStatus(`❌ Failed to stop idler`);
        }
    }

    async keepAlive() {
        if (this.page == null) return;

        this.page.bringToFront()
        const randomScreenPos = (max) => Math.floor(Math.random() * max)
        await this.page.mouse.move(randomScreenPos(1080), randomScreenPos(720))

    }

    async clickXY(x, y) {
        if (this.page == null) return;

        await this.page.mouse.move(x, y);
        await this.emulateClickAsync();
        this.updateStatus(`🐭 Mouse click request received for ${x},${y}`);
    }

    async emulateClickAsync(selector) {
        if (this.page == null) return;

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

    async hourReload() {
        if (this.currentStreamer == null) return;
        this.updateStatus(`⚠️ ${this.currentStreamer} has been idled for more than 1 hour`, this.currentStreamer);
        await this.goToLiveStreamer();
    }

    async goToLiveStreamer() {
        if (this.page == null) return;

        this.navigating = true;
        this.currentStreamer = null;
        this.startTime = 0;
        this.updateStatus('🔍 Looking for a streamer to watch');

        let streamerLink;
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

            streamerLink = streamHrefs[Math.floor(Math.random() * streamHrefs.length)];
            this.currentStreamer = streamerLink.split('/').pop();
        } else {
            //We are using a streamer link list
            let count = this.currentStreamerListIndex++ % this.streamerList.length;
            this.currentStreamer = this.streamerList[count];
            streamerLink = `https://twitch.tv/${this.currentStreamer}`;
        }


        this.startTime = Date.now();

        await this.page.goto(streamerLink);

        this.updateStatus(`✨ Started watching ${this.currentStreamer}`, this.currentStreamer);
        await waitAsync(2000);

        // Sometimes it shows a click to unmute overlay. TODO: Investigate a better way to fix, maybe with cookies or localStorage
        //TODO look into this
        try {
            await this.emulateClickAsync('[data-a-target="player-overlay-click-handler"]');
        } catch (e) {
            console.log("failed to click");

        }
        this.navigating = false;
    }

    async isPageOnValidStreamer() {
        if (this.page == null) {
            return;
        }
        if (!this.currentStreamer)
            return false; // We're currently navigating to a streamer, so no

        const liveIndicatorElm = await this.page.$('[data-a-target="watch-mode-to-home"] .live-indicator-container');
        if (!liveIndicatorElm) {
            this.updateStatus(`⚠️ ${this.currentStreamer} is no longer live`, this.currentStreamer);
            return false;
        }

        //TODO Catch eval errors
        const gameCategoryHref = await this.page.$eval('[data-a-target="stream-game-link"]', elm => elm.href);
        if (!gameCategoryHref || gameCategoryHref !== `https://www.twitch.tv/directory/game/${this.game}`) {
            this.updateStatus(`⚠️ ${this.currentStreamer} is no longer playing ${this.game}`, this.currentStreamer);
            return false;
        }

        let dropsEnabled = true;

        if (this.type == "new") {
            dropsEnabled = !!await this.page.$('[data-a-target="Drops Enabled"]');

        } else if (this.type == "legacy") {
            dropsEnabled = !!await this.page.$('[data-test-selector="drops-campaign-details"] .drops-campaign-details__drops-success');

        }

        if (!dropsEnabled) {
            this.updateStatus(`⚠️ ${this.currentStreamer} is no longer having drops for ${this.game}`, this.currentStreamer);
            return false
        }

        return true
    }

}
