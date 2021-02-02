import path from 'path'
import { preparePage, disposePage } from './puppeteerPage'
import { waitAsync } from './utils'
import { settings } from './index'
export class Idler {
  constructor () {
    // name
    // type
    // account
    // game
    // streamerList
    // autostart
    // channelPoints
    this.attr = {}

    // vars
    this.page = null
    this.logs = []

    this.currentStreamer = null
    this.startTime = 0

    this.currentStreamerListIndex = 0
    this.logindex = 0
    this.navigating = false

    this.running = null

    // Dynamic
    this.cookies = () => path.join(__dirname, '..', 'userlogins', `${this.attr.account}_cookies.json`)
    this.storage = () => path.join(__dirname, '..', 'userlogins', `${this.attr.account}_localStorage.json`)
  }

  updateStatus (status, includedLink) {
    const date = new Date()
    const timeStamp = date.getHours().toLocaleString('en-US', { minimumIntegerDigits: 2, useGrouping: false }) +
      ':' +
      date.getMinutes().toLocaleString('en-US', { minimumIntegerDigits: 2, useGrouping: false })

    console.debug(`${timeStamp}: ${this.attr.name} - ${status}`)
    this.logs.push({
      index: ++this.logindex,
      status: timeStamp + ': ' + status,
      includedLink
    })

    if (this.logs.length > 100) { this.logs.shift() }
  }

  async start () {
    try {
      // Stop it first if its already running
      if (this.page != null) this.stop()
      this.navigating = true

      // Refresh
      this.running = setInterval(async () => {
        // Not currently watching
        if (this.currentStreamer == null || this.navigating) return

        // Watch for live status, and go to another streamer if needed
        if (!(await this.isPageOnValidStreamer())) { await this.goToLiveStreamer(); return }

        // Reload page every hour to avoid watching X streamer status going away if the user navigates twitch
        if (!((Date.now() - this.startTime) < 1000 * 60 * 60)) { await this.hourReload(); return }

        // Claim channel points
        if (this.attr.channelPoints) { await this.claimChannelPoints() }
      }, 1000 * 60)

      // Prepare the page
      await preparePage(this)

      // Go to streamer
      await this.goToLiveStreamer()

      this.updateStatus('✔️ Started idler')
    } catch (e) {
      clearInterval(this.running)
      this.running = null
      this.navigating = false
      this.currentStreamer = null
      this.startTime = 0
      disposePage(this)
      this.updateStatus(`❌ Failed to start idler ${e.message}`)
    }
  }

  async stop () {
    try {
      clearInterval(this.running)
      this.running = null
      this.navigating = false
      this.currentStreamer = null
      this.startTime = 0
      disposePage(this)
      this.updateStatus('❌ Stopped idler')
    } catch (e) {
      this.updateStatus('❌ Failed to stop idler')
    }
  }

  async claimChannelPoints () {
    if (this.page == null || this.currentStreamer == null || this.navigating) return

    const claimPoints = await this.page.$('.claimable-bonus__icon')
    if (claimPoints) {
      var idler = this
      setTimeout(function () {
        idler.page.evaluate(_ => {
          document.querySelector('.claimable-bonus__icon').click()
        })

        idler.updateStatus(`🗳️ Claimed bonus points for ${idler.currentStreamer}`, idler.currentStreamer)
      }, Math.random() * 4000)
    }
  }

  async keepAlive () {
    if (this.page == null) return

    this.page.bringToFront()
    const randomScreenPos = (max) => Math.floor(Math.random() * max)
    await this.page.mouse.move(randomScreenPos(1080), randomScreenPos(720))
  }

  async clickXY (x, y) {
    if (this.page == null) return

    await this.page.mouse.move(x, y)
    await this.emulateClickAsync()
    this.updateStatus(`🐭 Mouse click request received for ${x},${y}`)
  }

  async emulateClickAsync (selector) {
    if (this.page == null) return

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

  async hourReload () {
    if (this.currentStreamer == null || this.page == null) return
    this.updateStatus(`⚠️ ${this.currentStreamer} has been idled for more than 1 hour. Reloading page.`, this.currentStreamer)
    this.startTime = Date.now()
    await this.page.evaluate(() => {
      // eslint-disable-next-line no-undef
      location.reload()
    })
  }

  async goToLiveStreamer () {
    if (this.page == null) return

    this.navigating = true
    this.currentStreamer = null
    this.startTime = 0
    this.updateStatus('🔍 Looking for a streamer to watch')

    let streamerLink
    // We are using a search term, rather than a list
    if (this.attr.streamerList == null || this.attr.streamerList.length === 0) {
      let streamsDirectoryUrl

      // Look for all games or just 1 game
      if (this.attr.game == null || this.attr.game === '') {
        streamsDirectoryUrl = 'https://www.twitch.tv/directory/all'
      } else {
        streamsDirectoryUrl = `https://www.twitch.tv/directory/game/${this.attr.game}`
      }

      // If its new type drops only look for streams with drops tag enabled
      if (this.attr.type === 'new') {
        streamsDirectoryUrl += `?tl=${settings.DROPS_ENABLED_TAGID}`
      }

      await this.page.goto(streamsDirectoryUrl, {
        waitUntil: 'networkidle0'
      })

      // For some reason there is an issue with finding streamers, retry every second for 10 seconds until its found, then fail if non are found
      // Maybe we should be using wait for selector
      let streamHrefs
      for (let i = 0; i < 10; i++) {
        streamHrefs = await this.page.$$eval('.tw-tower a[data-a-target="preview-card-image-link"]', links => links.map(link => link.href))
        if (streamHrefs.length > 0) {
          break
        }
        await waitAsync(1000)
      }

      if (!streamHrefs.length) {
        this.updateStatus('😥 No live streams found!')
        return
      }

      streamerLink = streamHrefs[Math.floor(Math.random() * streamHrefs.length)]
      this.currentStreamer = streamerLink.split('/').pop()
    } else {
      // We are using a streamer link list
      const count = this.currentStreamerListIndex++ % this.attr.streamerList.length
      this.currentStreamer = this.attr.streamerList[count]
      streamerLink = `https://twitch.tv/${this.currentStreamer}`
    }

    this.startTime = Date.now()

    await this.page.goto(streamerLink)

    this.updateStatus(`✨ Started watching ${this.currentStreamer}`, this.currentStreamer)

    // Make sure we are on a valid streamer when the page loads
    this.page.waitForSelector('.home-header-sticky .user-avatar-animated, [data-a-target="watch-mode-to-home"]').then(() => {
      // check we are on a vaild streamer
      this.isPageOnValidStreamer().then((isValid) => {
        if (!isValid) {
          // if we are not, go to next stream, and finish
          this.goToLiveStreamer().finally(() => { this.navigating = false })
        } else {
          this.navigating = false
        }
      })
    }).catch(() => {
      this.navigating = false
    })

    // Sometimes it shows a click to unmute overlay. Investigate a better way to fix, maybe with cookies or localStorage
    // TODO look into this we should use waitForSelector
    waitAsync(2000).then(() => { this.emulateClickAsync('[data-a-target="player-overlay-click-handler"]').catch(() => { console.log('failed to click player') }) })
  }

  async isPageOnValidStreamer () {
    if (this.page == null || !this.currentStreamer) {
      return false
    }

    const liveIndicatorElm = await this.page.$('[data-a-target="watch-mode-to-home"] .live-indicator-container')
    if (!liveIndicatorElm) {
      this.updateStatus(`⚠️ ${this.currentStreamer} is no longer live`, this.currentStreamer)
      return false
    }

    // TODO Catch eval errors
    if (this.attr.game) {
      const gameCategoryHref = await this.page.$eval('[data-a-target="stream-game-link"]', elm => elm.textContent.toLowerCase().trim())
      if (!gameCategoryHref || gameCategoryHref !== this.attr.game.toLowerCase()) {
        this.updateStatus(`⚠️ ${this.currentStreamer} is no longer playing ${this.attr.game}`, this.currentStreamer)
        return false
      }
    }

    let dropsEnabled = true

    if (this.attr.type === 'new') {
      dropsEnabled = !!await this.page.$('[data-a-target="Drops Enabled"]')
    } else if (this.attr.type === 'legacy') {
      dropsEnabled = !!await this.page.$('[data-test-selector="drops-campaign-details"] .drops-campaign-details__drops-success')
    }

    if (!dropsEnabled) {
      this.updateStatus(`⚠️ ${this.currentStreamer} is no longer having drops for ${this.attr.game}`, this.currentStreamer)
      return false
    }

    return true
  }
}
