import * as CANNON from 'cannon-es';

export class PhysicsSystem {
  constructor() {
    this.world = new CANNON.World({ gravity: new CANNON.Vec3(0, 0, 0) });
    this.world.broadphase = new CANNON.SAPBroadphase(this.world);
    this.world.allowSleep = true;

    this.fixedTimeStep = 1 / 60;
    this.maxSubSteps = 5;

    this.ballMaterial = new CANNON.Material('ball');
    this.railMaterial = new CANNON.Material('rail');
    this.clothMaterial = new CANNON.Material('cloth');

    this.world.defaultContactMaterial.friction = 0.03;
    this.world.defaultContactMaterial.restitution = 0.94;

    this.world.addContactMaterial(
      new CANNON.ContactMaterial(this.ballMaterial, this.ballMaterial, {
        restitution: 0.95,
        friction: 0.02,
      }),
    );
    this.world.addContactMaterial(
      new CANNON.ContactMaterial(this.ballMaterial, this.railMaterial, {
        restitution: 0.78,
        friction: 0.06,
      }),
    );
    this.world.addContactMaterial(
      new CANNON.ContactMaterial(this.ballMaterial, this.clothMaterial, {
        restitution: 0.02,
        friction: 0.12,
      }),
    );

    this.dynamicBodies = [];
  }

  addBody(body, dynamic = false) {
    this.world.addBody(body);
    if (dynamic) this.dynamicBodies.push(body);
  }

  step(delta) {
    this.world.step(this.fixedTimeStep, delta, this.maxSubSteps);

    // Approximate rolling/sliding resistance and spin damping.
    for (const body of this.dynamicBodies) {
      if (body.sleepState === CANNON.Body.SLEEPING) continue;
      body.velocity.scale(0.992, body.velocity);
      body.angularVelocity.scale(0.985, body.angularVelocity);

      if (body.velocity.lengthSquared() < 0.00006) {
        body.velocity.set(0, 0, 0);
      }
      if (body.angularVelocity.lengthSquared() < 0.00008) {
        body.angularVelocity.set(0, 0, 0);
      }
    }
  }

  createStaticPlane(y = 0) {
    const plane = new CANNON.Body({ mass: 0, material: this.clothMaterial, shape: new CANNON.Plane() });
    plane.quaternion.setFromEuler(-Math.PI / 2, 0, 0);
    plane.position.set(0, y, 0);
    return plane;
  }

  captureState(bodies) {
    return bodies.map((body) => ({
      id: body.id,
      position: body.position.clone(),
      quaternion: body.quaternion.clone(),
      velocity: body.velocity.clone(),
      angularVelocity: body.angularVelocity.clone(),
      sleepState: body.sleepState,
      type: body.type,
    }));
  }

  restoreState(bodies, snapshot) {
    const byId = new Map(snapshot.map((s) => [s.id, s]));
    bodies.forEach((body) => {
      const state = byId.get(body.id);
      if (!state) return;
      body.position.copy(state.position);
      body.quaternion.copy(state.quaternion);
      body.velocity.copy(state.velocity);
      body.angularVelocity.copy(state.angularVelocity);
      body.sleepState = state.sleepState;
      body.wakeUp();
    });
  }
}
