import * as THREE from 'three';
import { BALL_RADIUS } from './table.js';

export class CueSystem {
  constructor(input, cueBall, spinUI) {
    this.input = input;
    this.cueBall = cueBall;
    this.aimAngle = 0;
    this.maxPower = 5.2;
    this.power = 0;
    this.dragScale = 0.015;
    this.spin = { x: 0, y: 0 };

    this.mesh = this.createCueMesh();
    this.attachSpinUI(spinUI);
  }

  createCueMesh() {
    const cue = new THREE.Mesh(
      new THREE.CylinderGeometry(0.008, 0.015, 1.35, 14),
      new THREE.MeshStandardMaterial({ color: 0xd3a66f, roughness: 0.35, metalness: 0.07 }),
    );
    cue.castShadow = true;
    cue.receiveShadow = true;
    cue.rotation.z = Math.PI / 2;
    return cue;
  }

  updateAiming() {
    this.aimAngle += this.input.drag.dx * 0.00022;
    const pull = Math.max(0, this.input.drag.dy);
    this.power = Math.min(this.maxPower, pull * this.dragScale);
    this.updateCueMesh();
  }

  updateCueMesh() {
    const cueBallPos = this.cueBall.body.position;
    const dir = new THREE.Vector3(Math.cos(this.aimAngle), 0, Math.sin(this.aimAngle));
    const distanceBehind = 0.4 + this.power * 0.06;

    this.mesh.position.set(
      cueBallPos.x - dir.x * distanceBehind,
      cueBallPos.y + 0.014,
      cueBallPos.z - dir.z * distanceBehind,
    );
    this.mesh.rotation.y = -this.aimAngle + Math.PI / 2;
  }

  executeShot() {
    const dir = new THREE.Vector3(Math.cos(this.aimAngle), 0, Math.sin(this.aimAngle));
    const impulseMag = this.power;
    const impulse = dir.multiplyScalar(impulseMag);
    this.cueBall.body.applyImpulse({ x: impulse.x, y: 0, z: impulse.z }, this.cueBall.body.position);

    const spinScale = 42;
    this.cueBall.body.angularVelocity.x += -this.spin.y * spinScale;
    this.cueBall.body.angularVelocity.z += this.spin.x * spinScale;

    // Couple topspin/backspin to slight longitudinal effect.
    const followFactor = this.spin.y * 0.35;
    this.cueBall.body.velocity.x += Math.cos(this.aimAngle) * followFactor;
    this.cueBall.body.velocity.z += Math.sin(this.aimAngle) * followFactor;

    this.power = 0;
    this.updateCueMesh();
  }

  attachSpinUI({ canvas, label }) {
    const ctx = canvas.getContext('2d');
    const draw = () => {
      const r = canvas.width / 2;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = '#f2f2f2';
      ctx.beginPath();
      ctx.arc(r, r, r - 8, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = '#555';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(r, 12);
      ctx.lineTo(r, canvas.height - 12);
      ctx.moveTo(12, r);
      ctx.lineTo(canvas.width - 12, r);
      ctx.stroke();

      const px = r + this.spin.x * (r - 20);
      const py = r + this.spin.y * (r - 20);
      ctx.fillStyle = '#d64040';
      ctx.beginPath();
      ctx.arc(px, py, 11, 0, Math.PI * 2);
      ctx.fill();
    };

    const setSpinFromEvent = (event) => {
      const rect = canvas.getBoundingClientRect();
      const x = ((event.clientX - rect.left) / rect.width) * canvas.width;
      const y = ((event.clientY - rect.top) / rect.height) * canvas.height;
      const r = canvas.width / 2;
      let sx = (x - r) / (r - 20);
      let sy = (y - r) / (r - 20);
      const len = Math.hypot(sx, sy);
      if (len > 1) {
        sx /= len;
        sy /= len;
      }
      this.spin.x = sx;
      this.spin.y = sy;
      label.textContent = `Spin: x ${sx.toFixed(2)}, y ${(-sy).toFixed(2)}`;
      draw();
    };

    canvas.addEventListener('pointerdown', setSpinFromEvent);
    canvas.addEventListener('pointermove', (event) => {
      if (event.buttons === 1) setSpinFromEvent(event);
    });

    draw();
  }
}
