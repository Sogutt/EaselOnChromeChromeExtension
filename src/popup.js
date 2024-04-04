document.addEventListener('DOMContentLoaded', function () {

    var loginMessageText = document.getElementById('login_message');

    var takeSnapshotButton = document.getElementById('takeSnapshot');
    takeSnapshotButton.disabled = false
    takeSnapshotButton.addEventListener('click', function (t) {
        //message background script
        chrome.runtime.sendMessage({ command: "takeSnapshot", deviceData: window.devicePixelRatio }, function (response) {
            console.log(response);
        });
        window.close();
    });

    chrome.storage.sync.get('user_details', function (data) {
        console.log('user details data in popup.js: ', data)

        const { user_email } = data.user_details
        if (user_email) {
            document.getElementById("welcome_message").innerText = `Welcome, ${user_email}`;
        } else {
            document.getElementById("welcome_message").innerText = `No user found`;
            takeSnapshotButton.disabled = true
            loginMessageText.hidden = false
        }
    })

    chrome.storage.sync.get(['snapshotCount', 'planName'], function (data) {
        console.log('local storage snapshotCount: ', data)

        const { snapshotCount, planName } = data

        const atLimit = (planName === "Pro" && snapshotCount === 150) || (planName === "Starter" && snapshotCount === 15)
        if (atLimit) {
            takeSnapshotButton.disabled = true
            document.getElementById("welcome_message").innerText = `You have reach the maximum number of snapshots for your plan`;
        }
    })


    var redirectButton = document.getElementById('redirectButton');
    redirectButton.addEventListener('click', function () {
        var newPageUrl = 'https://www.easelonchrome.com/login';
        chrome.tabs.create({ url: newPageUrl });
    });
});