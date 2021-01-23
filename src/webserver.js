import express from 'express';
import logger from './logger';
import bodyParser from 'body-parser';
import {
    pages
}
from './index';

const app = express();
app.use(bodyParser.json());

app.use(express.static('public'));

app.get('/health', (req, res) => res.status(200).send('ok'));
app.get('/logs', (req, res) => res.status(200).json(logger.statuses));

app.post('/mouseClick', (req, res) => {
	try{
    const posX = parseInt(req.body.x) || 0;
    const posY = parseInt(req.body.y) || 0;
    res.status(200).send('ok');
    page.mouse.move(posX, posY).then(() => emulateClickAsync()).catch(() => {});
	logger.updateStatus(`🐭 Mouse click request received for ${posX},${posY}`);
	}
	catch (e){
		logger.updateStatus(`❗ Failed to send mouse click ${e.message}`);
		
	}
});

app.post('/kill', (req, res) => {
    res.status(200).send('ok');
    logger.updateStatus('Kill request received. Note that you\'ll need something like pm2 to recover the process. If using vanilla node, it will just end');
    process.kill(process.pid, 'SIGINT');
});


app.get('/', function (req, res) {
  res.redirect('/main.html?interval=' + process.env.SCREENSHOT_INTERVAL)
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
