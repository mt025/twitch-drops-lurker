import express from 'express';
import path from 'path';
import bodyParser from 'body-parser';
import { idlers, getIdlersByName, settings } from './index';
import fs from 'fs';

const app = express();
app.use(bodyParser.json());

app.use(express.static('public'));

app.get('/health', (req, res) => res.status(200).send('ok'));

app.get('/idlers', function (req, res) {
    res.set('Content-Type', 'application/json')
    res.send(JSON.stringify(idlers, function replacer(key, value) {
        if (key == 'page') {return undefined};
        if (key == 'running'){return value != null;}
        return value;
    }));
});

app.get('/settings', function (req, res) {
    res.json(settings);
});


app.post('/mouseClick', (req, res) => {
    try {
        const posX = parseInt(req.body.x);
        const posY = parseInt(req.body.y);
        const name = req.body.name;
        res.status(200).send('ok');
        let idler = getIdlersByName(name);
        idler.clickXY(posX, posY);

    } catch (e) {

    }
});

app.post('/kill', (req, res) => {
    res.status(200).send('ok');
    process.kill(process.pid, 'SIGINT');
});

app.post('/:username/stop', (req, res) => {
    try {
        let idler = getIdlersByName(req.params.username);
        if (idler.navigating) {
            throw "";
        }
        idler.stop();
        res.status(200).send('ok');

    } catch (e) {
        res.status(500).send(e);
    }
});

app.post('/:username/start', (req, res) => {
    try {
        let idler = getIdlersByName(req.params.username);
        if (idler.navigating) {
            throw "";
        }
        idler.start();
        res.status(200).send('ok');

    } catch (e) {
        res.status(500).send(e);
    }
});



app.post('/:username/nextstreamer', (req, res) => {
    try {
        let idler = getIdlersByName(req.params.username);
        if (idler.navigating) {
            throw "";
        }
        idler.goToLiveStreamer();
        res.status(200).send('ok');

    } catch (e) {
        res.status(500).send(e);
    }
});

app.get('/:username/logs', async function (req, res) {

    try {
        let idler = getIdlersByName(req.params.username);
        res.send(JSON.stringify(idler, function replacer(key, value) {
            if (key == 'page') {return undefined};
            if (key == 'running'){return value != null;}
            return value;
        }));

    } catch (e) {
        res.status(500).send(e);
    }
})

app.get('/:username/screenshot', async function (req, res) {

    try {
        let idler = getIdlersByName(req.params.username);
        await idler.page.screenshot({
            path: './public/status.jpg'
        });
        res.type('text');
        let data = fs.readFileSync(path.join(__dirname, '..', 'public', 'status.jpg'))
        res.send(data.toString('base64'));

    } catch (e) {
        res.status(500).send(e);
    }
})


let port = 5000;
try {
    if (process.argv.length > 2) {
        let argPort = parseInt(process.argv[2]);
        if (isNaN(argPort))
            throw 'Port is not a number';
        port = argPort;
    }

} catch (e) {
    console.error(`Error: could not set port to ${process.argv[2]} using default ${port}`);

}

app.listen(port, () => console.log(`Monitoring webserver listening at http://localhost:${port}`))
