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
const modelGeometryCache = {};
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

    const variantsToTry = [cleanName, `${cleanName}_post`, `${cleanName}_inventory`];

    for (const variant of variantsToTry) {
        let modelData = await fetchBlockModel(variant);
        if (modelData) {
            let currentModel = modelData;
            for (let i = 0; i < 5; i++) {
                const textures = currentModel.textures || {};
                const textureValues = Object.values(textures);
                
                if (textureValues.length > 0) {
                    const directPath = textureValues.find(v => typeof v === 'string' && !v.startsWith('#'));
                    if (directPath) {
                        textureKey = directPath;
                        break;
                    }
                }

                if (currentModel.parent) {
                    const parentName = currentModel.parent.replace('minecraft:', '').replace('block/', '');
                    currentModel = await fetchBlockModel(parentName);
                    if (!currentModel) break;
                } else {
                    break;
                }
            }
        }
        if (textureKey) break;
    }

    if (!textureKey) {
        if (cleanName.includes('glass_pane')) {
            textureKey = `block/${cleanName.replace('_pane', '')}`;
        } else {
            textureKey = `block/${cleanName}`;
        }
    }

    return textureKey.replace('minecraft:', '').replace('block/', '');
}

async function getBlockMaterial(blockName) {
    const baseName = blockName.replace('minecraft:', '').replace('block/', '').replace(/\[.*\]/, '');
    if (materialCache[baseName]) return materialCache[baseName];

    const textureKey = await resolveTextureKey(blockName);
    const textureUrl = `${TEXTURE_BASE_URL}${textureKey}.png`;

    return new Promise((resolve) => {
        textureLoader.load(
            textureUrl,
            (texture) => {
                texture.magFilter = THREE.NearestFilter;
                texture.minFilter = THREE.NearestFilter;
                const mat = new THREE.MeshLambertMaterial({ map: texture, transparent: true, opacity: baseName.includes('glass') ? 0.8 : 1.0 });
                materialCache[baseName] = mat;
                resolve(mat);
            },
            undefined,
            () => {
                const fallback = new THREE.MeshLambertMaterial({ color: 0x808080 });
                materialCache[baseName] = fallback;
                resolve(fallback);
            }
        );
    });
}

async function getBlockGeometry(blockName) {
    const baseName = blockName.replace('minecraft:', '').replace('block/', '').replace(/\[.*\]/, '');
    if (modelGeometryCache[baseName]) return modelGeometryCache[baseName];

    // If it's a glass pane or complex shape, give it a clean thin/standard profile to prevent stretching
    if (baseName.includes('glass_pane') || baseName.includes('iron_bars')) {
        const geom = new THREE.BoxGeometry(0.125, 1, 0.125);
        modelGeometryCache[baseName] = geom;
        return geom;
    }

    let currentName = baseName;
    let modelData = null;

    for (let i = 0; i < 5; i++) {
        modelData = await fetchBlockModel(currentName);
        if (modelData && modelData.elements) break;
        if (modelData && modelData.parent) {
            currentName = modelData.parent.replace('minecraft:', '').replace('block/', '');
        } else {
            break;
        }
    }

    if (!modelData || !modelData.elements || modelData.elements.length === 0 || baseName.includes('stairs')) {
        modelGeometryCache[baseName] = cubeGeometry;
        return cubeGeometry;
    }

    const el = modelData.elements[0];
    const from = el.from || [0, 0, 0];
    const to = el.to || [16, 16, 16];

    const width = (to[0] - from[0]) / 16;
    const height = (to[1] - from[1]) / 16;
    const depth = (to[2] - from[2]) / 16;

    const geom = new THREE.BoxGeometry(width, height, depth);
    const posX = ((from[0] + to[0]) / 2 / 16) - 0.5;
    const posY = ((from[1] + to[1]) / 2 / 16) - 0.5;
    const posZ = ((from[2] + to[2]) / 2 / 16) - 0.5;

    geom.translate(posX, posY, posZ);
    modelGeometryCache[baseName] = geom;
    return geom;
}

function isOpaqueBlock(blockName) {
    const clean = blockName.replace('minecraft:', '').replace(/\[.*\]/, '');
    if (clean.includes('air') || clean.includes('glass') || clean.includes('leaves') || clean.includes('ice') || clean.includes('water')) {
        return false;
    }
    return true;
}

async function renderStructure(rootData) {
    const size = rootData.size || [16, 16, 16];
    const blocks = rootData.blocks || [];
    const palette = rootData.palette || [];
    
    const sizeX = Number(size[0]);
    const sizeY = Number(size[1]);
    const sizeZ = Number(size[2]);

    // Map positions to their block names for transparent-aware culling
    const blockGrid = new Map();
    for (const block of blocks) {
        let name = 'minecraft:stone';
        if (block.state !== undefined && palette[block.state]) {
            name = palette[block.state].Name || 'minecraft:stone';
        }
        blockGrid.set(`${block.pos[0]},${block.pos[1]},${block.pos[2]}`, name);
    }

    const CHUNK_SIZE = 16;
    const groups = {};

    for (const block of blocks) {
        let fullBlockName = blockGrid.get(`${block.pos[0]},${block.pos[1]},${block.pos[2]}`);
        if (palette[block.state] && palette[block.state].Properties) {
            const props = palette[block.state].Properties;
            const propPairs = Object.entries(props).map(([k, v]) => `${k}=${v}`).join(',');
            if (propPairs) fullBlockName += `[${propPairs}]`;
        }

        const cleanCheck = fullBlockName.replace('minecraft:', '').replace(/\[.*\]/, '');
        if (cleanCheck === 'air' || cleanCheck === 'cave_air' || cleanCheck === 'void_air') {
            continue;
        }

        const [x, y, z] = block.pos;
        const neighbors = [
            `${x+1},${y},${z}`, `${x-1},${y},${z}`,
            `${x},${y+1},${z}`, `${x},${y-1},${z}`,
            `${x},${y},${z+1}`, `${x},${y},${z-1}`
        ];

        // Only hide if surrounded by strictly OPAQUE blocks
        const isHidden = neighbors.every(pos => {
            const neighborName = blockGrid.get(pos);
            return neighborName && isOpaqueBlock(neighborName);
        });

        if (isHidden) continue;

        const cX = Math.floor(x / CHUNK_SIZE);
        const cY = Math.floor(y / CHUNK_SIZE);
        const cZ = Math.floor(z / CHUNK_SIZE);

        const groupKey = `${cX},${cY},${cZ}_${fullBlockName}`;
        if (!groups[groupKey]) {
            groups[groupKey] = {
                blockName: fullBlockName,
                positions: []
            };
        }
        groups[groupKey].positions.push(block.pos);
    }

    const structureGroup = new THREE.Group();
    const dummy = new THREE.Object3D();

    for (const groupData of Object.values(groups)) {
        const material = await getBlockMaterial(groupData.blockName);
        const geometry = await getBlockGeometry(groupData.blockName);
        const count = groupData.positions.length;
        const instancedMesh = new THREE.InstancedMesh(geometry, material, count);

        let rotationY = 0;
        if (groupData.blockName.includes('facing=south')) rotationY = Math.PI;
        else if (groupData.blockName.includes('facing=west')) rotationY = Math.PI / 2;
        else if (groupData.blockName.includes('facing=east')) rotationY = -Math.PI / 2;

        let i = 0;
        for (const pos of groupData.positions) {
            const x = Number(pos[0]) - sizeX / 2;
            const y = Number(pos[1]) - sizeY / 2;
            const z = Number(pos[2]) - sizeZ / 2;

            dummy.position.set(x, y, z);
            dummy.rotation.set(0, rotationY, 0);
            dummy.updateMatrix();

            instancedMesh.setMatrixAt(i, dummy.matrix);
            i++;
        }

        instancedMesh.instanceMatrix.needsUpdate = true;
        if (instancedMesh.geometry) {
            instancedMesh.geometry.computeBoundingSphere();
        }
        structureGroup.add(instancedMesh);
    }

    scene.add(structureGroup);
    const maxDim = Math.max(sizeX, sizeY, sizeZ);
    camera.position.set(maxDim * 1.5, maxDim * 1.5, maxDim * 1.5);
    controls.target.set(0, 0, 0);
    controls.update();
}

const urlParams = new URLSearchParams(window.location.search);
const nbtUrl = urlParams.get('file');

if (nbtUrl) {
    fetch(nbtUrl)
        .then(res => res.arrayBuffer())
        .then(async buffer => {
            const parsed = await NBT.read(buffer);
            renderStructure(parsed.data);
        })
        .catch(err => console.error('Error loading NBT:', err));
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