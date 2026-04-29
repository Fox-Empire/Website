// ================= TEXT → IMAGE =================

function textToBytes(text) {
    return new TextEncoder().encode(text);
}

function bytesToHex(bytes) {
    let hex = [];
    for (let b of bytes) {
        hex.push(b.toString(16).padStart(2, "0").toUpperCase());
    }
    return hex;
}

function hexToPixels(hexArray) {
    while (hexArray.length % 3 !== 0) {
        hexArray.push("00");
    }

    let pixels = [];

    for (let i = 0; i < hexArray.length; i += 3) {
        let r = parseInt(hexArray[i], 16);
        let g = parseInt(hexArray[i + 1], 16);
        let b = parseInt(hexArray[i + 2], 16);
        pixels.push([r, g, b]);
    }

    return pixels;
}

function buildImageCanvas(pixels) {
    const size = Math.ceil(Math.sqrt(pixels.length));

    const canvas = document.createElement("canvas");
    canvas.width = size;
    canvas.height = size;

    const ctx = canvas.getContext("2d");
    const imgData = ctx.createImageData(size, size);

    // fill pixels
    for (let i = 0; i < pixels.length; i++) {
        let [r, g, b] = pixels[i];

        imgData.data[i * 4 + 0] = r;
        imgData.data[i * 4 + 1] = g;
        imgData.data[i * 4 + 2] = b;
        imgData.data[i * 4 + 3] = 255;
    }

    ctx.putImageData(imgData, 0, 0);
    return canvas;
}

function generateTextImage() {
    const text = document.getElementById("textInput").value;

    const bytes = textToBytes(text);
    const hex = bytesToHex(bytes);
    const pixels = hexToPixels(hex);

    const canvas = buildImageCanvas(pixels);

    showCanvas(canvas, "text_image.png");
}

// ================= COLOR NOISE =================

function generateNoise() {
    let size = parseInt(document.getElementById("noiseSize").value);

    if (isNaN(size) || size <= 0) {
        size = 128;
    }

    const canvas = document.createElement("canvas");
    canvas.width = size;
    canvas.height = size;

    const ctx = canvas.getContext("2d");
    const imgData = ctx.createImageData(size, size);

    for (let i = 0; i < imgData.data.length; i += 4) {
        imgData.data[i] = Math.floor(Math.random() * 256);
        imgData.data[i + 1] = Math.floor(Math.random() * 256);
        imgData.data[i + 2] = Math.floor(Math.random() * 256);
        imgData.data[i + 3] = 255;
    }

    ctx.putImageData(imgData, 0, 0);

    showCanvas(canvas, "noise.png");
}

// ================= IMAGE → TEXT DECODER =================

function loadImageFromFile(file) {
    return new Promise((resolve) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.src = URL.createObjectURL(file);
    });
}

async function generateDecodedText() {
    const file = document.getElementById("decodeFile").files[0];

    if (!file) {
        alert("Select an image first!");
        return;
    }

    const img = await loadImageFromFile(file);

    const canvas = document.createElement("canvas");
    canvas.width = img.width;
    canvas.height = img.height;

    const ctx = canvas.getContext("2d");
    ctx.drawImage(img, 0, 0);

    const data = ctx.getImageData(0, 0, canvas.width, canvas.height).data;

    let bytes = [];

    for (let i = 0; i < data.length; i += 4) {
        bytes.push(data[i]);     // R
        bytes.push(data[i + 1]); // G
        bytes.push(data[i + 2]); // B
    }

    const text = new TextDecoder()
        .decode(new Uint8Array(bytes))
        .replace(/\0/g, "");

    document.getElementById("decodeOutput").textContent = text;
}

// ================= DISPLAY + DOWNLOAD =================

function showCanvas(canvas, filename) {
    const output = document.getElementById("output");

    output.innerHTML = "";
    output.appendChild(canvas);

    downloadCanvas(canvas, filename);
}

function downloadCanvas(canvas, filename) {
    const link = document.createElement("a");
    link.download = filename;
    link.href = canvas.toDataURL("image/png");
    link.click();
}

// ================= LOAD IMAGE =================

function loadImage(file) {
    return new Promise((resolve) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.src = URL.createObjectURL(file);
    });
}

// ================= CANVAS HELPERS =================

function imageToCanvas(img) {
    const canvas = document.createElement("canvas");
    canvas.width = img.width;
    canvas.height = img.height;

    const ctx = canvas.getContext("2d");
    ctx.drawImage(img, 0, 0);

    return canvas;
}

function getPixels(canvas) {
    const ctx = canvas.getContext("2d");
    return ctx.getImageData(0, 0, canvas.width, canvas.height);
}

function putPixels(canvas, imageData) {
    const ctx = canvas.getContext("2d");
    ctx.putImageData(imageData, 0, 0);
}

// ================= DOWNLOAD =================

function downloadCanvas(canvas, name = "output.png") {
    const a = document.createElement("a");
    a.download = name;
    a.href = canvas.toDataURL("image/png");
    a.click();
}

// ================= CORE CIPHER =================

function applyCipher(noiseCanvas, imageCanvas, mode = "add") {
    const nw = noiseCanvas.width;
    const nh = noiseCanvas.height;

    const noise = getPixels(noiseCanvas).data;
    const imgData = getPixels(imageCanvas);

    const data = imgData.data;

    for (let y = 0; y < imageCanvas.height; y++) {
        for (let x = 0; x < imageCanvas.width; x++) {

            const imgIdx = (y * imageCanvas.width + x) * 4;

            const nx = x % nw;
            const ny = y % nh;
            const noiseIdx = (ny * nw + nx) * 4;

            const offset = noise[noiseIdx]; // grayscale noise (R channel)

            if (mode === "add") {
                data[imgIdx]     = (data[imgIdx] + offset) % 256;
                data[imgIdx + 1] = (data[imgIdx + 1] + offset) % 256;
                data[imgIdx + 2] = (data[imgIdx + 2] + offset) % 256;
            } else {
                data[imgIdx]     = (data[imgIdx] - offset + 256) % 256;
                data[imgIdx + 1] = (data[imgIdx + 1] - offset + 256) % 256;
                data[imgIdx + 2] = (data[imgIdx + 2] - offset + 256) % 256;
            }

            data[imgIdx + 3] = 255;
        }
    }

    putPixels(imageCanvas, imgData);
    return imageCanvas;
}

// ================= EXAMPLE USAGE =================

async function runCipher(noiseFile, imageFile, mode = "add") {
    const noiseImg = await loadImage(noiseFile);
    const imageImg = await loadImage(imageFile);

    const noiseCanvas = imageToCanvas(noiseImg);
    const imageCanvas = imageToCanvas(imageImg);

    const result = applyCipher(noiseCanvas, imageCanvas, mode);

    document.body.appendChild(result);
    downloadCanvas(result, mode === "add" ? "encrypted.png" : "decrypted.png");

    return result;
}

window.encrypt = async function () {
    const noise = document.getElementById("noiseFile").files[0];
    const image = document.getElementById("imageFile").files[0];

    if (!noise || !image) {
        alert("Select both images!");
        return;
    }

    document.getElementById("output").innerHTML = "";

    await runCipher(noise, image, "add");
};

window.decrypt = async function () {
    const noise = document.getElementById("noiseFile").files[0];
    const image = document.getElementById("imageFile").files[0];

    if (!noise || !image) {
        alert("Select both images!");
        return;
    }

    document.getElementById("output").innerHTML = "";

    await runCipher(noise, image, "sub");
};