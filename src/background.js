let local = true
// let local = false
const HOST = local ? 'http://localhost:3000' : "https://www.easelonchrome.com"

async function getUserIdFromStorage() {
    return new Promise((resolve, reject) => {
        chrome.storage.sync.get('user_details', function (data) {
            if (chrome.runtime.lastError) {
                reject(chrome.runtime.lastError);
            } else {
                resolve(data.user_details);
            }
        });
    });
}

async function saveRefreshedSnapshot({ snapshotBase64, url, rectData, screenData, snapshotVersion, portal_id }) {

    const user_details = await getUserIdFromStorage();
    const { user_id } = user_details;

    const URI = `${HOST}/api/handle-refresh-snapshot`

    const response = await fetch(URI, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            snapshotBase64,
            url,
            user_id,
            rectData,
            screenData,
            snapshotVersion,
            portal_id
        }),
    })

    if (!response.ok) {
        console.log("ERROR handle-refresh-snapshot: ", await response.text())
        return;
    }

    const { result, error } = await response.json();
}


async function saveSnapshot({ snapshotBase64, url, rectData, screenData }) {

    const user_details = await getUserIdFromStorage();
    const { user_id } = user_details;

    const URI = `${HOST}/api/handle-brand-new-snapshot`

    const response = await fetch(URI, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            snapshotBase64,
            url,
            user_id,
            rectData,
            screenData
        }),
    })

    if (!response.ok) {
        console.error("handle-brand-new-snapshot: ", await response.text())
        return;
    }

    const { success, newSnapshotName } = await response.json();
}

async function getCurrentTab() {
    let queryOptions = { active: true, lastFocusedWindow: true };
    let [tab] = await chrome.tabs.query(queryOptions);
    return tab;
}


chrome.runtime.onMessage.addListener((async function (event, target, sendResponse) {

    if (event.command === "takeSnapshot") {

        let currentTab = await getCurrentTab()

        chrome.scripting.executeScript({
            target: { tabId: currentTab.id },
            files: ["captureMode.js"]
        });
    } else if (event.command === "screenshotCaptured") {

        let currentTab = await getCurrentTab()

        chrome.tabs.captureVisibleTab(null, { format: "png" }, (async function (snapshotBase64) {

            if (chrome.runtime.lastError) {
                console.error("ERROR in captureVisibleTab")
                sendResponse({ error: chrome.runtime.lastError })
            }

            const payload = {
                snapshotBase64,
                url: currentTab.url,
                rectData: event.rectData,
                screenData: event.screenData
            }
            await saveSnapshot(payload)

            const newURL = `${HOST}/dashboard`
            chrome.tabs.create({ url: newURL });
        }))
    }
}))


function handleScroll(scrollTop) {
    setInterval((() => {
        window.scroll({ top: scrollTop, behavior: "instant" })
    }), 500)
}


function captureTab(newWindowId, currentWindowId) {
    return new Promise(((resolve, reject) => {
        chrome.tabs.captureVisibleTab(newWindowId, { format: "png" }, (function (imageData) {
            const lastError = chrome.runtime.lastError;
            if (lastError) {
                console.error("captureTab: ", lastError);
                reject(lastError); // Reject with the error
            } else if (!imageData) {
                const error = new Error("Failed to capture tab.");
                console.error(error);
                reject(error); // Reject with a custom error if capturedImage is falsy
            } else {
                resolve(imageData)
                chrome.windows.update(currentWindowId, { focused: true })
                chrome.windows.remove(newWindowId)
            }
        }))
    }))
}


chrome.runtime.onMessageExternal.addListener((async function (msg, t, sendResponse) {



    if (msg.command === "isUserSignedIn") {
        const user_details = await getUserIdFromStorage();

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

        const nestedJWT = msg.nestedJWT
        const snapshotCount = msg.snapshotCount
        const planName = msg.planName

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


        const parsed = JSON.parse(result2.sub)
        chrome.storage.sync.set({ user_details: parsed, snapshotCount, planName }, function () {
            console.log('User ID stored successfully');
        });

        sendResponse({ success: "true" })
    }

    if (msg.command === "createWindow") {
        const { url, screenData } = msg

        chrome.windows.getCurrent({}, (function (t) {

            if (t.state === "fullscreen") {
                chrome.windows.update(t.id, { state: "normal" });
            }

            const currentWindowId = t.id

            const config = {
                url,
                focused: false,
                width: screenData.screenWidth ?? 1,
                height: screenData.screenHeight ?? 1,
                type: "normal",
                left: t.left,
                top: t.top
            };

            return chrome.windows.create(config, (function (e) {
                sendResponse({
                    newWindowId: e.id,
                    newTabId: e.tabs[0].id,
                    currentWindowId: currentWindowId
                })
            }))
        }));
    }

    if (msg.command === "refreshPortal") {

        const { url, screenData, rectData, timeoutMap, newWindowId, newTabId, currentWindowId, snapshotVersion, portal_id } = msg

        if (!newWindowId || newWindowId == "") return sendResponse({ error: "missing newWindowId" })

        chrome.windows.update(newWindowId, { width: screenData.screenWidth, height: screenData.screenHeight });

        const domainName = url.replace(/^(https?:\/\/)?(www\.)?/, "").split("/")[0]
        const timeout = timeoutMap[domainName] || timeoutMap.default || 3000;

        await chrome.scripting.executeScript({
            target: { tabId: newTabId },
            func: handleScroll,
            args: [rectData.scrollTop]
        });
        console.log(`waiting ${timeout} ${url}`)
        await new Promise(resolve => setTimeout(resolve, timeout));

        try {
            const snapshotBase64 = await captureTab(newWindowId, currentWindowId);

            const payload = {
                snapshotBase64,
                url,
                rectData,
                screenData,
                snapshotVersion,
                portal_id
            };
            await saveRefreshedSnapshot(payload);
            sendResponse({ success: true });
        } catch (error) {
            sendResponse({ error });
            console.error("refreshPortal:", error);
        }
    }
}))