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
camera.position.set(25, 10, -12.5);

const renderer = new THREE.WebGLRenderer({
  antialias: true,
  alpha: true
});

renderer.setSize(container.clientWidth, container.clientHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

// Color management similaire à Blender
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.AgXToneMapping;
renderer.toneMappingExposure = 1.0;
container.appendChild(renderer.domElement);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;

// lights (color, intensity)
const ambientLight = new THREE.AmbientLight(
  0xffffff,
  0.35
);

scene.add(ambientLight);


const hemiLight = new THREE.HemisphereLight(
  0xdedeFF,
  0x0e0e0e,
  .5
);

scene.add(hemiLight);


const dirLight = new THREE.DirectionalLight(
  0xffffff,
  2.5
);

dirLight.position.set(10, 20, -15);

dirLight.castShadow = true;

dirLight.shadow.mapSize.set(2048, 2048);

dirLight.shadow.camera.near = 0.1;
dirLight.shadow.camera.far = 100;

dirLight.shadow.camera.left = -30;
dirLight.shadow.camera.right = 30;
dirLight.shadow.camera.top = 30;
dirLight.shadow.camera.bottom = -30;

dirLight.shadow.radius = 3;

scene.add(dirLight);

// light helpers
const hemiLightHelper = new THREE.HemisphereLightHelper(hemiLight, 5);
scene.add(hemiLightHelper);

const dirLightHelper = new THREE.DirectionalLightHelper(dirLight, 2);
scene.add(dirLightHelper);

// glb loader
let model;
const loader = new GLTFLoader();

loader.load(
  "./models/mam_v2_0_3.glb",
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

    // Les animations du GLB
    console.log("Animations :", gltf.animations);

    gltf.animations.forEach((animation) => {
      console.log("Nom :", animation.name);
      console.log("Durée :", animation.duration);
      console.log("Tracks :", animation.tracks);
    });
  },

  (progress) => {
    console.log(
      `${(progress.loaded / progress.total * 100).toFixed(1)}%`
    );
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