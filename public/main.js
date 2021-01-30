// let height = 1080;
let width = 720;

let imageLoadFinished = true;

let logIntervalTime = 1000;
let imageIntervalTime = localStorage.getItem("imageIntervalTime") ? parseInt(localStorage.getItem("imageIntervalTime")) : 1000;

let logsInterval = setInterval(updateLogs, logIntervalTime);
let imageInterval = setInterval(updateImage, imageIntervalTime);

let selectedIdlerName = () => selectedIdlerButton().getAttribute("data-name");
let selectedIdlerButton = () => document.querySelector('#mainTabs .nav-link.active');
let selectedIdlerPage = () => document.querySelector('#mainTabs .tab-pane.active');

let stripTags = /<\/?[^>]+(>|$)/g;

function createNewTab(idler) {
    var name = idler.attr.name;

    // create the tab
    document.querySelector('#v-pills-home-tab').insertAdjacentHTML('afterend', `<a class="nav-link" data-name="${name}" id="v-pills-${name}-tab" data-bs-toggle="pill" href="#v-pills-${name}" role="tab" aria-controls="v-pills-${name}" aria-selected="true">Idler: ${name}</a>`)

    // create the tab content
    document.querySelector('#v-pills-tabContent').insertAdjacentHTML('beforeend', `<div class="tab-pane" data-name="${name}" id="v-pills-${name}" role="tabpanel" aria-labelledby="v-pills-${name}-tab"></div>`)

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
        setOrClearForm();
        idlerModal.querySelector('.modal-title').textContent = (name ? `Edit Idler - ${name}` : "Create New Idler");
        idlerModal.querySelector("#form-lastbotname").value = (name ? name : "");
        idlerModal.querySelector("#deleteButton").style.display = (name ? "" : "none");
        if (name) loadForm(name);
    })

    // idlerModal.addEventListener('hide.bs.modal', function (event) {
    //     hideAlert();
    // })
}

function setOrClearForm(idler) {
    document.querySelector("#form-lastbotname").value = idler ? idler.name : "";
    document.querySelector("#form-botname").value = idler ? idler.name : "";
    document.querySelector("#form-gamename").value = idler ? idler.game : "";
    document.querySelector("#form-type").value = idler ? idler.type : "";
    document.querySelector("#form-autostart").checked = idler ? idler.autostart : "";
    document.querySelector("#form-points").checked = idler ? idler.channelPoints : "";

    document.querySelector("#form-gamename-checkbox").checked = false;
    document.querySelector("#form-gamename").setAttribute("placeholder", document.querySelector("#form-gamename").getAttribute("data-placeholder"));
    document.querySelector("#form-gamename").removeAttribute("disabled");
    document.querySelector("#form-gamename").setAttribute("data-last-game", "");

    if (idler && (idler.game == null || idler.game == "")) {
        document.querySelector("#form-gamename-checkbox").checked = true;
        document.querySelector("#form-gamename").setAttribute("placeholder", "");
        document.querySelector("#form-gamename").setAttribute("disabled", true);
    }

    document.querySelector("#form-streamer").value = "";
    document.querySelector("#form-streamer").setAttribute("placeholder", document.querySelector("#form-streamer").getAttribute("data-placeholder"));
    document.querySelector("#form-streamer").setAttribute("data-last-streamer", "");
    document.querySelector("#form-streamer").removeAttribute("disabled");
    document.querySelector("#form-streamer-checkbox").checked = false;

    if (idler) {
        if (idler.streamerList == null || idler.streamerList.length == 0) {
            document.querySelector("#form-streamer").setAttribute("placeholder", "");
            document.querySelector("#form-streamer").setAttribute("disabled", true);
            document.querySelector("#form-streamer-checkbox").checked = true;
        }
        else {
            document.querySelector("#form-streamer").value = streamerList.join("\n");

        }
    }
}


function loadForm(name) {
    showSpinner(true);

    fetch(`${name}/logs`).then(catchError).then(res => res.json()).then(res => {
        showSpinner(false);
        setOrClearForm(res.attr)
    }).catch((e) => {
        showSpinner(false);
    })

}

function saveIdler() {
    //let botnameChk = document.querySelector("#form-gamename-checkbox");
    //let streamerChk = document.querySelector("#form-streamer-checkbox");

    let previousName = document.querySelector("#form-lastbotname");
    let botname = document.querySelector("#form-botname");
    let gamename = document.querySelector("#form-gamename");
    let type = document.querySelector("#form-type");
    let account = document.querySelector("#form-account");
    let streamer = document.querySelector("#form-streamer");
    let autostart = document.querySelector("#form-autostart");
    let points = document.querySelector("#form-points");

    var botObj = {
        "name": botname.value.trim(),
        "game": gamename.value.trim(),
        "type": type.value.toLowerCase().trim(),
        "account": account.value.trim(),
        "autostart": autostart.checked,
        "channelPoints": points.checked,
        "streamerList": streamer.value.split("\n")
    };

    var sendData = {};
    sendData.bot = botObj;
    sendData.lastname = previousName.value.trim();

    lockForm(true);


    fetch('saveBot', {
        method: 'POST',
        body: JSON.stringify(sendData), // data can be `string` or {object}!
        headers: {
            'Content-Type': 'application/json'
        }
    }).then(catchError)
        .then(res => res.text()).then((res) => {
            showAlert("Added bot - " + botObj.name, "success");
            closeModal();
        }).catch(res => {
            showAlert("Failed to save bot - " + res.replace(stripTags, " "), "danger")
            console.log(res);

        }).finally(() => {
            document.querySelector("#createEditIdler #modalSpinner").style.display = "none";
            lockForm(false);
        });


    console.log(sendData);
}

function deleteIdler() {
    let idler = document.querySelector("#form-lastbotname").value;
    let exit = confirm(`Are you sure you want to delete ${idler}?`);

    if (!exit) { return; }
    lockForm(true);
    showSpinner(true);
    fetch(`${idler}/delete`, {
        method: 'POST'
    }).then(catchError).then(() => {
        showAlert(`Deleted ${idler}`, "success");
        closeModal();
    }).catch((e) => {
        showAlert(`Failed to delete ${idler} - ${e.replace(stripTags, " ")}`, "danger")
    }).finally(() => {

        showSpinner(false);
        lockForm(false);

    });



}


function stopStartIdler(name) {
    var page = selectedIdlerPage();
    var running = page.querySelector(".start-stop-idler").getAttribute("data-running");
    if (running == undefined || running == null) { return; }
    page.querySelector(".start-stop-idler").classList.add("disabled");
    fetch(`${name}/${running === "true" ? "stop" : "start"}`, {
        method: 'POST'
    }).then(catchError).then(() => {
        page.querySelector(".start-stop-idler").classList.remove("disabled");
        showAlert(`Stopped bot - ${name}`, "success")
    }).catch((e) => {
        page.querySelector(".start-stop-idler").classList.remove("disabled");
        showAlert(`Failed to stop bot ${name} - ${e.replace(stripTags, " ")}`, "danger")
    });

}

function goToNextStreamer(name) {

    fetch(`${name}/nextstreamer`, {
        method: 'POST'
    }).then(catchError).catch((e) => {
        showAlert("Failed to go to next streamer - " + e.replace(stripTags, " "), "danger")
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

    fetch(`${name}/logs`).then(catchError).then(res => res.json()).then(res => {
        var page = selectedIdlerPage();
        page.querySelector(".info-bot .data").textContent = res.attr.name;
        page.querySelector(".info-account .data").textContent = res.attr.account;
        page.querySelector(".info-game .data").textContent = res.attr.game ? decodeURIComponent(res.attr.game) : "Any";

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
        page.querySelector(".info-type .data").textContent = res.attr.type;
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
        fetch(`${name}/screenshot`).then(catchError).then(res => res.text()).then(res => {

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

function prepareCreateEditModal(accounts) {

    document.getElementById('deleteButton').addEventListener('click', deleteIdler);

    var modal = document.querySelector("#createEditIdler");

    accounts.forEach(function (e) {
        modal.querySelector("#form-account").insertAdjacentHTML('beforeend', `<option>${e}</option>`);
    });

    modal.querySelector("#form-gamename-checkbox").addEventListener('change', function (e) {
        if (modal.querySelector("#form-gamename-checkbox").checked) {
            modal.querySelector("#form-gamename").setAttribute("data-last-game", modal.querySelector("#form-gamename").value);
            modal.querySelector("#form-gamename").value = "";
            modal.querySelector("#form-gamename").setAttribute("placeholder", "");
            modal.querySelector("#form-gamename").setAttribute("disabled", "true");

        }
        else {
            modal.querySelector("#form-gamename").value = modal.querySelector("#form-gamename").getAttribute("data-last-game");
            modal.querySelector("#form-gamename").setAttribute("data-last-game", "");
            modal.querySelector("#form-gamename").setAttribute("placeholder", modal.querySelector("#form-gamename").getAttribute("data-placeholder"));
            modal.querySelector("#form-gamename").removeAttribute("disabled");
        }

    });

    modal.querySelector("#form-streamer-checkbox").addEventListener('change', function (e) {
        if (modal.querySelector("#form-streamer-checkbox").checked) {
            modal.querySelector("#form-streamer").setAttribute("data-last-streamer", modal.querySelector("#form-streamer").value);
            modal.querySelector("#form-streamer").value = "";
            modal.querySelector("#form-streamer").setAttribute("placeholder", "");
            modal.querySelector("#form-streamer").setAttribute("disabled", "true");
        }
        else {
            modal.querySelector("#form-streamer").value = modal.querySelector("#form-streamer").getAttribute("data-last-streamer");
            modal.querySelector("#form-streamer").setAttribute("data-last-streamer", "");
            modal.querySelector("#form-streamer").setAttribute("placeholder", modal.querySelector("#form-streamer").getAttribute("data-placeholder"));
            modal.querySelector("#form-streamer").removeAttribute("disabled");
        }

    });

    modal.querySelector("#saveButton").addEventListener('click', saveIdler);


}


//Start

document.getElementById('killButton').addEventListener('click', () => {

    var exit = confirm("Are you sure you want to stop the twitch-drops-lurker process?");

    if (!exit) { return; }

    fetch('kill', {
        method: 'POST'
    }).then(catchError).then(() => {
        setTimeout(window.location.reload, 2000)
    }).catch(err => alert(err.message))

})

//Update settings and populate idlers
fetch('settings').then(catchError).then(r => r.json()).then(res => {
    height = res.settings.VIEWPORT_HEIGHT;
    width = res.settings.VIEWPORT_WIDTH;
    res.idlers.forEach(createNewTab);
    prepareCreateEditModal(res.accounts)

}).catch((e) => {
    showAlert("Failed to get global settings - " + e.replace(stripTags, " "), "danger")
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

async function catchError(response) {
    if (response.status >= 200 && response.status <= 299) {
        return response;
    } else {
        let data = await response.text();
        throw response.statusText + " - " + data;
    }
}


let alertTimeout = null;
function showAlert(data, type) {
    if (alertTimeout) { clearTimeout(alertTimeout); }

    document.querySelector(".alert").classList.forEach(function (e) {
        if (e.indexOf("dismissible") == -1 && e.indexOf("alert-") != -1) {
            document.querySelector(".alert").classList.remove(e);
        }

    });
    document.querySelector(".alert-body").textContent = data;
    document.querySelector(".alert").classList.add(`alert-${type}`);
    document.querySelector(".alert").classList.add("show");
    alertTimeout = setTimeout(hideAlert, 5000);


}

function hideAlert() {
    document.querySelector(".alert").classList.remove("show");

}

function showSpinner(show) {
    document.querySelector("#createEditIdler form").style.display = (show ? "none" : "");
    document.querySelector("#createEditIdler #modalSpinner").style.display = (show ? "" : "none");

}

function lockForm(lock) {
    document.querySelectorAll(
        "#createEditIdler form input," +
        "#createEditIdler form textarea," +
        "#createEditIdler form select" +
        "#deleteButton",
        "#saveButton"
    ).forEach(function (e) {
        if (lock) {
            e.setAttribute("disabled","true");
        }
        else {
            e.removeAttribute("disabled");
        }
    });

}

function closeModal(){
    var modal = bootstrap.Modal.getInstance(document.getElementById('createEditIdler'));
    modal.hide();
}