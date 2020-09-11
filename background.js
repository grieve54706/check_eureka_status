
console.log("Loaded.");

function createAlarms() {

    console.log("createAlarms.");

    chrome.alarms.create("checkServer", {
        delayInMinutes: 1
    });
}

function checkServer() {

    console.log("checkServer.");

    const xhr = new XMLHttpRequest();

    xhr.open("GET", "http://domain/eureka/apps", true);
    xhr.responseType = "document";
    xhr.overrideMimeType("text/xml");
    xhr.onload = function () {
        if (xhr.readyState === xhr.DONE && xhr.status === 200) {

            const xmlDoc = xhr.responseXML;
            
            const xmlStatuses = xmlDoc.getElementsByTagName("status");

            const statuses = Array.from(xmlStatuses).map(xmlStatus => xmlStatus.firstChild.nodeValue);

            const allServerIsUp = statuses.every(statue => statue === "UP");

            const statusLength = statuses.length;

            getServerCount(serverCount => {

                if (statusLength > serverCount) {
                    serverCount = statusLength;
                    setServerCount(serverCount);
                }

                let nowStatus;

                if (statusLength === serverCount && allServerIsUp) {
                    nowStatus = "UP";
                } else {
                    nowStatus = "DOWN";
                }

                console.log("Status Is " + nowStatus);

                getServerStatus(serverStatus => {

                    if (nowStatus !== serverStatus) {
                        setServerStatus(nowStatus);

                        pushNotification(nowStatus);

                        updateIcon(nowStatus);
                    }
                });
            });
        }
    };
    xhr.send();
}

function pushNotification(nowStatus) {

    console.log("pushNotification.");

    const message = "Server is " + nowStatus + " !";

    const openEurekaPage = {
        title: "Click here to open eureka page.",
    };

    chrome.notifications.create({
        type: "basic",
        iconUrl: "eureka.png",
        title: "SIT Server Status Is Changed",
        message: message,
        buttons: [openEurekaPage]
    });
}

function updateIcon(nowStatus) {
    const iconPath = nowStatus === "UP" ? "spring.png" : "error_spring.png";

    chrome.browserAction.setIcon({
        path : iconPath
    });
}

function getStorage(key, func) {
    chrome.storage.local.get([key], result => {
        func(result[key]);
    });
}

function setStorage(key, value, func) {
    const obj = {};
    obj[key] = value;
    func = func || function () {};
    chrome.storage.local.set(obj, () => {
        func();
    });
}

function setIsOn(value) {
    setStorage("isOn", value);
}

function getIsOn(func) {
    getStorage("isOn", func);
}

function setServerStatus(value, func) {
    setStorage("serverStatus", value, func);
}

function getServerStatus(func) {
    getStorage("serverStatus", func);
}

function setServerCount(value, func) {
    setStorage("serverCount", value, func);
}

function getServerCount(func) {
    getStorage("serverCount", func);
}

chrome.runtime.onInstalled.addListener(function() {

    console.log("onInstalled.");

    setIsOn(true);
    setServerStatus("");
    setServerCount(0);

    checkServer();
    createAlarms();
});

chrome.management.onEnabled.addListener(function() {

    console.log("onEnabled.");

    setIsOn(true);

    checkServer();
    createAlarms();
});

chrome.management.onDisabled.addListener(function() {

    console.log("onDisabled.");

    setIsOn(false);
});

chrome.alarms.onAlarm.addListener(function(alarm) {

    console.log("onAlarm.");

    if (alarm.name === "checkServer") {
        checkServer();

        getIsOn(isOn => {
            if (isOn) {
                createAlarms();
            }
        });
    }
});

chrome.browserAction.onClicked.addListener(function() {

    console.log("onClicked.");

    setServerStatus("", () => {
        setServerCount("", () => {
            checkServer();
        });
    });
});

chrome.notifications.onButtonClicked.addListener(function(notificationId, buttonIndex) {

    console.log("onButtonClicked: " + buttonIndex);

    if(buttonIndex === 0){
        chrome.windows.create({ "url": "http://172.24.38.11:8760/" });
    }
});
