localStorage.pass = localStorage.pass || '';
var ws;

var host = 'ws://mobile-to-chrome.herokuapp.com/';
// var host = 'ws://localhost/';

var registerID = function (ws) {
    ws.send(JSON.stringify({
        command: 'setID',
        id: localStorage.id
    }));
};
var tabHistory = [];
try {
    tabHistory = JSON.parse(localStorage.tabHistory);
}
catch (e) {
    console.log(e);
}

var addTab = function (tab) {
    tabHistory.push(tab);
    if (tabHistory.length > 10) {
        tabHistory = tabHistory.slice(tabHistory.length - 10, tabHistory.length);
    }
    localStorage.tabHistory = JSON.stringify(tabHistory);
};

var createWS = function (){

    ws = new WebSocket(host);
    ws.onopen = function () {
        console.log('Opened');
        registerID(ws);
    };
    ws.onmessage = function (message) {
        console.log('Received', message);
        var obj = {};
        try {
            obj = JSON.parse(message.data);
        }
        catch (e) {
            console.log(e);
        }

        if (obj.command === 'setID') {
            console.log('Received id', obj.id);
            localStorage.id = obj.id;
            registerID(ws);
        }
        if (obj.url){
            if (localStorage.pass === obj.pass) {
                chrome.tabs.create({
                    url: obj.url
                },
                function (tab) {
                    addTab(tab);
                });
                // Respond and let the server know that everything worked
                ws.send(JSON.stringify({
                    command: 'respond',
                    resp: '200'
                }));
            }
            else {
                // Respond with unauthorized message
                ws.send(JSON.stringify({
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
        }, 1000);
    };
};

createWS();