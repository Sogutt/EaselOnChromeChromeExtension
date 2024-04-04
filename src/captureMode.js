console.log('capture mode active')
document.body.style.userSelect = 'none';

const captureRectStyle = `
  position: fixed;
  top: 0;
  left: 0;
  border: 2px dashed white;
  z-index: 99999;
`;

const pixelRatio = window.devicePixelRatio

const captureRect = document.createElement('div');
captureRect.setAttribute('style', captureRectStyle);

document.body.appendChild(captureRect);

let pageStartX, pageStartY, pageEndX, pageEndY;
let startX, startY, endX, endY;
let isCaptureMode = false

//clientX and Y ARE what we need for the underlying coordinates for the snapshot - because it takes into account the entire page, 
//not just browser window. However, we need pageX and Y when drawing the rectangle


function cleanup(scrollTop) {
    document.body.style.userSelect = '';
    document.removeEventListener('mousedown', onMouseDown);
    document.removeEventListener('mousemove', onMouseMove);
    document.removeEventListener('mouseup', onMouseUp);
    captureRect.remove();

    const screenWidth = window.screen.width;
    const screenHeight = window.screen.height;

    const rectData = {
        scrollTop,
        startX,
        startY,
        endX,
        endY,
    }

    console.dir(rectData)

    chrome.runtime.sendMessage({
        command: 'screenshotCaptured',
        rectData,
        screenData: { screenWidth, screenHeight, pixelRatio },
    });
}


function onMouseDown(event) {
    isCaptureMode = true
    // startX = event.pageX;
    // startY = event.pageY;

    pageStartX = event.pageX;
    pageStartX = event.pageY;

    startX = event.clientX;
    startY = event.clientY;

    captureRect.style.left = startX + 'px'
    captureRect.style.top = startY + 'px'
}

function onMouseMove(event) {
    if (!isCaptureMode) return;
    // endX = event.pageX;
    // endY = event.pageY;
    endX = event.clientX;
    endY = event.clientY;
    drawSelectionBox(endX, endY);
}


function onMouseUp(event) {
    if (!isCaptureMode) return;
    // endX = event.pageX;
    // endY = event.pageY;
    endX = event.clientX;
    endY = event.clientY;
    // drawSelectionBox(endX, endY);
    isSnapshotMode = false;
    pageEndX = event.pageX;
    pageEndY = event.pageY;

    document.body.style.userSelect = 'auto';

    const scrollTop = window.pageYOffset //|| document.documentElement.scrollTop || document.body.scrollTop;
    const windowScrollY = window.scrollY;
    console.log('scrollTop: ', scrollTop, windowScrollY)
    cleanup(scrollTop);
}


function drawSelectionBox(endX, endY) {
    let diffX = endX - startX
    let diffY = endY - startY
    captureRect.style.width = diffX + 'px'
    captureRect.style.height = diffY + 'px'
    // captureRect.innerHTML = `${startX}, ${startY} - ${endX}, ${endY}`;
}

document.addEventListener('mousedown', onMouseDown);
document.addEventListener('mousemove', onMouseMove);
document.addEventListener('mouseup', onMouseUp);