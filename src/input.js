import * as THREE from 'three';

export class InputSystem {
  constructor(domElement) {
    this.domElement = domElement;
    this.mouse = new THREE.Vector2();
    this.isPointerDown = false;
    this.dragStart = null;
    this.dragCurrent = null;

    this.onAimMove = null;
    this.onChargeStart = null;
    this.onChargeMove = null;
    this.onShoot = null;

    domElement.addEventListener('mousemove', (e) => this._onMouseMove(e));
    domElement.addEventListener('mousedown', (e) => this._onMouseDown(e));
    domElement.addEventListener('mouseup', (e) => this._onMouseUp(e));
    domElement.addEventListener('mouseleave', (e) => this._onMouseUp(e));
    domElement.addEventListener('contextmenu', (e) => e.preventDefault());
  }

  _toNormalized(event) {
    const rect = this.domElement.getBoundingClientRect();
    return {
      x: ((event.clientX - rect.left) / rect.width) * 2 - 1,
      y: -((event.clientY - rect.top) / rect.height) * 2 + 1,
    };
  }

  _onMouseMove(event) {
    const n = this._toNormalized(event);
    this.mouse.set(n.x, n.y);
    this.onAimMove?.(this.mouse);
    if (this.isPointerDown && this.dragStart) {
      this.dragCurrent = { x: event.clientX, y: event.clientY };
      this.onChargeMove?.(this.dragStart, this.dragCurrent);
    }
  }

  _onMouseDown(event) {
    if (event.button !== 0) return;
    this.isPointerDown = true;
    this.dragStart = { x: event.clientX, y: event.clientY };
    this.dragCurrent = this.dragStart;
    this.onChargeStart?.();
  }

  _onMouseUp(event) {
    if (!this.isPointerDown) return;
    this.isPointerDown = false;
    if (this.dragStart && this.dragCurrent) {
      this.onShoot?.(this.dragStart, this.dragCurrent);
    }
    this.dragStart = null;
    this.dragCurrent = null;
  }
}
