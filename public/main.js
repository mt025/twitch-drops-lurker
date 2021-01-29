let height = 1080;
let width = 720;

let imageLoadFinished = true;

let logIntervalTime = 1000;
let imageIntervalTime = localStorage.getItem("imageIntervalTime") ? parseInt(localStorage.getItem("imageIntervalTime")) : 5000;

let logsInterval = setInterval(updateLogs, logIntervalTime);
let imageInterval = setInterval(updateImage, imageIntervalTime);

let selectedIdlerName = () => selectedIdlerButton().getAttribute("data-name");
let selectedIdlerButton = () => document.querySelector('#mainTabs .nav-link.active');
let selectedIdlerPage = () => document.querySelector('#mainTabs .tab-pane.active');

function createNewTab(idler) {
    var name = idler.name;

    // create the tab
    document.querySelector('#v-pills-home-tab').insertAdjacentHTML('afterend', `<a class="nav-link" data-name="${name}" id="v-pills-${name}-tab" data-bs-toggle="pill" href="#v-pills-${name}" role="tab" aria-controls="v-pills-${name}" aria-selected="true">Idler: ${name}</a>`)

    // create the tab content
    document.querySelector('#v-pills-tabContent').insertAdjacentHTML('beforeend', `<div class="tab-pane fade" data-name="${name}" id="v-pills-${name}" role="tabpanel" aria-labelledby="v-pills-${name}-tab"></div>`)

    var temp = document.querySelector("#idlerContent");
    var cloneNode = temp.content.cloneNode(true);

    var tabPage = document.querySelector(`#v-pills-${name}`);
    var tabButton = document.querySelector(`#v-pills-${name}-tab`);

    tabPage.appendChild(cloneNode);

    //Set change tab event
    tabButton.addEventListener('shown.bs.tab', () => {
        updateImage();
        updateLogs();

    });

    //Set image click handler
    tabPage.querySelector(".statusImage").addEventListener('click', (e) => {
        var rect = e.currentTarget.getBoundingClientRect();
        const offsetX = map(e.clientX - rect.left - 1, 0, e.currentTarget.width, 0, width);
        const offsetY = map(e.clientY - rect.top - 1, 0, e.currentTarget.height, 0, height);

        sendMouseClick(offsetX, offsetY, name);
    });

    //Set interval change handler
    tabPage.querySelector(".interval-spinner").addEventListener('change', updateRate);
    tabPage.querySelector(".interval-spinner").addEventListener('keyup', updateRate);

    //Set next streamer button handler
    tabPage.querySelector(".next-streamer").addEventListener('click', () => {
        goToNextStreamer(name);

    });

    //Set edit idler button handler

    tabPage.querySelector(".edit-idler").setAttribute("data-bs-edit", name);

    tabPage.querySelector(".start-stop-idler").addEventListener('click', () => {
        stopStartIdler(name);
    });

    //Set refresh button handler
    tabPage.querySelector(".refresh-logs-screenshot").addEventListener('click', () => {
        updateLogs();
        updateImage();

    });

    //Update page info
    tabPage.querySelector(".info-bot .data").textContent = name;
    tabPage.querySelector(".interval-spinner").value = 60 / (imageIntervalTime * 0.001);

    var idlerModal = document.getElementById('createEditIdler')



    idlerModal.addEventListener('show.bs.modal', function (event) {
        var button = event.relatedTarget
        var name = button.getAttribute('data-bs-edit');
        
        idlerModal.querySelector('.modal-title').textContent = (name ? `Edit Idler - ${name}` : "Create New Idler");

    
    })



}

function saveIdler(){
    alert("Save");

}


function stopStartIdler(name) {
    var page = selectedIdlerPage();
    var running = page.querySelector(".start-stop-idler").getAttribute("data-running");
    if (running == undefined || running == null) { return; }
    page.querySelector(".start-stop-idler").classList.add("disabled");
    fetch(`${name}/${running === "true" ? "stop" : "start"}`, {
        method: 'POST'
    }).then(() => {
        page.querySelector(".start-stop-idler").classList.remove("disabled");
    }).catch((e) => {
        page.querySelector(".start-stop-idler").classList.remove("disabled");
        console.log(e)
    });

}

function goToNextStreamer(name) {

    fetch(`${name}/nextstreamer`, {
        method: 'POST'
    }).catch((e) => {
        console.log(e)
    })

}

function updateRate(e) {
    imageIntervalTime = (60 / parseInt(e.target.value)) * 1000;
    clearInterval(imageInterval);
    imageInterval = setInterval(updateImage, imageIntervalTime);
    localStorage.setItem("imageIntervalTime", imageIntervalTime);
}

async function updateLogs() {
    var name = selectedIdlerName();

    if (!name) {
        return;
    }

    fetch(`${name}/logs`).then(res => res.json()).then(res => {
        var page = selectedIdlerPage();
        page.querySelector(".info-bot .data").textContent = res.name;
        page.querySelector(".info-account .data").textContent = res.account;
        page.querySelector(".info-game .data").textContent = res.game ? decodeURIComponent(res.game) : "Any";

        page.querySelector(".info-status").classList.forEach(function (e) {
            if (e.toLowerCase().indexOf("bg-") != -1) {
                page.querySelector(".info-status").classList.remove(e);
            }

        });

        if (res.navigating) {
            page.querySelector(".info-status .data").textContent = "Navigating";
            page.querySelector(".info-status").classList.add("bg-warning");
            page.querySelector(".info-status").setAttribute("data-status", "navigating");
            page.querySelector(".holdingImage").style.display = "none";
            page.querySelector(".statusImage").style.display = "inline-block";
        }
        else if (res.running) {
            page.querySelector(".info-status .data").textContent = "Running";
            page.querySelector(".info-status").classList.add("bg-success");
            page.querySelector(".info-status").classList.add("bg-success");
            page.querySelector(".info-status").setAttribute("data-status", "running");
            page.querySelector(".holdingImage").style.display = "none";
            page.querySelector(".statusImage").style.display = "inline-block";
        }
        else {
            page.querySelector(".info-status .data").textContent = "Stopped";
            page.querySelector(".info-status").classList.add("bg-danger");
            page.querySelector(".info-status").setAttribute("data-status", "stopped");
            page.querySelector(".holdingImage").style.display = "inline-block";
            page.querySelector(".statusImage").style.display = "none";
        }

        let streamer = page.querySelector(".info-streamer .data");
        streamer.textContent = res.currentStreamer || "...";
        streamer.setAttribute("href", res.streamerLink || "");

        page.querySelector(".info-time .data").textContent = (res.startTime == 0) ? "..." : secondsToHms((Date.now() - res.startTime) / 1000);
        page.querySelector(".info-type .data").textContent = res.type;
        page.querySelector(".holdingLogs").style.display = "none";

        let logArea = page.querySelector(".statusLog");
        let logIndex = parseInt(logArea.getAttribute("data-index"));

        for (let i = logIndex; i < res.logs.length; i++) {
            var item = res.logs[i];
            var output = item.status;

            if (item.includedLink) {
                output = output.replace(item.includedLink, `<a href='https://twitch.tv/${item.includedLink}' target='_blank'>${item.includedLink}</a>`);
            }

            logArea.insertAdjacentHTML('afterbegin', `<p>${output} </p>`);
        }

        if (res.logs.length > 0) {
            logArea.setAttribute("data-index", res.logs.length);
        }


        page.querySelector(".start-stop-idler").setAttribute("data-running", res.running.toString());
        page.querySelector(".start-stop-idler").classList.remove("btn-warning");
        page.querySelector(".start-stop-idler").classList.remove("btn-danger");
        page.querySelector(".start-stop-idler").classList.remove("btn-success");
        page.querySelector(".start-stop-idler").classList.add(res.running ? "btn-danger" : "btn-success");
        page.querySelector(".start-stop-idler").textContent = res.running ? "Stop Idler" : "Start Idler";


    }).catch((e) => {
        console.log(`Failed to get logs: ${e.message}`);
    });
}

async function updateImage() {

    var name = selectedIdlerName();
    if (!name) {
        return;
    }
    var status = selectedIdlerPage().querySelector(".info-status").getAttribute("data-status");

    if (status == "stopped" || status == undefined || status == null) return;

    //Make sure the last image has loaded so we don't flood the server
    if (imageLoadFinished) {
        imageLoadFinished = false;
        fetch(`${name}/screenshot`).then(res => res.text()).then(res => {

            var page = selectedIdlerPage();
            page.querySelector(".holdingImage").style.display = "none";
            page.querySelector(".statusImage").style.display = "inline-block";
            page.querySelector(".statusImage").setAttribute("src", `data:image/jpg;base64,${res}`);
            imageLoadFinished = true;
        }).catch((e) => {
            imageLoadFinished = true;
            console.log(`Failed to get image: ${e.message}`);
        });
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

function prepareCreateEditModal(accounts){
    var model = document.querySelector("#createEditIdler");

    accounts.forEach(function(e){
        model.querySelector("#form-account").insertAdjacentHTML('beforeend',`<option>${e}</option>`);
    });
    
    model.querySelector("#form-gamename-checkbox").addEventListener('change',function(e){
        if(model.querySelector("#form-gamename-checkbox").checked){
            model.querySelector("#form-gamename").value = "";
            model.querySelector("#form-gamename").setAttribute("placeholder","");
            model.querySelector("#form-gamename").setAttribute("disabled","true");
        }
        else{
            model.querySelector("#form-gamename").setAttribute("placeholder",model.querySelector("#form-gamename").getAttribute("data-placeholder"));
            model.querySelector("#form-gamename").removeAttribute("disabled");
        }
        
    });

    model.querySelector("#saveButton").addEventListener('click',saveIdler);


}


//Start

document.getElementById('killButton').addEventListener('click', () => {

    var exit = confirm("Are you sure you want to stop the twitch-drops-lurker process?");

    if (!exit) { return; }

    fetch('kill', {
        method: 'POST'
    }).then(() => {
        setTimeout(window.location.reload, 2000)
    }).catch(err => alert(err.message))

})

//Update settings and populate idlers
fetch('settings').then(r => r.json()).then(res => {
    height = res.settings.VIEWPORT_HEIGHT;
    width = res.settings.VIEWPORT_WIDTH;
    res.idlers.forEach(createNewTab);
    prepareCreateEditModal(res.accounts)

}).catch((e) => {
    console.log(e)
})

//Libary functions
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
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
