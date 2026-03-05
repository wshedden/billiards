import * as THREE from 'three';

export const TABLE_LENGTH = 2.54;
export const TABLE_WIDTH = 1.27;
export const BALL_DIAMETER = 0.05715;
export const BALL_RADIUS = BALL_DIAMETER / 2;
export const BALL_MASS = 0.17;
export const RAIL_HEIGHT = BALL_RADIUS * 1.15;
export const CLOTH_Y = 0;
export const POCKET_RADIUS = 0.065;

export function getPocketPositions() {
  const halfL = TABLE_LENGTH / 2;
  const halfW = TABLE_WIDTH / 2;
  return [
    new THREE.Vector3(-halfL, CLOTH_Y, -halfW),
    new THREE.Vector3(0, CLOTH_Y, -halfW),
    new THREE.Vector3(halfL, CLOTH_Y, -halfW),
    new THREE.Vector3(-halfL, CLOTH_Y, halfW),
    new THREE.Vector3(0, CLOTH_Y, halfW),
    new THREE.Vector3(halfL, CLOTH_Y, halfW),
  ];
}

export function createTableGroup() {
  const group = new THREE.Group();
  const feltTex = makeFeltTexture();
  feltTex.wrapS = feltTex.wrapT = THREE.RepeatWrapping;
  feltTex.repeat.set(8, 4);

  const cloth = new THREE.Mesh(
    new THREE.BoxGeometry(TABLE_LENGTH, 0.04, TABLE_WIDTH),
    new THREE.MeshStandardMaterial({ map: feltTex, roughness: 0.95, metalness: 0.02, color: 0x1f6f42 }),
  );
  cloth.position.y = -0.02;
  cloth.receiveShadow = true;
  group.add(cloth);

  const railMat = new THREE.MeshStandardMaterial({ color: 0x3f2416, roughness: 0.35, metalness: 0.15 });
  const railT = 0.13;
  const railH = 0.1;
  const halfL = TABLE_LENGTH / 2;
  const halfW = TABLE_WIDTH / 2;

  const rails = [
    { w: TABLE_LENGTH + railT * 2, d: railT, x: 0, z: -(halfW + railT / 2) },
    { w: TABLE_LENGTH + railT * 2, d: railT, x: 0, z: halfW + railT / 2 },
    { w: railT, d: TABLE_WIDTH, x: -(halfL + railT / 2), z: 0 },
    { w: railT, d: TABLE_WIDTH, x: halfL + railT / 2, z: 0 },
  ];
  rails.forEach((r) => {
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(r.w, railH, r.d), railMat);
    mesh.position.set(r.x, railH / 2 - 0.02, r.z);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    group.add(mesh);
  });

  for (const p of getPocketPositions()) {
    const hole = new THREE.Mesh(
      new THREE.CylinderGeometry(POCKET_RADIUS * 0.95, POCKET_RADIUS * 1.08, 0.06, 30),
      new THREE.MeshStandardMaterial({ color: 0x050505, roughness: 0.8, metalness: 0 }),
    );
    hole.rotation.x = Math.PI / 2;
    hole.position.set(p.x, -0.03, p.z);
    hole.receiveShadow = true;
    group.add(hole);
  }

  return group;
}

function makeFeltTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');

  ctx.fillStyle = '#1d6d3f';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  for (let i = 0; i < 1800; i += 1) {
    const x = Math.random() * canvas.width;
    const y = Math.random() * canvas.height;
    const g = 90 + Math.random() * 60;
    ctx.fillStyle = `rgba(${g / 2}, ${g}, ${g / 2}, 0.06)`;
    ctx.fillRect(x, y, 2, 2);
  }

  return new THREE.CanvasTexture(canvas);
}
