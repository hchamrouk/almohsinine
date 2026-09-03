import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";


const container = document.getElementById("canvas");


const scene = new THREE.Scene();

const camera = new THREE.PerspectiveCamera(
  50,
  container.clientWidth / container.clientHeight,
  0.1,
  1000
);
camera.position.set(-10, 10, -12.5);

const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.VSMShadowMap;
renderer.setSize(container.clientWidth, container.clientHeight);
renderer.setPixelRatio(window.devicePixelRatio);
container.appendChild(renderer.domElement);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;

// lights (color, intensity)
const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
scene.add(ambientLight);

const dirLight = new THREE.DirectionalLight(0xfff4e0, 10);
dirLight.position.set(-10, 10, -12.5);
dirLight.castShadow = true;

dirLight.shadow.mapSize.set(2048, 2048);
dirLight.shadow.camera.near = .1;
dirLight.shadow.camera.far = 25;
dirLight.shadow.camera.left = -10;
dirLight.shadow.camera.right = 10;
dirLight.shadow.camera.top = 10;
dirLight.shadow.camera.bottom = -10;
dirLight.shadow.radius = 2;
scene.add(dirLight);

const hemiLight = new THREE.HemisphereLight(
  0xf5f0e6, // drop-shadow
  0xc9b896, // self-shadow
  1.5       // intensity     
);
hemiLight.position.set(0, 20, 0);

scene.add(hemiLight);

// light helpers
const hemiLightHelper = new THREE.HemisphereLightHelper(hemiLight, 5);
scene.add(hemiLightHelper);

const dirLightHelper = new THREE.DirectionalLightHelper(dirLight, 2);
scene.add(dirLightHelper);

// glb loader
let model;
const loader = new GLTFLoader();

loader.load(
  "./models/mam_v1_3.glb",
  (gltf) => {
    model = gltf.scene;
    model.traverse((child) => {
      if (child.isMesh) {
        child.castShadow = true;
        child.receiveShadow = true;
      }
    });
    model.scale.set(.5, .5, .5);

    const box = new THREE.Box3().setFromObject(model);
    const center = box.getCenter(new THREE.Vector3());
    const size = box.getSize(new THREE.Vector3());
    model.position.sub(center);

    const maxDim = Math.max(size.x, size.y, size.z);
    const margin = maxDim * 0.6;
    dirLight.shadow.camera.left = -margin;
    dirLight.shadow.camera.right = margin;
    dirLight.shadow.camera.top = margin;
    dirLight.shadow.camera.bottom = -margin;
    dirLight.shadow.camera.near = 0.1;
    dirLight.shadow.camera.far = maxDim * 4;
    dirLight.shadow.camera.updateProjectionMatrix();

    scene.add(model);
  },
  (error) => {
    console.error("Erreur de chargement du modèle GLB :", error);
  }
);

function animate() {
  requestAnimationFrame(animate);
  if (model) {
    // model.rotation.y += 0.005;
  }
  controls.update();
  renderer.render(scene, camera);
}
animate();

window.addEventListener("resize", () => {
  camera.aspect = container.clientWidth / container.clientHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(container.clientWidth, container.clientHeight);
});