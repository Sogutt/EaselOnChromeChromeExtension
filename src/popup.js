document.addEventListener('DOMContentLoaded', function () {




    var takeSnapshotButton = document.getElementById('takeSnapshot');
    takeSnapshotButton.addEventListener('click', function (t) {
        console.log('new t: ', t)
        //message background script
        chrome.runtime.sendMessage({ command: "takeSnapshot" }, function (response) {
            console.log(response);
            // chrome.tabs.create({ url: 'https://mondrian-app-two.vercel.app/user/atilla2' });
        });
        window.close(); // Close the popup

    });


    // chrome.cookies.getAll({}, function (cookies) {
    //     // const cookieList = document.getElementById('cookie-list');
    //     // console.log("cookieList: ", cookies)
    //     const supabaseCookies = cookies.filter(cookie => {
    //         // Check for Supabase cookies based on their name or domain
    //         return cookie.name.startsWith("sb") || cookie.domain.includes("supabase");
    //     });

    //     // console.log('supabaseCookies: ', supabaseCookies)

    // });

});