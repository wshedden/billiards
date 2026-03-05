import * as THREE from 'three';
import { RendererSystem } from './renderer.js';
import { PhysicsSystem } from './physics.js';
import { TableSystem } from './table.js';
import { BallsSystem } from './balls.js';
import { CueSystem } from './cue.js';
import { InputSystem } from './input.js';
import { BALL_STOP_THRESHOLD, STATE } from './constants.js';

export class PoolGame {
  constructor(container) {
    this.rendererSystem = new RendererSystem(container);
    this.physicsSystem = new PhysicsSystem();
    this.tableSystem = new TableSystem(this.physicsSystem);
    this.ballsSystem = new BallsSystem(this.physicsSystem);
    this.cueSystem = new CueSystem(
      this.rendererSystem.camera,
      this.rendererSystem.renderer.domElement,
      this.ballsSystem.cueBall,
    );
    this.inputSystem = new InputSystem(this.rendererSystem.renderer.domElement);

    this.state = STATE.AIMING;
    this.pocketEvents = [];

    this.rendererSystem.add(this.tableSystem.group);
    this.rendererSystem.add(this.ballsSystem.group);
    this.rendererSystem.add(this.cueSystem.group);

    this._wireInput();
    this._wireSpinUI();
    this._updateStatePill();
  }

  _wireInput() {
    this.inputSystem.onAimMove = (mouse) => {
      if (this.state === STATE.BALLS_MOVING) return;
      this.cueSystem.updateAim(mouse);
    };

    this.inputSystem.onChargeStart = () => {
      if (this.state !== STATE.AIMING) return;
      this.state = STATE.CHARGING;
      this._updateStatePill();
    };

    this.inputSystem.onChargeMove = (start, current) => {
      if (this.state !== STATE.CHARGING) return;
      this.cueSystem.setPowerFromDrag(start, current);
    };

    this.inputSystem.onShoot = () => {
      if (this.state !== STATE.CHARGING) return;
      this.cueSystem.shoot();
      this.state = STATE.BALLS_MOVING;
      this._updateStatePill();
    };
  }

  _wireSpinUI() {
    const spinCanvas = document.getElementById('spin-canvas');
    const readout = document.getElementById('spin-readout');
    this.cueSystem.bindSpinUI(spinCanvas, readout);
  }

  _updateStatePill() {
    const text = {
      [STATE.AIMING]: 'Aiming',
      [STATE.CHARGING]: 'Charging Shot',
      [STATE.BALLS_MOVING]: 'Balls Moving',
    }[this.state];
    document.getElementById('state-pill').textContent = `State: ${text}`;
  }

  checkPockets() {
    this.ballsSystem.balls.forEach((ball) => {
      if (ball.pocketed) return;
      const p = ball.body.position;
      const pos = new THREE.Vector3(p.x, p.y, p.z);
      const pocket = this.tableSystem.isInPocket(pos);
      if (pocket) {
        this.ballsSystem.pocketBall(ball, pocket);
        this.pocketEvents.push({ ball: ball.number, pocket, time: performance.now() / 1000 });
      }
    });
  }

  tick() {
    this.physicsSystem.step();

    this.ballsSystem.balls.forEach((ball) => {
      if (ball.pocketed) return;
      ball.body.velocity.scale(0.994, ball.body.velocity);
      ball.body.angularVelocity.scale(0.985, ball.body.angularVelocity);
    });

    this.checkPockets();
    this.ballsSystem.syncMeshes();

    if (this.state === STATE.BALLS_MOVING && this.ballsSystem.allStopped(BALL_STOP_THRESHOLD)) {
      this.state = STATE.AIMING;
      this._updateStatePill();
    }

    this.cueSystem.updateMeshVisibility(this.state !== STATE.BALLS_MOVING && !this.ballsSystem.cueBall.pocketed);
    this.cueSystem.updateMeshTransform();

    this.rendererSystem.render();
    requestAnimationFrame(() => this.tick());
  }

  getSimulationSnapshot() {
    return {
      physics: this.physicsSystem.snapshot(this.ballsSystem.balls.map((ball) => ball.body)),
      pocketed: this.ballsSystem.balls.map((ball) => ({ number: ball.number, pocketed: ball.pocketed })),
    };
  }

  restoreSimulationSnapshot(snapshot) {
    this.physicsSystem.restore(snapshot.physics, (id) => this.ballsSystem.bodyById(id));
    snapshot.pocketed.forEach((state) => {
      const ball = this.ballsSystem.balls.find((b) => b.number === state.number);
      if (ball) ball.pocketed = state.pocketed;
    });
  }
}
