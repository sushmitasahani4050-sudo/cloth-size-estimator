document.addEventListener('DOMContentLoaded', () => {
    // --- Elements ---
    const stepUpload = document.getElementById('step-upload');
    const stepDetails = document.getElementById('step-details');
    const stepScanning = document.getElementById('step-scanning');
    const stepResults = document.getElementById('step-results');

    const uploadTrigger = document.getElementById('upload-trigger');
    const fileInput = document.getElementById('file-input');

    const userPhotoPreview = document.getElementById('user-photo-preview');
    const scanPhoto = document.getElementById('scan-photo');

    const detailsForm = document.getElementById('details-form');
    const heightInput = document.getElementById('height-input');
    const occasionInput = document.getElementById('occasion-input');
    const fitOptions = document.querySelectorAll('.option-btn');

    const scanStatus = document.getElementById('scan-status');
    const restartBtn = document.getElementById('restart-btn');

    // Results Elements
    const resSummary = document.getElementById('res-summary');
    const resSizes = document.getElementById('res-sizes');
    const resStores = document.getElementById('res-stores');
    const resTips = document.getElementById('res-tips');
    const resRoute = document.getElementById('res-route');

    // --- State ---
    let userData = {
        imageSrc: '',
        height: 0,
        fit: 'regular',
        occasion: 'casual'
    };

    // --- Camera Elements ---
    const stepCamera = document.getElementById('step-camera');
    const cameraTrigger = document.getElementById('camera-trigger');
    const cameraFeed = document.getElementById('camera-feed');
    const cameraCanvas = document.getElementById('camera-canvas');
    const closeCameraBtn = document.getElementById('close-camera');
    const captureBtn = document.getElementById('capture-btn');
    let stream = null;

    // --- Event Listeners ---

    // 1. Upload & Camera Triggers
    uploadTrigger.addEventListener('click', () => fileInput.click());

    cameraTrigger.addEventListener('click', async () => {
        try {
            stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } });
            cameraFeed.srcObject = stream;
            // Ensure video plays
            cameraFeed.onloadedmetadata = () => {
                cameraFeed.play();
            };
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

    fileInput.addEventListener('change', (e) => {
        if (e.target.files && e.target.files[0]) {
            const reader = new FileReader();
            reader.onload = (e) => {
                userData.imageSrc = e.target.result;
                userPhotoPreview.src = userData.imageSrc;
                scanPhoto.src = userData.imageSrc;
                switchStep(stepUpload, stepDetails);
            };
            reader.readAsDataURL(e.target.files[0]);
        }
    });

    // 2. Fit Option Selection
    fitOptions.forEach(btn => {
        btn.addEventListener('click', () => {
            fitOptions.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            userData.fit = btn.dataset.value;
        });
    });

    // 3. Form Submit (Start Analysis)
    detailsForm.addEventListener('submit', (e) => {
        e.preventDefault();
        userData.height = parseInt(heightInput.value);
        userData.occasion = occasionInput.value;

        if (userData.height) {
            startAnalysis();
        }
    });

    // 4. Restart
    restartBtn.addEventListener('click', () => {
        // Reset form
        heightInput.value = '';
        fileInput.value = '';
        userData.imageSrc = '';
        userPhotoPreview.src = '';
        switchStep(stepResults, stepUpload);
    });

    // --- Functions ---

    function stopCamera() {
        if (stream) {
            stream.getTracks().forEach(track => track.stop());
            cameraFeed.srcObject = null;
            stream = null;
        }
    }

    function switchStep(from, to) {
        from.classList.remove('active');
        // Small delay to allow fade out
        setTimeout(() => {
            to.classList.add('active');
        }, 300); // reduced delay for snappier feel
    }

    function startAnalysis() {
        switchStep(stepDetails, stepScanning);

        const messages = [
            "Identifying body landmarks...",
            "Measuring shoulder breadth...",
            "Analyzing vertical proportions...",
            "Matching brand sizing charts..."
        ];

        let i = 0;
        const interval = setInterval(() => {
            if (i < messages.length) {
                scanStatus.textContent = messages[i];
                i++;
            } else {
                clearInterval(interval);
                generateResults();
                switchStep(stepScanning, stepResults);
            }
        }, 1000); // 1 second per step -> 4 seconds total scan
    }

    // --- Logic / Heuristics (Mocked) ---
    function generateResults() {
        const { height, fit, occasion } = userData;

        // 1. Estimate Size (Simple Heuristic for Demo)
        // Assume estimation based on Height + "AI Analysis" (Randomized slightly)
        let baseSize = 'M';
        let waistSize = 30;

        if (height < 165) { baseSize = 'XS'; waistSize = 28; }
        else if (height < 172) { baseSize = 'S'; waistSize = 29; }
        else if (height < 180) { baseSize = 'M'; waistSize = 31; }
        else if (height < 188) { baseSize = 'L'; waistSize = 33; }
        else { baseSize = 'XL'; waistSize = 36; }

        // Adjust for fit preference
        let topSizeRange = baseSize;
        if (fit === 'loose') topSizeRange = `${baseSize} - ${nextSize(baseSize)}`;
        if (fit === 'slim') topSizeRange = `${prevSize(baseSize)} - ${baseSize}`;

        // 2. Determine Body Shape (Randomized for variety in demo)
        const shapes = ['Inverted Triangle', 'Rectangular', 'Trapezoid', 'Oval'];
        const shape = shapes[Math.floor(Math.random() * shapes.length)];

        // 3. Populate HTML

        // Summary
        resSummary.innerHTML = `<strong>${shape}</strong> shape detected. Your height (${height}cm) suggests a focus on <strong>${fit} fits</strong> for a balanced silhouette.`;

        // Sizes
        resSizes.innerHTML = `
            <div class="size-item"><span>Tops / Shirts</span><strong>${topSizeRange}</strong></div>
            <div class="size-item"><span>Trousers / Jeans</span><strong>${waistSize}-${waistSize + 1}"</strong></div>
            <div class="size-item"><span>Jackets</span><strong>${baseSize === 'XS' ? 36 : baseSize === 'S' ? 38 : baseSize === 'M' ? 40 : baseSize === 'L' ? 42 : 44}R</strong></div>
        `;

        // Stores (Contextual - affordable vs premium)
        const stores = [
            { name: "H&M", type: "Affordable", floor: "G", note: "Try Slim Fit range here." },
            { name: "Zara", type: "Trendy", floor: "1", note: "Sizes run small, size up." },
            { name: "Massimo Dutti", type: "Premium", floor: "2", note: "Excellent for formal wear." },
            { name: "Uniqlo", type: "Essential", floor: "G", note: "Best for basics." }
        ];

        // Filter valid stores (just take 2-3 for demo)
        const selectedStores = stores.sort(() => 0.5 - Math.random()).slice(0, 3);

        resStores.innerHTML = selectedStores.map(s => `
            <div class="store-item">
                <h4>${s.name} <span style="font-size:0.7em; opacity:0.7; border:1px solid #555; padding:2px 4px; border-radius:4px;">${s.type}</span></h4>
                <p>Floor ${s.floor} • ${s.note}</p>
            </div>
        `).join('');

        // Tips (Contextual to fit/occasion)
        let tips = [];
        if (fit === 'slim') tips.push("Look for 'Slim' or 'Tailored' tags on shirts.");
        if (fit === 'loose') tips.push("Oversized tees paired with straight-leg jeans work great.");
        if (occasion === 'office') tips.push("Stick to solid colors or subtle patterns.");
        if (occasion === 'party') tips.push("Don't be afraid to try textured fabrics like velvet or silk.");
        tips.push(`For your ${shape} shape, structure at the shoulders helps definition.`);

        resTips.innerHTML = tips.map(t => `<li>${t}</li>`).join('');

        // Route
        resRoute.innerHTML = `${selectedStores[0].name} (Start) ➝ ${selectedStores[1].name} ➝ ${selectedStores[2].name} (Finish)`;
    }

    // Helper functions for sizes
    const sizes = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];
    function nextSize(s) {
        const idx = sizes.indexOf(s);
        return sizes[idx + 1] || s;
    }
    function prevSize(s) {
        const idx = sizes.indexOf(s);
        return sizes[idx - 1] || s;
    }

});
