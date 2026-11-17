
// --- Camera Elements ---
const stepCamera = document.getElementById('step-camera');
const cameraTrigger = document.getElementById('camera-trigger');
const cameraFeed = document.getElementById('camera-feed');
const cameraCanvas = document.getElementById('camera-canvas');
const closeCameraBtn = document.getElementById('close-camera');
const captureBtn = document.getElementById('capture-btn');
let stream = null;

// --- Camera Event Listeners ---
cameraTrigger.addEventListener('click', async () => {
    try {
        stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } });
        cameraFeed.srcObject = stream;
        switchStep(stepUpload, stepCamera);
    } catch (err) {
        alert("Could not access camera. Please allow permissions or upload a file.");
        console.error(err);
    }
});

closeCameraBtn.addEventListener('click', () => {
    stopCamera();
    switchStep(stepCamera, stepUpload);
});

captureBtn.addEventListener('click', () => {
    // Draw video frame to canvas
    cameraCanvas.width = cameraFeed.videoWidth;
    cameraCanvas.height = cameraFeed.videoHeight;
    const ctx = cameraCanvas.getContext('2d');

    // Horizontal flip capture to match mirror view
    ctx.translate(cameraCanvas.width, 0);
    ctx.scale(-1, 1);
    ctx.drawImage(cameraFeed, 0, 0);

    // Get data URL
    const dataURL = cameraCanvas.toDataURL('image/jpeg');
    userData.imageSrc = dataURL;

    // Update previews
    userPhotoPreview.src = dataURL;
    scanPhoto.src = dataURL;

    // Cleanup and proceed
    stopCamera();
    switchStep(stepCamera, stepDetails);
});

function stopCamera() {
    if (stream) {
        stream.getTracks().forEach(track => track.stop());
        cameraFeed.srcObject = null;
    }
}
