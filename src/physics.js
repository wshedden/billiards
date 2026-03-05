import * as CANNON from 'cannon-es';
import { FIXED_TIME_STEP, MAX_SUB_STEPS } from './constants.js';

export class PhysicsSystem {
  constructor() {
    this.world = new CANNON.World({
      gravity: new CANNON.Vec3(0, 0, 0),
      allowSleep: true,
    });
    this.world.broadphase = new CANNON.SAPBroadphase(this.world);
    this.world.solver.iterations = 12;
    this.world.defaultContactMaterial.friction = 0.15;
    this.world.defaultContactMaterial.restitution = 0.93;
    this.world.defaultContactMaterial.contactEquationRelaxation = 4;
    this.world.defaultContactMaterial.contactEquationStiffness = 1e7;
    this.lastTime = performance.now() / 1000;

    this.materials = {
      ball: new CANNON.Material('ball'),
      cloth: new CANNON.Material('cloth'),
      rail: new CANNON.Material('rail'),
    };

    this.world.addContactMaterial(
      new CANNON.ContactMaterial(this.materials.ball, this.materials.ball, {
        friction: 0.03,
        restitution: 0.95,
      }),
    );

    this.world.addContactMaterial(
      new CANNON.ContactMaterial(this.materials.ball, this.materials.cloth, {
        friction: 0.18,
        restitution: 0.03,
      }),
    );

    this.world.addContactMaterial(
      new CANNON.ContactMaterial(this.materials.ball, this.materials.rail, {
        friction: 0.1,
        restitution: 0.78,
      }),
    );
  }

  addBody(body) {
    this.world.addBody(body);
  }

  removeBody(body) {
    this.world.removeBody(body);
  }

  step() {
    const now = performance.now() / 1000;
    const dt = Math.min(1 / 30, now - this.lastTime);
    this.lastTime = now;
    this.world.step(FIXED_TIME_STEP, dt, MAX_SUB_STEPS);
  }

  applyImpulse(body, impulse, point = body.position) {
    body.applyImpulse(impulse, point);
  }

  snapshot(bodies) {
    return bodies.map((body) => ({
      id: body.id,
      position: body.position.clone(),
      quaternion: body.quaternion.clone(),
      velocity: body.velocity.clone(),
      angularVelocity: body.angularVelocity.clone(),
      sleepState: body.sleepState,
      isInWorld: this.world.bodies.includes(body),
    }));
  }

  restore(snapshot, bodyById) {
    snapshot.forEach((s) => {
      const body = bodyById(s.id);
      if (!body) return;
      body.position.copy(s.position);
      body.quaternion.copy(s.quaternion);
      body.velocity.copy(s.velocity);
      body.angularVelocity.copy(s.angularVelocity);
      if (s.sleepState) {
        body.sleepState = s.sleepState;
      }
      body.wakeUp();
    });
  }
}
