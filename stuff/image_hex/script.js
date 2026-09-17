// ================= STATE & UI SWITCHING =================

let currentCanvas = null;
let currentFilename = "image.png";
let loadedBinaryBuffer = null;

function toggleMediaType() {
    const type = document.getElementById("mediaType").value;
    const textSec = document.getElementById("textSection");
    const binarySec = document.getElementById("binarySection");

    if (type === "text") {
        textSec.style.display = "block";
        binarySec.style.display = "none";
        updateEstimates();
    } else {
        textSec.style.display = "none";
        binarySec.style.display = "block";
        updateBinaryFileInput();
    }
}

function updateStats(width, height, bytesLength) {
    const estimatedBytes = bytesLength + (width * height * 4 * 0.4); 
    const sizeKB = (estimatedBytes / 1024).toFixed(2);
    
    document.getElementById("statsPanel").innerHTML = 
        `Dimensions: ${width} x ${height} px<br>` +
        `Estimated File Size: ${sizeKB} KB`;
}

function updateEstimates() {
    const type = document.getElementById("mediaType").value;
    if (type === "text") {
        const text = document.getElementById("textInput").value;
        const bytes = textToBytes(text);
        const hex = bytesToHex(bytes);
        
        while (hex.length % 3 !== 0) {
            hex.push("00");
        }
        const pixelsLength = hex.length / 3;
        const size = Math.ceil(Math.sqrt(pixelsLength));
        
        if (size === 0) {
            document.getElementById("statsPanel").innerHTML = "Dimensions: 0 x 0 px<br>Estimated File Size: 0 KB";
            return;
        }
        updateStats(size, size, bytes.length);
    }
}

async function updateBinaryFileInput() {
    const fileInput = document.getElementById("binaryFileInput");
    const file = fileInput.files[0];
    if (file) {
        const ext = file.name.split('.').pop() || "";
        const extBytesLength = new TextEncoder().encode(ext).length;
        const totalBytesLength = file.size + 3 + extBytesLength; // 3 bytes header + extension + file
        
        const pixelsLength = Math.ceil(totalBytesLength / 3);
        const size = Math.ceil(Math.sqrt(pixelsLength));
        
        updateStats(size, size, totalBytesLength);
    }
}

// ================= BYTE CONVERSION & FLAGS =================

function textToBytes(text) {
    const textEncoder = new TextEncoder().encode(text);
    const bytes = new Uint8Array(textEncoder.length + 1);
    bytes[0] = 0x00; // Flag: Text
    bytes.set(textEncoder, 1);
    return bytes;
}

function binaryToBytes(file) {
    return new Promise(async (resolve) => {
        const arrayBuffer = await file.arrayBuffer();
        const fileBytes = new Uint8Array(arrayBuffer);

        const nameParts = file.name.split('.');
        const ext = nameParts.length > 1 ? nameParts.pop() : "";
        const extBytes = new TextEncoder().encode(ext);
        const extLen = extBytes.length;

        // Header structure: [0xFF, highByte, lowByte] + extension bytes + file bytes
        const totalLength = 3 + extLen + fileBytes.length;
        const bytes = new Uint8Array(totalLength);

        bytes[0] = 0xFF; // Flag: Raw Binary File
        bytes[1] = (extLen >> 8) & 0xFF; // Extension length high byte
        bytes[2] = extLen & 0xFF;        // Extension length low byte

        // Copy extension bytes starting at index 3
        bytes.set(extBytes, 3);

        // Copy file bytes right after the extension
        bytes.set(fileBytes, 3 + extLen);

        resolve(bytes);
    });
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

async function generateSourceMedia() {
    const type = document.getElementById("mediaType").value;

    if (type === "text") {
        const text = document.getElementById("textInput").value;
        if (!text.trim()) {
            alert("Please enter some text first!");
            return;
        }
        const bytes = textToBytes(text);
        const hex = bytesToHex(bytes);
        const pixels = hexToPixels(hex);
        const canvas = buildImageCanvas(pixels);
        
        updateStats(canvas.width, canvas.height, bytes.length);
        showCanvas(canvas, "text_image.png", "encode_output");
    } else {
        const fileInput = document.getElementById("binaryFileInput");
        const file = fileInput.files[0];
        if (!file) {
            alert("Please select a binary file first!");
            return;
        }
        const bytes = await binaryToBytes(file);
        const hex = bytesToHex(bytes);
        const pixels = hexToPixels(hex);
        const canvas = buildImageCanvas(pixels);
        
        updateStats(canvas.width, canvas.height, bytes.length);
        showCanvas(canvas, "binary_image.png", "encode_output");
    }
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
    updateStats(size, size, 0);

    showCanvas(canvas, "noise.png", "noise_output");
}

// ================= IMAGE DECODER =================

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

    const sizeKB = (file.size / 1024).toFixed(2);
    document.getElementById("decodeStatsPanel").innerHTML = `Estimated File Size: ${sizeKB} KB`;

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

    const uint8Bytes = new Uint8Array(bytes);
    const flag = uint8Bytes[0]; 

    const outputDiv = document.getElementById("decodeOutput");
    outputDiv.innerHTML = ""; // Clear previous output

    if (flag === 0x00) {
        // Explicit Text Mode (starts with 0x00 flag)
        const payload = uint8Bytes.slice(1);
        const text = new TextDecoder()
            .decode(payload)
            .replace(/\0/g, "");
        outputDiv.textContent = text;
    } else if (flag === 0xFF) {
        // Raw Binary File Mode (Extension length in bytes 1 and 2)
        const extLen = (uint8Bytes[1] << 8) | uint8Bytes[2];
        
        let fileExtension = "bin"; 
        let payloadStartIndex = 3;

        if (extLen > 0) {
            const extBytes = uint8Bytes.slice(3, 3 + extLen);
            fileExtension = new TextDecoder().decode(extBytes);
            payloadStartIndex = 3 + extLen;
        }

        const payload = uint8Bytes.slice(payloadStartIndex);
        outputDiv.textContent = `Detected binary file (.${fileExtension || 'bin'})! Preparing download...\n`;
        
        const blob = new Blob([payload]);
        const link = document.createElement("a");
        link.href = URL.createObjectURL(blob);
        link.download = `decoded_file.${fileExtension || 'bin'}`;
        link.textContent = `Click here to download decoded_file.${fileExtension || 'bin'}`;
        link.style.display = "inline-block";
        link.style.marginTop = "10px";
        link.style.padding = "8px 12px";
        link.style.background = "#0ff";
        link.style.color = "#000";
        link.style.textDecoration = "none";
        
        outputDiv.appendChild(link);
    } else {
        // Fallback: Unrecognized flag or legacy text (treats entire byte array as text)
        const text = new TextDecoder()
            .decode(uint8Bytes)
            .replace(/\0/g, "");
        outputDiv.textContent = text;
    }
}

// ================= DISPLAY + DOWNLOAD =================

function showCanvas(canvas, filename, elementId) {
    const output = document.getElementById(elementId ? elementId : "output");

    output.innerHTML = "";
    output.appendChild(canvas);

    currentCanvas = canvas;
    currentFilename = filename;
}

function downloadImage() {
    if (!currentCanvas) {
        alert("No output file to download!");
        return;
    }

    currentCanvas.toBlob((blob) => {
        const link = document.createElement("a");
        link.download = currentFilename;
        link.href = URL.createObjectURL(blob);
        link.click();

        URL.revokeObjectURL(link.href);
    }, "image/png");
}

// ================= LOAD IMAGE & HELPERS =================

function loadImage(file) {
    return new Promise((resolve) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.src = URL.createObjectURL(file);
    });
}

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

            const offset = noise[noiseIdx]; 

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

async function runCipher(noiseFile, imageFile, mode = "add") {
    const noiseImg = await loadImage(noiseFile);
    const imageImg = await loadImage(imageFile);

    const noiseCanvas = imageToCanvas(noiseImg);
    const imageCanvas = imageToCanvas(imageImg);

    const result = applyCipher(noiseCanvas, imageCanvas, mode);

    updateStats(result.width, result.height, 0);
    showCanvas(result, mode === "add" ? "encrypted.png" : "decrypted.png", "noise_offset_output");

    return result;
}

window.encrypt = async function () {
    const noise = document.getElementById("noiseFile").files[0];
    const image = document.getElementById("imageFile").files[0];

    if (!noise || !image) {
        alert("Select both images!");
        return;
    }

    document.getElementById("noise_offset_output").innerHTML = "";
    await runCipher(noise, image, "add");
};

window.decrypt = async function () {
    const noise = document.getElementById("noiseFile").files[0];
    const image = document.getElementById("imageFile").files[0];

    if (!noise || !image) {
        alert("Select both images!");
        return;
    }

    document.getElementById("noise_offset_output").innerHTML = "";
    await runCipher(noise, image, "sub");
};