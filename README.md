# 3D Eight-Ball Pool (Three.js + cannon-es)

A modular browser pool simulation with physically plausible SI-unit tuning.

## Run locally

Use any static server from the repo root:

```bash
python3 -m http.server 4173
```

Then open <http://localhost:4173>.

## Controls

- Move mouse over table: aim cue direction.
- Left-click and drag backward: increase shot power.
- Release mouse: strike cue ball.
- Spin panel (top-right): click to choose strike offset (English / top-spin / back-spin).
- Double-click spin panel: reset spin to center hit.

## Architecture

- `src/renderer.js` – scene/camera/lights/render loop helper.
- `src/physics.js` – fixed-step cannon-es world, contact materials, snapshot/restore hooks.
- `src/table.js` – table visuals and static colliders + pocket regions.
- `src/balls.js` – cue/object ball creation, rack layout, mesh/body sync, pocket lifecycle.
- `src/cue.js` – cue mesh, aiming, drag-to-power, impulse + spin application.
- `src/input.js` – pointer event translation into aiming/charge/shoot callbacks.
- `src/game.js` – top-level state machine and subsystem coordination.
