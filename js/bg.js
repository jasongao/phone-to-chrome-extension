localStorage.pass = localStorage.pass || '';
var ws;

var EXTENSION_VERSION = '0.1.8';
var matchVersion = false; // Whether the host and the extension's versions match

var host = 'ws://mobile-to-chrome.herokuapp.com/';
// var host = 'ws://192.168.1.2/';

// So here's the situation.
// On laptops which you can just put to sleep, the extension obviously loses connection when the laptop goes to sleep,
// but the WebSocket's onclose event never fires, so it never reconnects on its own.
// To fix this, there's polling code that checks when the last time it polled was. If it's a lot longer, we've probably lost
// connection, and we need to reconnect. 
// That's what "lastTested" is about.
var lastTested = Date.now();
var TEST_DURATION = 5000; // Tests every 5s

var wsSend = function (message) {
    if (ws.readyState === ws.OPEN) {
        ws.send(message);
    }
    else {
        console.log('WS not open', message);
    }
};

var testStatus = function () {
    if (Date.now() - lastTested > 2 * TEST_DURATION) {
        console.log('Lost connection');
        createWS();
    }
    lastTested = Date.now();
    setTimeout(testStatus, TEST_DURATION);
};

var registerID = function () {
    wsSend(JSON.stringify({
        command: 'setID',
        id: localStorage.id,
        pass: localStorage.pass,
        EXTENSION_VERSION: EXTENSION_VERSION
    }));
    console.log('Registered ID');
};
var tabHistory = []; // Holds the actual tabs after they're loaded
var tabIDs = []; // Holds IDs of tabs that are created. Checked against when they load

try {
    tabHistory = JSON.parse(localStorage.tabHistory);
}
catch (e) {
    console.log(e);
}

var clearHistory = function () {
    localStorage.tabHistory = '[]';
    tabHistory = [];
};

var addTab = function (tab) {
    tab.timeString = moment().format('DD/MM/YYYY');
    tabHistory.push(tab);
    console.log(tab.status, tab.favIconUrl);
    if (tabHistory.length > 10) {
        tabHistory = tabHistory.slice(tabHistory.length - 10, tabHistory.length);
    }
    localStorage.tabHistory = JSON.stringify(tabHistory);
};

chrome.tabs.onUpdated.addListener(function (id, changeInfo, tab) {
    var index = tabIDs.indexOf(id);
    if (changeInfo.status === 'complete' && index !== -1) {
        addTab(tab);
        tabIDs.splice(index, 1);
    }
});


var createWS = function (){

    ws = new WebSocket(host);
    ws.onopen = function () {
        console.log('Opened');
        registerID();
    };
    ws.onmessage = function (message) {
        console.log('Received', message);
        var obj = {};
        var url;
        try {
            obj = JSON.parse(message.data);
        }
        catch (e) {
            console.log(e);
        }

        if (obj.command === 'setID') {
            console.log('Received id', obj.id);
            localStorage.id = obj.id;
            registerID();
        }
        if (obj.url){
            if (localStorage.pass === obj.pass) {
                url = obj.url;
                var protocol = url.match(/\w+\:\/*.*/);
                var textLink = url.match(/[a-zA-Z0-9\.\-]+\.[a-zA-Z]{2,3}/);
                // If the protocol wasn't found, or if it was found as part of the text, instead of being the entire text
                if (!protocol || protocol[0] !== url) {
                    if (textLink && textLink[0] === url) {
                        url = 'http://' + url;
                    }
                    else {
                        url = 'http://google.com/#q=' + url;
                    }
                }
                chrome.tabs.create({
                    url: url
                },
                function (tab) {
                    tabIDs.push(tab.id);
                    if (tabIDs.length > 10) {
                        tabIDs = tabIDs.slice(tabIDs.length - 10, tabIDs.length);
                    }
                });
                // Respond and let the server know that everything worked
                wsSend(JSON.stringify({
                    command: 'respond',
                    resp: '200'
                }));
            }
            else {
                // Respond with unauthorized message
                wsSend(JSON.stringify({
                    command: 'respond',
                    resp: '503'
                }));
            }
        }
    };
    ws.onclose = function (){
        console.log('Closed. Retrying...');
        setTimeout(function (){
            createWS();
        }, 5000);
    };
};

createWS();
testStatus();