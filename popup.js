(function () {
    var uid = document.getElementById('uid');
    uid.textContent = localStorage.id;

    var pass = document.getElementById('pass');
    if (localStorage.pass) {
        pass.value = localStorage.pass;
    }

    var save = document.getElementById('save');

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
    }, false);
})();