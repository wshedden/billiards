import * as CANNON from 'cannon-es';
import { RendererSystem } from './renderer.js';
import { PhysicsSystem } from './physics.js';
import { createTableGroup, getPocketPositions, TABLE_LENGTH, TABLE_WIDTH, RAIL_HEIGHT, BALL_RADIUS, POCKET_RADIUS } from './table.js';
import { BallManager } from './balls.js';
import { InputSystem } from './input.js';
import { CueSystem } from './cue.js';

export class Game {
  constructor({ appRoot, hudState, powerLabel, spinCanvas, spinLabel }) {
    this.renderer = new RendererSystem(appRoot);
    this.physics = new PhysicsSystem();
    this.ballManager = new BallManager(this.physics, this.renderer.scene);
    this.state = 'AIMING';
    this.lastTime = performance.now();

    this.hudState = hudState;
    this.powerLabel = powerLabel;

    this.setupTable();
    this.ballManager.createBalls();

    this.input = new InputSystem(this.renderer.renderer.domElement);
    this.cue = new CueSystem(this.input, this.ballManager.cueBall, { canvas: spinCanvas, label: spinLabel });
    this.renderer.add(this.cue.mesh);

    this.pockets = getPocketPositions();
    this.setState('AIMING');
  }

  setupTable() {
    const tableGroup = createTableGroup();
    this.renderer.add(tableGroup);

    this.physics.addBody(this.physics.createStaticPlane(0), false);

    const halfL = TABLE_LENGTH / 2;
    const halfW = TABLE_WIDTH / 2;
    const gap = 0.17;
    const thickness = 0.05;
    const depth = BALL_RADIUS * 2;

    const railSegments = [
      [-halfL + gap, -halfW, halfL - gap, -halfW],
      [-halfL + gap, halfW, halfL - gap, halfW],
      [-halfL, -halfW + gap, -halfL, halfW - gap],
      [halfL, -halfW + gap, halfL, halfW - gap],
    ];

    railSegments.forEach(([x1, z1, x2, z2]) => {
      const len = Math.hypot(x2 - x1, z2 - z1);
      const body = new CANNON.Body({ mass: 0, material: this.physics.railMaterial });
      body.addShape(new CANNON.Box(new CANNON.Vec3(len / 2, RAIL_HEIGHT, thickness / 2)));
      body.position.set((x1 + x2) / 2, depth, (z1 + z2) / 2);
      body.quaternion.setFromEuler(0, Math.atan2(z2 - z1, x2 - x1), 0);
      this.physics.addBody(body);
    });
  }

  setState(nextState) {
    this.state = nextState;
    this.hudState.textContent = `State: ${nextState.replace('_', ' ')}`;
  }

  update(delta) {
    if (this.state === 'AIMING') {
      this.cue.updateAiming();
      this.powerLabel.textContent = `Power: ${Math.round((this.cue.power / this.cue.maxPower) * 100)}%`;

      if (!this.input.pointer.down && this.cue.power > 0.02) {
        this.cue.executeShot();
        this.setState('BALLS_MOVING');
      }
    }

    this.physics.step(delta);
    this.ballManager.syncMeshes();
    this.detectPockets();

    if (this.state === 'BALLS_MOVING' && this.ballManager.allStopped()) {
      this.setState('AIMING');
    }

    this.cue.mesh.visible = this.state === 'AIMING';
  }

  detectPockets() {
    for (const ball of this.ballManager.balls) {
      if (ball.pocketed) continue;
      for (let i = 0; i < this.pockets.length; i += 1) {
        const p = this.pockets[i];
        const dx = ball.body.position.x - p.x;
        const dz = ball.body.position.z - p.z;
        const dist = Math.hypot(dx, dz);
        if (dist < POCKET_RADIUS) {
          this.ballManager.pocketBall(ball, i);
          break;
        }
      }
    }
  }

  animate = () => {
    const now = performance.now();
    const delta = Math.min(0.05, (now - this.lastTime) / 1000);
    this.lastTime = now;

    this.update(delta);
    this.renderer.render();
    requestAnimationFrame(this.animate);
  };

  start() {
    this.lastTime = performance.now();
    this.animate();
  }

  simulateShotCandidate({ angle, power, spinX = 0, spinY = 0, steps = 240 }) {
    const bodies = this.ballManager.getActiveBodies();
    const snapshot = this.physics.captureState(bodies);

    const cueBody = this.ballManager.cueBall.body;
    cueBody.applyImpulse(new CANNON.Vec3(Math.cos(angle) * power, 0, Math.sin(angle) * power), cueBody.position);
    cueBody.angularVelocity.x += -spinY * 42;
    cueBody.angularVelocity.z += spinX * 42;

    for (let i = 0; i < steps; i += 1) this.physics.step(this.physics.fixedTimeStep);

    const result = {
      positions: bodies.map((body) => body.position.clone()),
      pocketed: [...this.ballManager.pocketed],
    };

    this.physics.restoreState(bodies, snapshot);
    return result;
  }
}
