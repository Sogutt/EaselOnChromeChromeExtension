//LESSON: if the popup is closed, then it cannot recieve a message. Hence the handshake method where you first pass a handshake message to background
//and then listen for a message. https://stackoverflow.com/questions/12265403/passing-message-from-background-js-to-popup-js
//however, popup.js does have access to local storage so you can pass data in between background and popup that way

document.addEventListener('DOMContentLoaded', function () {
    // console.log('window.devicePixelRatio: ', window.devicePixelRatio)
    
    var takeSnapshotButton = document.getElementById('takeSnapshot');
    takeSnapshotButton.addEventListener('click', function (t) {
        console.log('new t: ', t)
        //message background script
        chrome.runtime.sendMessage({ command: "takeSnapshot", deviceData: window.devicePixelRatio }, function (response) {
            console.log(response);
            // chrome.tabs.create({ url: 'https://mondrian-app-two.vercel.app/user/atilla2' });
        });
        window.close(); // Close the popup
    });

    // chrome.cookies.getAll({}, function (cookies) {
    //     const supabaseCookies = cookies.filter(cookie => {
    //         return cookie.name.startsWith("sb") || cookie.domain.includes("supabase");
    //     });
    // });

    chrome.storage.sync.get('user_details', function (data) {
        console.log('user details data in popup.js: ', data)

        const { user_email } = data.user_details
        if (user_email) {
            document.getElementById("welcome_message").innerText = `Welcome, ${user_email}`;
        } else {
            document.getElementById("welcome_message").innerText = `No user found`;
        }
    })
});


