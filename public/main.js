

function createNewTab(idler) {
    var name = idler.name;

    // create the tab
    document.querySelector('#v-pills-tab').insertAdjacentHTML('beforeend', '<a class="nav-link" data-name="' + name + '" id="v-pills-' + name + '-tab" data-bs-toggle="pill" href="#v-pills-' + name + '" role="tab" aria-controls="v-pills-' + name + '" aria-selected="true">Idler: ' + name + '</a>')

    // create the tab content
    document.querySelector('#v-pills-tabContent').insertAdjacentHTML('beforeend', '<div class="tab-pane fade" data-name="' + name + '" id="v-pills-' + name + '" role="tabpanel" aria-labelledby="v-pills-' + name + '-tab"></div>')
    var temp = document.querySelector("#idlerContent");
    var cloneNode = temp.content.cloneNode(true);
    document.querySelector("#v-pills-" + name).appendChild(cloneNode);

    var tabEl = document.querySelector('#v-pills-' + name + '-tab')
        tabEl.addEventListener('shown.bs.tab', function (event) {
            updateIdler();
        })

        document.querySelector("#v-pills-" + name + " .statusImage").addEventListener('click', e => {
            var rect = e.currentTarget.getBoundingClientRect();
            const offsetX = e.clientX - rect.left;
            const offsetY = e.clientY - rect.top;
            sendMouseClick(offsetX, offsetY, name);
        })
}

function updateIdler() {
    var currentTab = document.querySelector("#mainTabs .nav-link.active");

    if (currentTab && currentTab.getAttribute("data-name")) {
        var tabname = currentTab.getAttribute("data-name");
        document.querySelector("#v-pills-" + tabname + " .statusImage").setAttribute("src", "/screenshot/" + tabname + "?" + Date.now());

        fetch('logs/' + tabname).then(r => r.json()).then(res => {
            document.querySelector("#v-pills-" + tabname + " .statusLog").innerHTML = JSON.stringify(res, null, 2);
        }).catch((e) => {
			console.log("Failed to get logs: " + e.message);
			
		})
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

document.getElementById('killButton').addEventListener('click', () => {
    fetch('kill', {
        method: 'POST'
    }).then(() => {
        setTimeout(window.location.reload, 2000)
    }).catch(err => alert(err.message))
})

//get all idlers
fetch('idlers').then(r => r.json()).then(res => {
    if (res.length === 0) {
        window.location = "firsttimesetup.html";
        return;
    }
    res.forEach(createNewTab);

}).catch((e) => {
    console.log(e)
})

fetch('settings').then(r => r.json()).then(res => {
    setInterval(updateIdler, res.SCREENSHOT_INTERVAL * 1000);

}).catch((e) => {
    console.log(e)
})
