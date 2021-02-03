// TODO eslint
/* eslint-disable no-throw-literal */

import express from 'express'
import path from 'path'
import bodyParser from 'body-parser'
import { idlers, getIdlersByName, settings, accounts, saveIdersToFile } from './index'
import { Idler } from './idler'
import fs from 'fs'

export function startServer () {
  const app = express()
  app.use(bodyParser.json())

  app.use(express.static('public'))

  app.get('/health', (req, res) => res.status(200).send('ok'))

  app.get('/settings', function (req, res) {
    var finalOut = {}
    finalOut.settings = settings
    finalOut.accounts = accounts
    finalOut.idlers = idlers

    res.set('Content-Type', 'application/json')
    res.send(JSON.stringify(finalOut, function replacer (key, value) {
      if (key === 'page') { return undefined };
      // if (key == 'logs') { return undefined; };
      if (key === 'running') { return value != null }
      return value
    }))
  })

  app.post('/saveIdler', (req, res) => {
    // Clean the data
    for (let i = 0; i < req.body.bot.streamerList.length; i++) {
      var streamer = req.body.bot.streamerList[i]
      if (streamer == null || streamer === '') {
        req.body.bot.streamerList.splice(i, 1)
      }
    }

    let idler

    if (req.body.lastname === null || req.body.lastname === '') {
      const idlerCheck = getIdlersByName(req.body.bot.name)
      if (idlerCheck != null) throw `${req.body.bot.name} Already exists`

      const data = {}
      data.attr = req.body.bot
      idler = Object.assign(new Idler(), data)
      idlers.push(idler)
    } else {
      if (req.body.lastname.toLowerCase() !== req.body.bot.name.toLowerCase()) {
        // name has changed
        const idlerCheck = getIdlersByName(req.body.bot.name)
        if (idlerCheck != null) throw `${req.body.bot.name} Already exists`
      }
      idler = getIdlersByName(req.body.lastname).value
      idler.attr = req.body.bot
    }
    saveIdersToFile()

    // If its already running or its set to auto start, then start (Which also automaticly stops it first). Otherwise just stop it
    if (idler.running || idler.attr.autostart) {
      idler.start()
    } else {
      idler.stop()
    }

    res.status(200).send()
  })

  app.post('/mouseClick', (req, res) => {
    try {
      const posX = parseInt(req.body.x)
      const posY = parseInt(req.body.y)
      const name = req.body.name
      res.status(200).send('ok')
      const idler = getIdlersByName(name).value
      idler.clickXY(posX, posY)
    } catch (e) {

    }
  })

  app.post('/kill', (req, res) => {
    res.status(200).send('ok')
    process.kill(process.pid, 'SIGINT')
  })

  app.post('/:username/delete', (req, res) => {
    try {
      const idler = getIdlersByName(req.params.username)
      if (idler.value.navigating) {
        throw 'Currently navigating. Please wait until the current page has loaded.'
      }
      idler.value.stop()
      idlers.splice(idler.key, 1)
      saveIdersToFile()
      res.status(200).send('ok')
    } catch (e) {
      res.status(500).send(e)
    }
  })

  app.post('/:username/stop', (req, res) => {
    try {
      const idler = getIdlersByName(req.params.username).value
      // if (idler.navigating) {
      //  throw 'Currently navigating. Please wait until the current page has loaded.'
      // }
      idler.stop()

      res.status(200).send('ok')
    } catch (e) {
      res.status(500).send(e)
    }
  })

  app.post('/:username/start', (req, res) => {
    try {
      const idler = getIdlersByName(req.params.username).value
      if (idler.navigating) {
        throw 'Currently navigating. Please wait until the current page has loaded.'
      }
      idler.start()
      res.status(200).send('ok')
    } catch (e) {
      res.status(500).send(e)
    }
  })

  app.post('/:username/nextstreamer', (req, res) => {
    try {
      const idler = getIdlersByName(req.params.username).value
      if (idler.navigating) {
        throw 'Currently navigating. Please wait until the current page has loaded.'
      }
      idler.goToLiveStreamer()
      res.status(200).send('ok')
    } catch (e) {
      res.status(500).send(e)
    }
  })

  app.post('/:username/refresh', (req, res) => {
    try {
      const idler = getIdlersByName(req.params.username).value
      if (idler.navigating) {
        throw 'Currently navigating. Please wait until the current page has loaded.'
      }
      idler.page.evaluate(() => {
        // eslint-disable-next-line no-undef
        location.reload()
      })
      res.status(200).send('ok')
    } catch (e) {
      res.status(500).send(e)
    }
  })

  app.get('/:username/screenshot', async function (req, res) {
    try {
      const idler = getIdlersByName(req.params.username).value
      await idler.page.screenshot({
        path: './public/status.jpg'
      })
      res.type('text')
      const data = fs.readFileSync(path.join(__dirname, '..', 'public', 'status.jpg'))
      res.send(data.toString('base64'))
    } catch (e) {
      res.status(500).send(e)
    }
  })

  let port = 5000
  try {
    if (process.argv.length > 2) {
      const argPort = parseInt(process.argv[2])
      if (isNaN(argPort)) { throw 'Port is not a number' }
      port = argPort
    }
  } catch (e) {
    console.error(`Error: could not set port to ${process.argv[2]} using default ${port}`)
  }

  app.listen(port, () => console.log(`Monitoring webserver listening at http://localhost:${port}`))
}
