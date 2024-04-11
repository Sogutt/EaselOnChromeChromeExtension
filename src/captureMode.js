console.log('captureMode')
document.body.style.userSelect = 'none';
document.body.style.cursor = 'crosshair'; // Change cursor to pointer
const infoModalStyle = `
  position: fixed;
  bottom: 7%;
  left: 50%;
  transform: translate(-50%);
  z-index: 99999;
  width:500px;
  height:40px;
  background-color:#f97316;
  color:white;
  font-size: 14px;
  font-weight:bold;
  border-radius: 10px;
  padding: 2px 10px 2px 10px;
  text-align: center;
  display:flex;
  flex-direction:row;
  justify-content: center;
  align-items: center;
  border: 2px solid #1f2937;
  box-shadow: rgba(0, 0, 0, 0.50) 0px 5px 15px;
`;
var infoModal = document.createElement('div');
infoModal.setAttribute('style', infoModalStyle);
infoModal.innerText = 'Click anywhere and drag to capture a snapshot! Press Esc key to cancel'
document.body.appendChild(infoModal);


const captureRectStyle = `
  position: fixed;
  top: 0;
  left: 0;
  border: 2px dashed #f97316;
  z-index: 99999;
  pointer-events = none
`;
const captureRect = document.createElement('div');
captureRect.setAttribute('style', captureRectStyle);
document.body.appendChild(captureRect);

const pixelRatio = window.devicePixelRatio
let pageStartX, pageStartY, pageEndX, pageEndY;
let startX, startY, endX, endY;
let isCaptureMode = false

//clientX and Y ARE what we need for the underlying coordinates for the snapshot - because it takes into account the entire page, 
//not just browser window. However, we need pageX and Y when drawing the rectangle

document.addEventListener("keydown", keyDownTextField, false);

function keyDownTextField(event) {
    const escapeKeyCode = 27
    if (event.keyCode == escapeKeyCode) {
        cleanup()
    }
}


async function cleanup(scrollTop) {

    document.body.style.userSelect = '';
    document.removeEventListener('mousedown', onMouseDown);
    document.removeEventListener('mousemove', onMouseMove);
    document.removeEventListener('mouseup', onMouseUp);
    captureRect.remove();
    infoModal.remove()
    document.body.style.cursor = 'auto';

    console.log('startX === endX && startY === endY: ', startX, endX, startY, endY)
    if ((!startX || !endX || !startY || !endY) || (startX === endX && startY === endY)) {
        console.log('no area captured')
        return;
    }

    const screenWidth = window.screen.width;
    const screenHeight = window.screen.height;

    // +/- 2px so the capture does NOT show the captureRect - even though it is removed it is still visible
    const rectData = {
        scrollTop,
        startX: startX + 2,
        startY: startY + 2,
        endX: endX - 2,
        endY: endY - 2,
    }

    console.dir(rectData)

    chrome.runtime.sendMessage({
        command: 'screenshotCaptured',
        rectData,
        screenData: { screenWidth, screenHeight, pixelRatio },
    });

    const successToastStyle = `
  position: fixed;
  top: 7%;
  left: 50%;
  transform: translate(-50%);
  width:300px;
  height:40px;
  background-color:#f97316;
  color:white;
  font-size: 14px;
  font-weight:bold;
  border-radius: 10px;
  padding: 2px 10px 2px 10px;  
  display:flex;
  flex-direction:row;
  justify-content: center;
  align-items: center;
  text-align: center;
  box-shadow: rgba(0, 0, 0, 0.50) 0px 5px 15px;
  z-index: 99999;
`;
    var successToast = document.createElement('div');
    successToast.setAttribute('style', successToastStyle);
    successToast.innerText = 'Snapshot captured! Opening dashboard'
    document.body.appendChild(successToast);
    await new Promise(resolve => setTimeout(resolve, 2700));
    successToast.remove()
}


function onMouseDown(event) {
    infoModal.remove()
    isCaptureMode = true
    // startX = event.pageX;
    // startY = event.pageY;

    // pageStartX = event.pageX;
    // pageStartY = event.pageY;

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
    // pageEndX = event.pageX;
    // pageEndY = event.pageY;

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