(function () {
    var background = chrome.extension.getBackgroundPage();

    var clearHistory = document.getElementById('clearHistory');

    var uid = document.getElementById('uid');
    uid.value = localStorage.id || 'Loading..';

    var pass = document.getElementById('pass');
    if (localStorage.pass) {
        pass.value = localStorage.pass;
    }

    var save = document.getElementById('save');

    var history = document.getElementById('history');
    clearHistory.addEventListener('click', function () {
        background.clearHistory();
        while(history.lastChild && history.lastChild.id !== 'nohistory') {
            history.removeChild(history.lastChild);
        }
        document.getElementById('nohistory').style.display = 'block';
    }, false);

    pass.addEventListener('input', function (e) {
        console.log('Change');
        if (pass.value === localStorage.pass) {
            save.disabled = true;
        }
        else {
            save.disabled = false;
        }
    }, false);

    var form = document.getElementById('form');
    form.addEventListener('submit', function (e) {
        e.preventDefault();
        localStorage.pass = pass.value;
        save.disabled = true;
        background.registerID();
    }, false);

    window.addEntry = function (favico, title, url, timeString) {
        var entry = document.createElement('div');
        entry.className = 'entry';

        var img = document.createElement('img');
        img.src = favico ? favico : 'favicon.png';
        img.width = '16';
        img.className = 'favico';

        var titleElem = document.createElement('span');
        titleElem.className = 'urlTitle';
        titleElem.textContent = title || 'Untitled';

        var urlElem = document.createElement('span');
        urlElem.className = 'url';
        urlElem.textContent = url;

        var timeElem = document.createElement('span');
        timeElem.className = 'time';
        timeElem.textContent = timeString;

        entry.addEventListener('click', function (e) {
            chrome.tabs.create({
                url: url
            });
        }, false);

        entry.appendChild(img);
        entry.appendChild(titleElem);
        entry.appendChild(urlElem);
        entry.appendChild(timeElem);

        history.appendChild(entry);
    };

    if (localStorage.tabHistory.length > 2) {
        var tabHistory = JSON.parse(localStorage.tabHistory);
        tabHistory.reverse().forEach(function (tab) {
            addEntry(tab.favIconUrl, tab.title, tab.url, tab.timeString);
        });
    }
    else {
        document.getElementById('nohistory').style.display = 'block';
    }
})();