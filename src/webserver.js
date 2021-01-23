import express from 'express';
import path from 'path';
import bodyParser from 'body-parser';
import {    idlers,    getIdlersByName, settings} from './index';

const app = express();
app.use(bodyParser.json());

app.use(express.static('public'));

app.get('/health', (req, res) => res.status(200).send('ok'));

app.get('/idlers', function (req, res) {
	res.set('Content-Type', 'application/json')
    res.send(JSON.stringify(idlers, function replacer(key, value) {
            if (key == 'page') {
                return undefined
            };
            return value;
        }));
});

app.get('/settings', function (req, res) {
    res.json(settings);
});


app.post('/mouseClick', (req, res) => {
    try {
        const posX = parseInt(req.body.x) || 0;
        const posY = parseInt(req.body.y) || 0;
		const name = req.body.name;
        res.status(200).send('ok');
		var idler = getIdlersByName(name);
		
        idler.clickXY(posX,posY);
       
    } catch (e) {

    }
});

app.post('/kill', (req, res) => {
    res.status(200).send('ok');
    process.kill(process.pid, 'SIGINT');
});

app.get('/logs/:username', async function (req, res) {

    try {
        var idler = getIdlersByName(req.params.username);
		res.json(idler.logs);
    } catch (e) {
        res.status(500).send();
    }
})

app.get('/screenshot/:username', async function (req, res) {

    try {
        var idler = getIdlersByName(req.params.username);
        await idler.page.screenshot({
            path: './public/status.jpg'
        })
        res.sendFile(path.join(__dirname, '..', 'public', 'status.jpg'));
    } catch (e) {
        res.status(500).send();
        console.error("Unable to take screenshot for " + req.params.username + " - " + e.message);
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
    console.error("Error: could not set port to " + process.argv[2] + " using default " + port);

}

app.listen(port, () => console.log(`Monitoring webserver listening at http://localhost:${port}`))
