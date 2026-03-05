import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

export class RendererSystem {
  constructor(container) {
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x101010);

    this.camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.01, 50);
    this.camera.position.set(0, 2.3, 2.2);

    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.0;
    container.appendChild(this.renderer.domElement);

    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enablePan = false;
    this.controls.maxDistance = 5;
    this.controls.minDistance = 1.5;
    this.controls.maxPolarAngle = Math.PI * 0.46;
    this.controls.target.set(0, 0, 0);
    this.controls.update();

    this._setupLighting();
    this._setupEnvironment();

    window.addEventListener('resize', () => this.onResize());
  }

  _setupLighting() {
    const ambient = new THREE.AmbientLight(0xffffff, 0.3);
    this.scene.add(ambient);

    const spot = new THREE.SpotLight(0xfff6dc, 3.2, 10, Math.PI * 0.35, 0.35, 1);
    spot.position.set(0, 2.6, 0);
    spot.castShadow = true;
    spot.shadow.mapSize.set(2048, 2048);
    spot.shadow.bias = -0.00008;
    spot.target.position.set(0, 0, 0);
    this.scene.add(spot);
    this.scene.add(spot.target);
  }

  _setupEnvironment() {
    const hemi = new THREE.HemisphereLight(0x8fb9ff, 0x302820, 0.28);
    this.scene.add(hemi);
  }

  add(object3d) {
    this.scene.add(object3d);
  }

  render() {
    this.controls.update();
    this.renderer.render(this.scene, this.camera);
  }

  onResize() {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  }
}
