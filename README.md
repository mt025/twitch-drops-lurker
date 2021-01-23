# twitch-drops-lurker

## Installation

1. Clone the repository to your device with `git clone https://github.com/mt025/twitch-drops-lurker.git`
2. Install npm depencencies. First go to the downloaded folder `cd twitch-drops-lurker`, then run `npm install`
3. Edit the index.js to specifiy idlers and chrome path
4. Create a `accountname_localStorage.json` file in userlogins. For the content, run `copy(Object.entries(localStorage))` in the console when having twitch.tv open. This will fill your clipboard and you can paste it directly into `localStorage.json`
5. Create a `accountname_cookies.json` file userlogins. Some of the cookies are not accesible from javascript, so you'll need to export them using the extension EditThisCookie
6. Start the node process. You could run `node index.js`, but please check the Deploying section below

## Node options
`node index.js` for default operations
`node index.js 5005` to select a port
`node index.js 5005 false` to run in headded mode

## Deploying
We recommend using a tool like `pm2` to manage your node process. It will automatically launch on boot, recover from errors, and save logs and crashes to disk.