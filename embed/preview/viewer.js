import * as NBT from 'https://cdn.jsdelivr.net/npm/nbtify@2.1.0/+esm';

const TEXTURE_BASE_URL = 'https://raw.githubusercontent.com/InventivetalentDev/minecraft-assets/1.21.11/assets/minecraft/textures/block/';
const MODEL_BASE_URL = 'https://raw.githubusercontent.com/InventivetalentDev/minecraft-assets/1.21.11/assets/minecraft/models/block/';

const scene = new THREE.Scene();
scene.background = new THREE.Color(0xf2efe4);

const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

const controls = new THREE.OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.05;

scene.add(new THREE.AmbientLight(0xffffff, 0.7));
const dirLight = new THREE.DirectionalLight(0xffffff, 0.5);
dirLight.position.set(10, 20, 15);
scene.add(dirLight);

const textureLoader = new THREE.TextureLoader();
const materialCache = {};
const modelCache = {};
const cubeGeometry = new THREE.BoxGeometry(1, 1, 1);

async function fetchBlockModel(cleanName) {
    if (modelCache[cleanName] !== undefined) return modelCache[cleanName];
    try {
        const res = await fetch(`${MODEL_BASE_URL}${cleanName}.json`);
        if (res.ok) {
            const data = await res.json();
            modelCache[cleanName] = data;
            return data;
        }
    } catch (e) {}
    modelCache[cleanName] = null;
    return null;
}

async function resolveTextureKey(blockName) {
    let cleanName = blockName.replace('minecraft:', '').replace('block/', '').replace(/\[.*\]/, '');
    let currentName = cleanName;
    let textureKey = null;

    for (let i = 0; i < 5; i++) {
        const modelData = await fetchBlockModel(currentName);
        if (!modelData) break;
        const textures = modelData.textures || {};
        for (const slot of ['all', 'top', 'side', 'front', 'block']) {
            if (textures[slot]) {
                textureKey = textures[slot];
                break;
            }
        }
        if (textureKey) break;
        if (modelData.parent) {
            currentName = modelData.parent.replace('minecraft:', '').replace('block/', '');
        } else {
            break;
        }
    }

    if (!textureKey) textureKey = `block/${cleanName}`;
    return textureKey.replace('minecraft:', '').replace('block/', '');
}

async function getBlockMaterial(blockName) {
    const cleanName = blockName.replace('minecraft:', '').replace('block/', '');
    if (materialCache[cleanName]) return materialCache[cleanName];

    const textureKey = await resolveTextureKey(blockName);
    const textureUrl = `${TEXTURE_BASE_URL}${textureKey}.png`;

    return new Promise((resolve) => {
        textureLoader.load(
            textureUrl,
            (texture) => {
                texture.magFilter = THREE.NearestFilter;
                texture.minFilter = THREE.NearestFilter;
                const mat = new THREE.MeshLambertMaterial({ map: texture, transparent: true });
                materialCache[cleanName] = mat;
                resolve(mat);
            },
            undefined,
            () => {
                const fallback = new THREE.MeshLambertMaterial({ color: 0x808080 });
                materialCache[cleanName] = fallback;
                resolve(fallback);
            }
        );
    });
}

async function renderStructure(rootData) {
    const size = rootData.size || [16, 16, 16];
    const blocks = rootData.blocks || [];
    const palette = rootData.palette || [];
    
    const sizeX = Number(size[0]);
    const sizeY = Number(size[1]);
    const sizeZ = Number(size[2]);
    
    const structureGroup = new THREE.Group();

    for (const block of blocks) {
        const pos = block.pos;
        const x = Number(pos[0]);
        const y = Number(pos[1]);
        const z = Number(pos[2]);

        let blockName = 'stone';
        if (block.state !== undefined && palette[block.state]) {
            blockName = palette[block.state].Name || 'stone';
        }

        const material = await getBlockMaterial(blockName);
        const cube = new THREE.Mesh(cubeGeometry, material);
        cube.position.set(x - sizeX / 2, y - sizeY / 2, z - sizeZ / 2);
        structureGroup.add(cube);
    }

    scene.add(structureGroup);
    const maxDim = Math.max(sizeX, sizeY, sizeZ);
    camera.position.set(maxDim * 1.5, maxDim * 1.5, maxDim * 1.5);
    controls.target.set(0, 0, 0);
    controls.update();
}

const urlParams = new URLSearchParams(window.location.search);
const nbtUrl = urlParams.get('file');

console.log("Viewer loaded. Target NBT URL:", nbtUrl); // <-- Check if this prints null

if (nbtUrl) {
    fetch(nbtUrl)
        .then(res => {
            console.log("Fetch response status:", res.status);
            return res.arrayBuffer();
        })
        .then(async buffer => {
            console.log("Buffer received, parsing NBT...");
            const parsed = await NBT.read(buffer);
            console.log("Parsed NBT data:", parsed.data);
            renderStructure(parsed.data);
        })
        .catch(err => console.error('Error loading NBT:', err));
} else {
    console.warn("No 'file' parameter found in the URL query string!");
}

function animate() {
    requestAnimationFrame(animate);
    controls.update();
    renderer.render(scene, camera);
}
animate();

window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});