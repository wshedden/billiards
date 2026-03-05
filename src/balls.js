import * as THREE from 'three';
import * as CANNON from 'cannon-es';
import { BALL_MASS, BALL_RADIUS, TABLE_LENGTH } from './table.js';

const BALL_LAYOUT = [
  [1],
  [9, 2],
  [10, 8, 3],
  [11, 4, 12, 5],
  [13, 6, 14, 7, 15],
];

const BALL_COLORS = {
  1: '#f4ce42', 2: '#2a3778', 3: '#ca2424', 4: '#6f3995', 5: '#d9771a', 6: '#238548', 7: '#7a2a1d',
  8: '#111111', 9: '#f4ce42', 10: '#2a3778', 11: '#ca2424', 12: '#6f3995', 13: '#d9771a', 14: '#238548', 15: '#7a2a1d',
};

export class BallManager {
  constructor(physics, scene) {
    this.physics = physics;
    this.scene = scene;
    this.balls = [];
    this.pocketed = [];
  }

  createBalls() {
    this.createCueBall();
    this.createRack();
  }

  createCueBall() {
    const cue = this.createBall(0, '#f8f8f8', false);
    cue.body.position.set(-TABLE_LENGTH * 0.28, BALL_RADIUS, 0);
    this.cueBall = cue;
  }

  createRack() {
    const startX = TABLE_LENGTH * 0.25;
    const spacing = BALL_RADIUS * 2.02;

    BALL_LAYOUT.forEach((row, rowIndex) => {
      row.forEach((num, colIndex) => {
        const ball = this.createBall(num, BALL_COLORS[num], num > 8);
        const x = startX + rowIndex * spacing * 0.92;
        const z = (colIndex - rowIndex / 2) * spacing;
        ball.body.position.set(x, BALL_RADIUS, z);
      });
    });
  }

  createBall(number, color, striped) {
    const mesh = new THREE.Mesh(
      new THREE.SphereGeometry(BALL_RADIUS, 48, 32),
      new THREE.MeshPhysicalMaterial({
        map: createBallTexture(number, color, striped),
        roughness: 0.08,
        metalness: 0,
        clearcoat: 1,
        clearcoatRoughness: 0.04,
      }),
    );
    mesh.castShadow = true;
    mesh.receiveShadow = true;

    const body = new CANNON.Body({
      mass: BALL_MASS,
      material: this.physics.ballMaterial,
      shape: new CANNON.Sphere(BALL_RADIUS),
      linearDamping: 0.06,
      angularDamping: 0.08,
      allowSleep: true,
      sleepTimeLimit: 0.4,
      sleepSpeedLimit: 0.08,
    });

    const ball = { number, mesh, body, pocketed: false };
    this.scene.add(mesh);
    this.physics.addBody(body, true);
    this.balls.push(ball);
    return ball;
  }

  syncMeshes() {
    for (const ball of this.balls) {
      ball.mesh.position.copy(ball.body.position);
      ball.mesh.quaternion.copy(ball.body.quaternion);
    }
  }

  allStopped(threshold = 0.02) {
    return this.balls
      .filter((ball) => !ball.pocketed)
      .every((ball) => ball.body.velocity.length() < threshold && ball.body.angularVelocity.length() < threshold * 2);
  }

  getActiveBodies() {
    return this.balls.filter((ball) => !ball.pocketed).map((ball) => ball.body);
  }

  pocketBall(ball, pocketIndex) {
    if (ball.pocketed) return;
    ball.pocketed = true;
    this.pocketed.push({ number: ball.number, pocketIndex, time: performance.now() });
    ball.body.type = CANNON.Body.STATIC;
    ball.body.velocity.setZero();
    ball.body.angularVelocity.setZero();
    ball.body.position.set(0, -2 - this.pocketed.length * 0.1, 0);
    ball.mesh.position.copy(ball.body.position);
  }
}

function createBallTexture(number, color, striped) {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');

  ctx.fillStyle = '#f7f7f7';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  if (number === 0) {
    ctx.fillStyle = '#f7f7f7';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    return new THREE.CanvasTexture(canvas);
  }

  if (striped) {
    ctx.fillStyle = color;
    ctx.fillRect(0, canvas.height * 0.28, canvas.width, canvas.height * 0.44);
  } else {
    ctx.fillStyle = color;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }

  const circles = [canvas.width * 0.25, canvas.width * 0.75];
  circles.forEach((x) => {
    ctx.beginPath();
    ctx.arc(x, canvas.height / 2, 42, 0, Math.PI * 2);
    ctx.fillStyle = '#ffffff';
    ctx.fill();
    ctx.fillStyle = '#111';
    ctx.font = '700 38px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(String(number), x, canvas.height / 2 + 2);
  });

  return new THREE.CanvasTexture(canvas);
}
