export class UserPage {
    constructor(name, type) {
        this.page = null;
        this.name = name;
        this.cookies = null;
        this.storage = null;
        this.type = type;
    }

    async emulateClickAsync(selector) {
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

    async goToRandomLiveStreamer() {
        logger.updateStatus('🔍 Looking for a streamer to watch');

        activeStreamerName = null;
        const streamsDirectoryUrl = `https://www.twitch.tv/directory/game/${game}?tl=${dropsEnabledTagID}`;
        await page.goto(streamsDirectoryUrl, {
            waitUntil: 'networkidle2'
        });

        const streamHrefs = await page.$$eval('.tw-tower a[data-a-target="preview-card-image-link"]', links => links.map(link => link.href));

        if (!streamHrefs.length) {
            logger.updateStatus('😥 No live streams found!');
            return;
        }

        const streamerLink = streamHrefs[Math.floor(Math.random() * streamHrefs.length)];
        activeStreamerName = streamerLink.split('/').pop();
        activeStreamerTimestamp = Date.now();
        logger.updateStatus(`✨ Started watching ${activeStreamerName}`);

        await page.goto(streamerLink);

        await waitAsync(2000);

        // Sometimes it shows a click to unmute overlay. TODO: Investigate a better way to fix, maybe with cookies or localStorage
        try {
            await emulateClickAsync('[data-a-target="player-overlay-click-handler"]');
        } catch (e) {
            console.log("failed to click");

        }
    }

   async isPageOnValidStreamer() {
        if (!activeStreamerName)
            return false // We're currently navigating to a streamer, so no

            const liveIndicatorElm = await page.$('.channel-info-content .live-indicator-container')
                if (!liveIndicatorElm) {
                    logger.updateStatus(`⚠️ ${activeStreamerName} is no longer live`)
                    return false
                }

                //TODO Catch eval errors
                const gameCategoryHref = await page.$eval('[data-a-target="stream-game-link"]', elm => elm.href)
                if (!gameCategoryHref || gameCategoryHref !== `https://www.twitch.tv/directory/game/${game}`) {
                    logger.updateStatus(`⚠️ ${activeStreamerName} is no longer playing ${game}`)
                    return false
                }

                const dropsActivatedCategory = await page.$('[data-a-target="Drops Enabled"]')
                if (!dropsActivatedCategory) {
                    logger.updateStatus(`⚠️ ${activeStreamerName} is no longer having drops for ${game}`)
                    return false
                }
                return true
    }

}
