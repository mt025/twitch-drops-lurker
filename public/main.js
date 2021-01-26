let height = 1080;
let width = 720;
let interval = 5;

let selectedIdler = "";
let selectedIdlerButton = null;
let selectedIdlerPage = null;

function createNewTab(idler) {
    var name = idler.name;

    // create the tab
    document.querySelector('#v-pills-home-tab').insertAdjacentHTML('afterend', '<a class="nav-link" data-name="' + name + '" id="v-pills-' + name + '-tab" data-bs-toggle="pill" href="#v-pills-' + name + '" role="tab" aria-controls="v-pills-' + name + '" aria-selected="true">Idler: ' + name + '</a>')

    // create the tab content
    document.querySelector('#v-pills-tabContent').insertAdjacentHTML('beforeend', '<div class="tab-pane fade" data-name="' + name + '" id="v-pills-' + name + '" role="tabpanel" aria-labelledby="v-pills-' + name + '-tab"></div>')
    var temp = document.querySelector("#idlerContent");
    var cloneNode = temp.content.cloneNode(true);
    var tabPage = document.querySelector("#v-pills-" + name);
    tabPage.appendChild(cloneNode);

    //Add tab change events
    var tabEl = document.querySelector('#v-pills-' + name + '-tab');

    tabEl.addEventListener('shown.bs.tab', function (event) {
        selectedIdler = name;
        selectedIdlerButton = tabEl;
        selectedIdlerPage = tabPage;
        clearAllTimeout();
        updateLogs();
        updateImage();
    });

    //Set image click handler
    tabPage.querySelector(".statusImage").addEventListener('click', e => {
        var rect = e.currentTarget.getBoundingClientRect();
        const offsetX = map(e.clientX - rect.left - 1, 0, e.currentTarget.width, 0, width);
        const offsetY = map(e.clientY - rect.top - 1, 0, e.currentTarget.height, 0, height);

        sendMouseClick(offsetX, offsetY, name);
    });

    //Set interval change handler
    tabPage.querySelector(".interval-spinner").addEventListener('change', updateRate);
    tabPage.querySelector(".interval-spinner").addEventListener('keyup', updateRate);

    //Set next streamer button handler
    tabPage.querySelector(".next-streamer").addEventListener('click', e => {
        goToNextStreamer(name);

    });

    //Set edit idler button handler
    tabPage.querySelector(".edit-idler").addEventListener('click', e => {
        editIdler(name);

    });

    //Set refresh button handler
    tabPage.querySelector(".refresh-logs-screenshot").addEventListener('click', e => {
        updateLogs(true);
        updateImage(true);

    });

    //Update page info
    tabPage.querySelector(".info-bot .data").textContent = name;
    tabPage.querySelector(".interval-spinner").value = interval;
}

function editIdler(name) {
    alert(name);
}

function goToNextStreamer(name) {

    fetch(name + '/nextstreamer', {
        method: 'POST'
    }).then(() => {
        updateLogs(true);
    }).catch((e) => {
        console.log(e)
    })

}

function updateRate(e) {
    interval = parseInt(e.target.value);
    clearAllTimeout();
    setTimeout(updateImage, interval * 1000);
    setTimeout(updateLogs, interval * 1000);

}

function updateLogs(single) {
    try {
        if (selectedIdlerButton && selectedIdlerButton.getAttribute("data-name")) {
            var tabname = selectedIdlerButton.getAttribute("data-name");

            fetch(tabname + '/logs').then(res => res.json()).then(res => {

                selectedIdlerPage.querySelector(".info-bot .data").textContent = res.name;
                selectedIdlerPage.querySelector(".info-account .data").textContent = res.account;
                selectedIdlerPage.querySelector(".info-game .data").textContent = decodeURIComponent(res.game);

                let streamer = selectedIdlerPage.querySelector(".info-streamer .data");
                streamer.textContent = res.currentStreamer || "...";
                streamer.setAttribute("href", res.streamerLink || "");

                selectedIdlerPage.querySelector(".info-time .data").textContent = (res.startTime == 0) ? "..." : secondsToHms((Date.now() - res.startTime) / 1000);
                selectedIdlerPage.querySelector(".info-type .data").textContent = res.type;
                selectedIdlerPage.querySelector(".holdingLogs").style.display = "none";

                let logArea = selectedIdlerPage.querySelector(".statusLog");
                let logIndex = parseInt(logArea.getAttribute("data-index"));

                for (let i = logIndex; i < res.logs.length; i++) {
                    logArea.insertAdjacentHTML('afterbegin', "<p>" + res.logs[i].status + "</p>");
                }

                if (res.logs.length > 0) {
                    logArea.setAttribute("data-index", res.logs.length);
                }
                if (!single) {
                    setTimeout(updateLogs, interval * 1000);
                }

            }).catch((e) => {
                console.log("Failed to get logs: " + e.message);
                if (!single) {
                    setTimeout(updateLogs, interval * 1000);
                }
            })
        }
    } catch (e) {
        if (!single) {
            setTimeout(updateLogs, interval * 1000);
        }
    }
}

//We do it like this so we can give the server time to process the image, rather than flooding if refresh time is set to a small number
function updateImage(single) {
    try {

        if (selectedIdlerButton && selectedIdlerButton.getAttribute("data-name")) {
            var tabname = selectedIdlerButton.getAttribute("data-name");

            fetch(tabname + '/screenshot').then(res => res.text()).then(res => {

                selectedIdlerPage.querySelector(".holdingImage").style.display = "none";
                selectedIdlerPage.querySelector(".statusImage").style.display = "inline-block";
                selectedIdlerPage.querySelector(".statusImage").setAttribute("src", 'data:image/jpg;base64,' + res);
                if (!single) {
                    setTimeout(updateImage, interval * 1000);
                }

            }).catch((e) => {
                console.log("Failed to get image: " + e.message);
                if (!single) {
                    setTimeout(updateImage, interval * 1000);
                }
            })
        }
    } catch (e) {
        console.log("Failed to get image: " + e.message);
        if (!single) {
            setTimeout(updateImage, interval * 1000);
        }
    }

}

function sendMouseClick(x, y, name) {

    fetch('mouseClick', {
        method: 'POST',
        body: JSON.stringify({
            x,
            y,
            name
        }), // data can be `string` or {object}!
        headers: {
            'Content-Type': 'application/json'
        }
    })
}

//Map one number to another
function map(x, in_min, in_max, out_min, out_max) {
    return (x - in_min) * (out_max - out_min) / (in_max - in_min) + out_min;
}

//https://stackoverflow.com/questions/37096367/how-to-convert-seconds-to-minutes-and-hours-in-javascript
function secondsToHms(d) {
    d = Number(d);
    var h = Math.floor(d / 3600);
    var m = Math.floor(d % 3600 / 60);
    var s = Math.floor(d % 3600 % 60);

    var hDisplay = h > 0 ? h + (h == 1 ? " hour, " : " hours, ") : "";
    var mDisplay = m > 0 ? m + (m == 1 ? " minute, " : " minutes, ") : "";
    var sDisplay = s + (s == 1 ? " second" : " seconds");
    return hDisplay + mDisplay + sDisplay;
}

document.getElementById('killButton').addEventListener('click', () => {
    //fetch('kill', {
    //    method: 'POST'
    //}).then(() => {
    //    setTimeout(window.location.reload, 2000)
    //}).catch(err => alert(err.message))
})

//get all idlers
fetch('idlers').then(r => r.json()).then(res => {
    res.forEach(createNewTab);

}).catch((e) => {
    console.log(e)
})

fetch('settings').then(r => r.json()).then(res => {
    height = res.VIEWPORT_HEIGHT;
    width = res.VIEWPORT_WIDTH;
}).catch((e) => {
    console.log(e)
})
