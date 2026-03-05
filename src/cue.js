import * as THREE from 'three';
import * as CANNON from 'cannon-es';
import { BALL_RADIUS } from './constants.js';

export class CueSystem {
  constructor(camera, domElement, cueBall) {
    this.camera = camera;
    this.domElement = domElement;
    this.cueBall = cueBall;
    this.aimAngle = 0;
    this.shotPower = 0;
    this.maxPower = 1;
    this.powerMultiplier = 3.8;
    this.spin = new THREE.Vector2(0, 0);

    this.group = new THREE.Group();
    this.cueMesh = this._createCueMesh();
    this.group.add(this.cueMesh);
    this.raycaster = new THREE.Raycaster();
    this.tablePlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), -BALL_RADIUS);
    this.tmp = new THREE.Vector3();
  }

  _createCueMesh() {
    const geom = new THREE.CylinderGeometry(0.006, 0.014, 1.25, 18);
    const mat = new THREE.MeshStandardMaterial({ color: 0xc6a266, roughness: 0.45, metalness: 0.05 });
    const cue = new THREE.Mesh(geom, mat);
    cue.castShadow = true;
    cue.rotation.z = Math.PI / 2;
    return cue;
  }

  updateAim(mouseNdc) {
    this.raycaster.setFromCamera(mouseNdc, this.camera);
    if (!this.raycaster.ray.intersectPlane(this.tablePlane, this.tmp)) return;

    const cuePos = this.cueBall.body.position;
    const dx = this.tmp.x - cuePos.x;
    const dz = this.tmp.z - cuePos.z;
    this.aimAngle = Math.atan2(dz, dx);
  }

  setPowerFromDrag(start, current) {
    const dx = current.x - start.x;
    const dy = current.y - start.y;
    const pull = Math.max(0, -Math.cos(this.aimAngle) * dx - Math.sin(this.aimAngle) * dy);
    this.shotPower = THREE.MathUtils.clamp(pull / 220, 0, this.maxPower);
  }

  shoot() {
    const dir = new CANNON.Vec3(Math.cos(this.aimAngle), 0, Math.sin(this.aimAngle));
    const impulse = dir.scale(this.shotPower * this.powerMultiplier);
    this.cueBall.body.applyImpulse(impulse, this.cueBall.body.position);

    const spinStrength = 24;
    const av = this.cueBall.body.angularVelocity;
    av.x += -this.spin.y * spinStrength;
    av.z += this.spin.x * spinStrength;

    this.shotPower = 0;
  }

  updateMeshVisibility(visible) {
    this.group.visible = visible;
  }

  updateMeshTransform() {
    const cuePos = this.cueBall.body.position;
    const distance = 0.65 + this.shotPower * 0.35;
    this.group.position.set(cuePos.x, BALL_RADIUS * 1.05, cuePos.z);
    this.group.rotation.y = -this.aimAngle + Math.PI / 2;
    this.cueMesh.position.set(-distance, 0, 0);
  }

  bindSpinUI(canvas, readout) {
    const ctx = canvas.getContext('2d');
    const draw = () => {
      const w = canvas.width;
      const h = canvas.height;
      const r = w * 0.42;
      const cx = w / 2;
      const cy = h / 2;
      ctx.clearRect(0, 0, w, h);
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#777';
      ctx.lineWidth = 2;
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(cx - r, cy);
      ctx.lineTo(cx + r, cy);
      ctx.moveTo(cx, cy - r);
      ctx.lineTo(cx, cy + r);
      ctx.strokeStyle = '#c0c0c0';
      ctx.lineWidth = 1;
      ctx.stroke();

      const px = cx + this.spin.x * r;
      const py = cy - this.spin.y * r;
      ctx.fillStyle = '#df3434';
      ctx.beginPath();
      ctx.arc(px, py, 6, 0, Math.PI * 2);
      ctx.fill();
      readout.textContent = `x: ${this.spin.x.toFixed(2)} · y: ${this.spin.y.toFixed(2)}`;
    };

    const updateFromEvent = (event) => {
      const rect = canvas.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;
      const cx = canvas.width / 2;
      const cy = canvas.height / 2;
      const r = canvas.width * 0.42;
      let nx = (x - cx) / r;
      let ny = -(y - cy) / r;
      const len = Math.hypot(nx, ny);
      if (len > 1) {
        nx /= len;
        ny /= len;
      }
      this.spin.set(nx, ny);
      draw();
    };

    let drag = false;
    canvas.addEventListener('mousedown', (e) => {
      drag = true;
      updateFromEvent(e);
    });
    window.addEventListener('mousemove', (e) => {
      if (!drag) return;
      updateFromEvent(e);
    });
    window.addEventListener('mouseup', () => {
      drag = false;
    });
    canvas.addEventListener('dblclick', () => {
      this.spin.set(0, 0);
      draw();
    });
    draw();
  }
}
