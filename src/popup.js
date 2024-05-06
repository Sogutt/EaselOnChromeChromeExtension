document.addEventListener('DOMContentLoaded', function () {


    const takeSnapshotButton = document.getElementById('take-snapshot');
    const loginMessageText = document.getElementById('login-message');
    const devModeInfo = document.getElementById('dev-mode');
    const redirectButton = document.getElementById('redirect-button');
    const welcomeMessage = document.getElementById("welcome-message")

    // console.log('takeSnapshotButton: ', takeSnapshotButton)

    takeSnapshotButton.disabled = false

    takeSnapshotButton.addEventListener('click', function (t) {
        console.log('capture snapshot clicked: ', t)
        chrome.runtime.sendMessage({ command: "takeSnapshot", deviceData: window.devicePixelRatio }, function (response) {
            console.log(response);
        });
        window.close();
    });

    chrome.storage.sync.get('user_details', function (data) {
        console.log('user details data: ', data)
        const user_email = data?.user_details?.user_email ?? null
        // const { user_email } = data?.user_details
        if (user_email) {
            welcomeMessage.innerText = `Welcome, ${user_email}`;
        } else {
            welcomeMessage.innerText = `No user data found`;
            takeSnapshotButton.disabled = true
            loginMessageText.hidden = false
        }
    })

    chrome.storage.sync.get(['snapshotCount', 'planName'], function (data) {
        console.log('snapshotCount data: ', data)
        if (!data) return;
        const { snapshotCount, planName } = data

        const atLimit = (planName === "Pro" && snapshotCount === 150) || (planName === "Starter" && snapshotCount === 15)
        if (atLimit) {
            takeSnapshotButton.disabled = true
            welcomeMessage.innerText = `You have reach the maximum number of snapshots for your plan`;
        }
    })

    redirectButton.addEventListener('click', function () {
        var newPageUrl = 'https://www.easelonchrome.com/login';
        chrome.tabs.create({ url: newPageUrl });
    });


    let IS_LOCAL = true
    // let IS_LOCAL = false
    chrome.storage.sync.set({ _EAC_LOCAL_MODE: IS_LOCAL }, function () {
        if (IS_LOCAL) {
            devModeInfo.innerText = `LOCAL MODE`
        }
    });
});