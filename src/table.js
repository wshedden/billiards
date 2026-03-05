import * as THREE from 'three';
import * as CANNON from 'cannon-es';
import {
  TABLE_LENGTH,
  TABLE_WIDTH,
  BALL_RADIUS,
  CUSHION_HEIGHT,
  CUSHION_THICKNESS,
  RAIL_HEIGHT,
  POCKET_RADIUS,
} from './constants.js';

export class TableSystem {
  constructor(physics) {
    this.physics = physics;
    this.group = new THREE.Group();
    this.group.name = 'table';
    this.pockets = this._createPocketCenters();
    this._buildVisuals();
    this._buildColliders();
  }

  _buildVisuals() {
    const clothTex = this._createClothTexture();
    clothTex.wrapS = clothTex.wrapT = THREE.RepeatWrapping;
    clothTex.repeat.set(6, 3);

    const cloth = new THREE.Mesh(
      new THREE.BoxGeometry(TABLE_LENGTH, 0.03, TABLE_WIDTH),
      new THREE.MeshStandardMaterial({
        color: 0x1d6b3f,
        roughness: 0.92,
        metalness: 0.03,
        map: clothTex,
      }),
    );
    cloth.receiveShadow = true;
    cloth.position.y = -0.015;
    this.group.add(cloth);

    const woodMaterial = new THREE.MeshStandardMaterial({ color: 0x3a1f12, roughness: 0.36, metalness: 0.18 });
    const railLongGeom = new THREE.BoxGeometry(TABLE_LENGTH + 0.2, RAIL_HEIGHT, CUSHION_THICKNESS);
    const railShortGeom = new THREE.BoxGeometry(CUSHION_THICKNESS, RAIL_HEIGHT, TABLE_WIDTH + 0.2);

    const z = TABLE_WIDTH / 2 + CUSHION_THICKNESS / 2;
    const x = TABLE_LENGTH / 2 + CUSHION_THICKNESS / 2;
    for (const sign of [-1, 1]) {
      const longRail = new THREE.Mesh(railLongGeom, woodMaterial);
      longRail.position.set(0, RAIL_HEIGHT / 2 - 0.005, sign * z);
      longRail.castShadow = true;
      this.group.add(longRail);

      const shortRail = new THREE.Mesh(railShortGeom, woodMaterial);
      shortRail.position.set(sign * x, RAIL_HEIGHT / 2 - 0.005, 0);
      shortRail.castShadow = true;
      this.group.add(shortRail);
    }
  }

  _buildColliders() {
    const floor = new CANNON.Body({ mass: 0, material: this.physics.materials.cloth });
    floor.addShape(new CANNON.Box(new CANNON.Vec3(TABLE_LENGTH / 2, 0.01, TABLE_WIDTH / 2)));
    floor.position.set(0, -0.01, 0);
    this.physics.addBody(floor);

    const halfL = TABLE_LENGTH / 2 - BALL_RADIUS * 0.2;
    const halfW = TABLE_WIDTH / 2 - BALL_RADIUS * 0.2;
    const railY = CUSHION_HEIGHT / 2;

    const rails = [
      { s: new CANNON.Vec3(halfL, CUSHION_HEIGHT / 2, CUSHION_THICKNESS / 2), p: new CANNON.Vec3(0, railY, halfW + CUSHION_THICKNESS / 2) },
      { s: new CANNON.Vec3(halfL, CUSHION_HEIGHT / 2, CUSHION_THICKNESS / 2), p: new CANNON.Vec3(0, railY, -halfW - CUSHION_THICKNESS / 2) },
      { s: new CANNON.Vec3(CUSHION_THICKNESS / 2, CUSHION_HEIGHT / 2, halfW), p: new CANNON.Vec3(halfL + CUSHION_THICKNESS / 2, railY, 0) },
      { s: new CANNON.Vec3(CUSHION_THICKNESS / 2, CUSHION_HEIGHT / 2, halfW), p: new CANNON.Vec3(-halfL - CUSHION_THICKNESS / 2, railY, 0) },
    ];

    rails.forEach((rail) => {
      const body = new CANNON.Body({ mass: 0, material: this.physics.materials.rail });
      body.addShape(new CANNON.Box(rail.s));
      body.position.copy(rail.p);
      this.physics.addBody(body);
    });
  }

  _createPocketCenters() {
    const x = TABLE_LENGTH / 2;
    const z = TABLE_WIDTH / 2;
    return [
      new THREE.Vector3(-x, 0, -z),
      new THREE.Vector3(-x, 0, z),
      new THREE.Vector3(x, 0, -z),
      new THREE.Vector3(x, 0, z),
      new THREE.Vector3(0, 0, -z),
      new THREE.Vector3(0, 0, z),
    ];
  }

  _createClothTexture() {
    const size = 256;
    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = size;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#1f7847';
    ctx.fillRect(0, 0, size, size);
    for (let i = 0; i < 3200; i += 1) {
      const a = Math.random() * 0.06;
      ctx.fillStyle = `rgba(255,255,255,${a.toFixed(3)})`;
      ctx.fillRect(Math.random() * size, Math.random() * size, 1, 1);
    }
    return new THREE.CanvasTexture(canvas);
  }

  isInPocket(pos) {
    return this.pockets.find((p) => p.distanceToSquared(pos) <= POCKET_RADIUS * POCKET_RADIUS);
  }
}
