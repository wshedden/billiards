import * as THREE from 'three';
import * as CANNON from 'cannon-es';
import { BALL_MASS, BALL_RADIUS, TABLE_LENGTH } from './constants.js';

const BALL_LAYOUT = [
  { number: 1, color: '#f4c430', stripe: false },
  { number: 9, color: '#f4c430', stripe: true },
  { number: 2, color: '#3167d6', stripe: false },
  { number: 10, color: '#3167d6', stripe: true },
  { number: 8, color: '#171717', stripe: false },
  { number: 3, color: '#cc2c26', stripe: false },
  { number: 11, color: '#cc2c26', stripe: true },
  { number: 4, color: '#5f2aa8', stripe: false },
  { number: 12, color: '#5f2aa8', stripe: true },
  { number: 5, color: '#f08b28', stripe: false },
  { number: 13, color: '#f08b28', stripe: true },
  { number: 6, color: '#2d8f2d', stripe: false },
  { number: 14, color: '#2d8f2d', stripe: true },
  { number: 7, color: '#6a1f10', stripe: false },
  { number: 15, color: '#6a1f10', stripe: true },
];

export class BallsSystem {
  constructor(physics) {
    this.physics = physics;
    this.group = new THREE.Group();
    this.balls = [];
    this.pocketed = [];
    this._createCueBall();
    this._rackObjectBalls();
  }

  _createCueBall() {
    const cueBall = this._createBall({ number: 0, color: '#f4f4f4', stripe: false }, new THREE.Vector3(-TABLE_LENGTH * 0.25, BALL_RADIUS, 0));
    cueBall.type = 'cue';
    this.cueBall = cueBall;
  }

  _rackObjectBalls() {
    const startX = TABLE_LENGTH * 0.2;
    let idx = 0;
    const rowSpacing = BALL_RADIUS * 2.04;
    const colSpacing = BALL_RADIUS * 2.1;
    for (let row = 0; row < 5; row += 1) {
      for (let col = 0; col <= row; col += 1) {
        const ballDef = BALL_LAYOUT[idx];
        const x = startX + row * rowSpacing;
        const z = (col - row / 2) * colSpacing;
        this._createBall(ballDef, new THREE.Vector3(x, BALL_RADIUS, z));
        idx += 1;
      }
    }
  }

  _createBall(def, position) {
    const geometry = new THREE.SphereGeometry(BALL_RADIUS, 48, 48);
    const texture = this._createBallTexture(def.number, def.color, def.stripe);
    const material = new THREE.MeshPhysicalMaterial({
      map: texture,
      roughness: 0.06,
      metalness: 0.02,
      clearcoat: 1,
      clearcoatRoughness: 0.02,
      envMapIntensity: 0.8,
    });
    const mesh = new THREE.Mesh(geometry, material);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    mesh.position.copy(position);

    const body = new CANNON.Body({
      mass: def.number === 0 ? BALL_MASS : BALL_MASS,
      shape: new CANNON.Sphere(BALL_RADIUS),
      material: this.physics.materials.ball,
      linearDamping: 0.24,
      angularDamping: 0.28,
      sleepSpeedLimit: 0.04,
      sleepTimeLimit: 0.5,
    });
    body.position.set(position.x, position.y, position.z);
    body.allowSleep = true;

    this.physics.addBody(body);
    this.group.add(mesh);

    const ball = { number: def.number, mesh, body, pocketed: false, type: def.number === 0 ? 'cue' : 'object' };
    this.balls.push(ball);
    return ball;
  }

  _createBallTexture(number, color, stripe) {
    const size = 512;
    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = size;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, size, size);

    if (stripe) {
      ctx.fillStyle = color;
      ctx.fillRect(0, size * 0.27, size, size * 0.46);
    } else {
      ctx.fillStyle = color;
      ctx.fillRect(0, 0, size, size);
    }

    if (number !== 0) {
      const cx = size / 2;
      const cy = size / 2;
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(cx, cy, size * 0.13, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#1b1b1b';
      ctx.font = `bold ${size * 0.12}px Arial`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(String(number), cx, cy + 2);
    }

    const tex = new THREE.CanvasTexture(canvas);
    tex.colorSpace = THREE.SRGBColorSpace;
    return tex;
  }

  syncMeshes() {
    this.balls.forEach((ball) => {
      if (ball.pocketed) return;
      ball.mesh.position.copy(ball.body.position);
      ball.mesh.quaternion.copy(ball.body.quaternion);
    });
  }

  allStopped(threshold) {
    return this.balls
      .filter((ball) => !ball.pocketed)
      .every((ball) => ball.body.velocity.length() < threshold && ball.body.angularVelocity.length() < threshold * 4);
  }

  pocketBall(ball, pocketCenter) {
    if (ball.pocketed) return;
    ball.pocketed = true;
    ball.body.velocity.setZero();
    ball.body.angularVelocity.setZero();
    this.physics.removeBody(ball.body);
    ball.mesh.position.set(pocketCenter.x, -0.35, pocketCenter.z);
    this.pocketed.push({ number: ball.number, at: performance.now() / 1000 });
  }

  bodyById(id) {
    return this.balls.find((ball) => ball.body.id === id)?.body;
  }
}
