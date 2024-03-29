// import qq from './supabase_client';


console.log('running new background.js')


async function getUserIdFromStorage() {
    return new Promise((resolve, reject) => {
        // Retrieving user ID
        chrome.storage.sync.get('user_details', function (data) {
            if (chrome.runtime.lastError) {
                reject(chrome.runtime.lastError);
            } else {
                resolve(data.user_details);
            }
        });
    });
}





async function saveSnapshot(payload) {
    const { snapshotBase64, url, coordinates, pixelRatio } = payload
    // console.log('saving snapshot: ', snapshotBase64)
    const user_details = await getUserIdFromStorage();
    console.log('user_details: ', user_details)

    const { user_id, user_email } = user_details;

    // console.log('user deets: ', user_id, user_email)

    // var formData = new FormData();
    // formData.append('snapshotBase64', snapshotBase64);
    // formData.append('url', 'test5.com');
    // formData.append('user_id', user_id);

    console.log('pixelRatio: ', pixelRatio)
    //upload to S3 here or make call to server to upload form webapp
    //switch
    // const URI = "http://localhost:3000/api/handle-brand-new-snapshot"
    const URI = "https://www.easelonchrome.com/api/handle-brand-new-snapshot"



    const response = await fetch(URI, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            snapshotBase64: snapshotBase64,
            url,
            user_id,
            coordinates,
            pixelRatio
        }),
    })

    // const response = await fetch(uri, {
    //     method: "POST",
    //     headers: {},
    //     body: formData
    // })


    if (!response.ok) {
        console.log("ERROR handle-new-snapshot: ", await response.text())
        return;
    }

    const { success, newSnapshotName } = await response.json();
    console.log('handle new snapshot: ', success, newSnapshotName)


    // const payload = {
    //     incremenetedSnapshotName: 'portal-${portal_id}_snapshot-1',
    //     incrementedSnapshotVersion: 1,
    //     portal_id: 'NEW',
    //     s3_image_id: 'newSnapshotS3Id',
    //     dashboard_name: 'Crypto'
    // }
    // const { data, error } = await supabase
    //     .from("latest-snapshots")
    //     .insert(payload)



    // let user_id = ""
    // chrome.storage.sync.get('user_id', async function (data) {
    //     if (data.user_id) {
    //         console.log('Retrieved user ID:', data.user_id);
    //         user_id = data.user_id
    //         // const { data, error } = await supabase
    //         //     .from("test")
    //         //     .insert({ name: 'hi this is a test from chrome extension' })
    //         const { data, error } = await supabase
    //             .from("latest-snapshots")
    //             .insert({ name: 'hi this is a test from chrome extension' })

    //         // Use the retrieved user ID as needed
    //     } else {
    //         console.log('User ID not found in storage');
    //     }
    // });
    console.log('user_id in save snapshot: ', user_id)




    // if (error) {
    //     console.log('ERROR in INSERT: ', error)
    //     return "not saved"
    // } else {
    //     console.log('SUCCESS in INSERT: ', data)
    // }
    // return "saved"
}

async function getCurrentTab() {
    let queryOptions = { active: true, lastFocusedWindow: true };
    // `tab` will either be a `tabs.Tab` instance or `undefined`.
    let [tab] = await chrome.tabs.query(queryOptions);
    return tab;
}


chrome.runtime.onMessage.addListener((async function (event, t, sendResponse) {
    //e: event, t: target, r: response (callback)

    const { command } = event;

    if (command === "takeSnapshot") {
        let currentTab = await getCurrentTab()
        console.log('currentTab: ', currentTab)
        console.log("event: ", event)

        chrome.scripting.executeScript({
            target: { tabId: currentTab.id },
            files: ["captureMode.js"]
        });

        // const response = await sxaveSnapshot()
        // console.log('save snapshot response: ', response)
    } else if (command === "screenshotCaptured") {
        console.log('snapshot captured: ', event)
        let currentTab = await getCurrentTab()
        console.log('currentTab: ', currentTab)
        chrome.tabs.captureVisibleTab(null, { format: "png" }, (async function (snapshotBase64) {
            // console.log('snapshotBase64: ', snapshotBase64)
            if (chrome.runtime.lastError) {
                console.log("ERROR in captureVisibleTab")
                sendResponse({ error: chrome.runtime.lastError })
            }

            // console.log("TOOK SNAPSHOT: ", snapshotBase64)

            // save(e.rectData, e.screenData, e.deviceData, t, e.url, e.order, e.uid), r({ imageCaptured: t })
            const payload = { snapshotBase64, url: currentTab.url, coordinates: event.coord, pixelRatio: event.pixelRatio }
            await saveSnapshot(payload)
            //switch
            var newURL = "https://www.easelonchrome.com/dashboard";
            // var newURL = "http://localhost:3000/dashboard"
            chrome.tabs.create({ url: newURL });
        }))


    }


    // if (event.command === "takeSnapshot") {
    //     console.log('taking snapshot')
    //     //null = current visible tab
    //     return chrome.tabs.captureVisibleTab(null, { format: "png" }, (function (snapshotBase64) {
    //         if (chrome.runtime.lastError) {
    //             sxendResponse({ error: chrome.runtime.lastError })
    //             console.log("ERROR")
    //         }
    //         console.log("TOOK SNAPSHOT: ", snapshotBase64)
    //         // save(e.rectData, e.screenData, e.deviceData, t, e.url, e.order, e.uid), r({ imageCaptured: t })
    //         sxaveSnapshot(snapshotBase64)
    //     }))
    // }
}))

function injectWebsite(e) {
    console.log("inject website scrolling down: ", e)
    setInterval((() => { window.scroll({ top: e, behavior: "instant" }) }), 100)
}


function captureTab(newWindowId, currentWindowId) { //e: newWindowId, t:currentWindowId
    return new Promise(((r, n) => {
        chrome.tabs.captureVisibleTab(newWindowId, { format: "png" }, (function (n) {
            const lastError = chrome.runtime.lastError;
            if (lastError && !n) {
                console.log("ERROR CAPTURE TAB: ", lastError)
                r(n)
            } else {
                r(n)
                chrome.windows.update(currentWindowId, { focused: true })
                chrome.windows.remove(newWindowId)
            }
        }))
    }))
}



//these come from webpage AKA user dashboard upon hitting refresh
chrome.runtime.onMessageExternal.addListener((async function (msg, t, sendResponse) {
    console.log('external message: ', msg)


    if (msg.command === "isUserSignedIn") {
        const user_details = await getUserIdFromStorage();
        console.log('user_details: ', user_details)
        const { user_id, user_email } = user_details;
        if (!user_id || !user_email) {
            sendResponse({ user_id: null, user_email: null })
        } else {
            sendResponse({ user_id, user_email })
        }
    }

    if (msg.command === "userSignedOut") {
        console.log('user has signed out')
        chrome.storage.sync.set({ user_details: {} }, function () {
            console.log('User ID removed');
        });
    }

    if (msg.command === "processJWT") {
        //this means someone logged in on the webapp
        console.log('heyooooo processing JWT')
        const nestedJWT = msg.payload
        console.log('nestedJWT: ', nestedJWT)
        //make call to server to decrypt and get back user info

        const response2 = await fetch("https://easelon-chrome.vercel.app/api/decrypt", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ jwe: nestedJWT }),
        })

        if (!response2.ok) {
            console.log("ERROR jwt decrypt: ", await response2.text())
            return;
        }

        const { result2 } = await response2.json();
        console.log('decrypt result: ', result2)

        const parsed = JSON.parse(result2.sub)
        chrome.storage.sync.set({ user_details: parsed }, function () {
            console.log('User ID stored successfully');
        });

        sendResponse({ success: "true" })
    }

    if (msg.command === "createWindow") {
        console.log("creating window")
        chrome.windows.getCurrent({}, (function (t) {
            console.log("get current, t: ", t)
            if ("fullscreen" === t.state) chrome.windows.update(t.id, { state: "normal" });

            // var n = t.left
            // var o = t.top;
            // let a = t.id;
            const currentWindowId = t.id

            const config = {
                url: msg.url,
                focused: false,
                width: 1,
                height: 1,
                type: "normal",
                left: t.left,
                top: t.top
            };
            console.log("config: ", config)

            return chrome.windows.create(config, (function (e) {
                // var t = e.id;
                // let n = e.tabs[0].id;
                // r({ newWindowId: t, newTabId: n, currentWindowId: a })

                sendResponse({ newWindowId: e.id, newTabId: e.tabs[0].id, currentWindowId: currentWindowId })
            }))
        }));
    }


    if (msg.command === "refreshPortal") {
        console.log('refreshPortal')
        if (msg.newWindowId == "" || !msg.newWindowId) return sendResponse({ error: "missing newWindowId" })


        chrome.windows.update(msg.newWindowId, { width: msg.screenWidth, height: msg.screenHeight });

        const timeoutMap = msg.timeoutMap
        //TODO handle case when url is missing?
        const domainName = msg.url.replace(/^(https?:\/\/)?(www\.)?/, "").split("/")[0]
        const timeout = timeoutMap[domainName] || timeoutMap.default;

        //the regex and split gets the domain name
        //then we index into timeoutMap with t[domain_name OR just use the default timeout (t.default)]

        console.log('TIMEOUT: ', timeout)
        return chrome.scripting.executeScript({
            target: { tabId: msg.newTabId },
            func: injectWebsite,
            args: [msg.scrolltop]
        }, (t => {
            setTimeout((function () {
                captureTab(msg.newWindowId, msg.currentWindowId).then((e => {
                    sendResponse({ image: e })
                })).catch((e => {
                    sendResponse({ error: e })
                    console.error("Error:", e)
                }))
            }), timeout)
        }))
    }
}))