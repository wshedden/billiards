# 3D Eight-Ball Pool (Three.js + cannon-es)

Run with any static server from the repo root:

```bash
python3 -m http.server 4173
```

Then open `http://localhost:4173`.

## Controls

- Move mouse left/right while holding click to rotate aim.
- Drag downward to set shot power, release to shoot.
- Use the cue-ball UI in the lower-right to choose spin.

## Architecture

- `src/renderer.js`: Three.js scene, camera, lighting, render loop integration.
- `src/physics.js`: cannon-es world setup, materials, fixed-step simulation, world snapshot/restore.
- `src/table.js`: table dimensions/constants, visuals, pocket coordinates.
- `src/balls.js`: ball creation, rack layout, mesh/body synchronization, pocket handling.
- `src/input.js`: pointer input tracking.
- `src/cue.js`: cue mesh, aim/power mechanics, spin selection and shot execution.
- `src/game.js`: subsystem orchestration, state machine, pocket checks, AI-ready shot simulation hook.
- `src/main.js`: app bootstrap.
