// document.body.style.backgroundColor = "orange";
document.body.style.userSelect = 'none';

// const overlayStyle = `
//   position: fixed;
//   top: 0;
//   left: 0;
//   width: 100%;
//   height: 100%;
//   background-color: rgba(0, 0, 0, 0.5); /* Semi-transparent gray */
//   z-index: 9998; /* Ensure it's above other elements */
// `;

const captureRectStyle = `
  position: absolute;
  top: 0;
  left: 0;
  border: 2px dashed white;
  z-index: 9999; /* Ensure it's above other elements */
`;

//not working currently
// document.body.style.cursor = 'crosshair';

// Create a div element for the overlay
// const overlayDiv = document.createElement('div');
// overlayDiv.setAttribute('style', overlayStyle);

const pixelRatio = window.devicePixelRatio
console.log('pixelRatio: ', pixelRatio)

const captureRect = document.createElement('div');
captureRect.setAttribute('style', captureRectStyle);

// Append the overlay div to the body
// document.body.appendChild(overlayDiv);
document.body.appendChild(captureRect);


let startX, startY, endX, endY;
let isCaptureMode = false


function cleanup() {
    document.removeEventListener('mousedown', onMouseDown);
    document.removeEventListener('mousemove', onMouseMove);
    document.removeEventListener('mouseup', onMouseUp);
    // overlayDiv.remove();
    captureRect.remove();
    const coord = { startX, startY, endX, endY }
    console.dir(coord)
    chrome.runtime.sendMessage({ command: 'screenshotCaptured', coord, pixelRatio });
}


function onMouseDown(event) {
    isCaptureMode = true
    // startX = event.pageX;
    // startY = event.pageY;
    startX = event.clientX;
    startY = event.clientY;
    captureRect.style.top = startY + 'px'
    captureRect.style.left = startX + 'px'
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
    // Capture the selected area and do something with it
    // Example: captureScreenshot(startX, startY, endX, endY);
    cleanup();
}


function drawSelectionBox(endX, endY) {
    let w = endX - startX
    let h = endY - startY

    let width = w + 'px'
    let height = h + 'px'
    captureRect.style.width = width
    captureRect.style.height = height
    captureRect.innerHTML = `${startX}, ${startY} - ${endX}, ${endY}`;
    // console.log(endX, endY, width, height)
}

document.addEventListener('mousedown', onMouseDown);
document.addEventListener('mousemove', onMouseMove);
document.addEventListener('mouseup', onMouseUp);