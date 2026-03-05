export class InputSystem {
  constructor(domElement) {
    this.domElement = domElement;
    this.pointer = { x: 0, y: 0, down: false };
    this.drag = { active: false, startX: 0, startY: 0, dx: 0, dy: 0 };

    domElement.addEventListener('pointermove', (e) => this.onMove(e));
    domElement.addEventListener('pointerdown', (e) => this.onDown(e));
    window.addEventListener('pointerup', (e) => this.onUp(e));
  }

  onMove(event) {
    this.pointer.x = event.clientX;
    this.pointer.y = event.clientY;
    if (this.drag.active) {
      this.drag.dx = event.clientX - this.drag.startX;
      this.drag.dy = event.clientY - this.drag.startY;
    }
  }

  onDown(event) {
    this.pointer.down = true;
    this.drag.active = true;
    this.drag.startX = event.clientX;
    this.drag.startY = event.clientY;
    this.drag.dx = 0;
    this.drag.dy = 0;
  }

  onUp() {
    this.pointer.down = false;
    this.drag.active = false;
  }
}
