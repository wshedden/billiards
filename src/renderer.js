import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

export class RendererSystem {
  constructor(container) {
    this.container = container;
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x111111);

    this.camera = new THREE.PerspectiveCamera(52, window.innerWidth / window.innerHeight, 0.01, 100);
    this.camera.position.set(0, 2.6, 2.2);

    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(this.renderer.domElement);

    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enablePan = false;
    this.controls.target.set(0, 0, 0);
    this.controls.maxPolarAngle = Math.PI * 0.45;
    this.controls.minDistance = 1.2;
    this.controls.maxDistance = 4.2;

    this.setupLighting();

    window.addEventListener('resize', () => this.onResize());
  }

  setupLighting() {
    const ambient = new THREE.AmbientLight(0xffffff, 0.24);
    this.scene.add(ambient);

    const spot = new THREE.SpotLight(0xfff2d2, 1.9, 10, Math.PI / 4, 0.4, 1.1);
    spot.position.set(0, 3.5, 0);
    spot.target.position.set(0, 0, 0);
    spot.castShadow = true;
    spot.shadow.mapSize.set(2048, 2048);
    spot.shadow.bias = -0.00007;
    this.scene.add(spot);
    this.scene.add(spot.target);
  }

  add(...objects) {
    this.scene.add(...objects);
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
