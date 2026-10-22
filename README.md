   # Orbit Lab

An interactive, two-body gravitational simulation built with plain HTML, CSS, and JavaScript. The physics engine in `physics.js` is independent of the canvas UI in `app.js`.

## Run locally

Because the app uses JavaScript modules, open it through a local web server rather than directly as a `file://` URL.

1. Install Node.js if it is not already installed.
2. From this project directory, run:

   ```sh
   npx serve .
   ```

3. Open the local URL printed by the command (usually `http://localhost:3000`).

Alternatively, with Python installed, run `python -m http.server 8000` and visit `http://localhost:8000`.

## Controls

- Adjust either body's mass or the initial relative orbital speed. Changing either value resets the initial state.
- Change the simulation time scale without resetting the orbit.
- Pause/resume or reset the simulation.
- Toggle orbital trails and velocity vectors independently.

The simulation uses simplified units with `G = 1`. The bodies begin 220 units apart, with velocities chosen so the center of mass remains at rest. Increase the initial relative speed for a wider orbit; decrease it to create a tighter orbit or a close encounter.

## Equations and integration

Newton's law of universal gravitation gives the force on body 1:

```text
F₁ = G m₁ m₂ / r²  · r̂₁→₂
```

Dividing by each body's mass gives the accelerations:

```text
a₁ = G m₂ / r³ · (x₂ - x₁)
a₂ = G m₁ / r³ · (x₁ - x₂)
```

Here, `r` is the distance between the bodies and `r̂` points along the line joining them. The engine integrates these accelerations with the velocity Verlet method: it advances positions using the current acceleration, recalculates the acceleration, then updates velocities using the average of the old and new accelerations. This symplectic method is well suited to long-running orbital motion.

The displayed total energy is the sum of kinetic energy and gravitational potential energy:

```text
E = ½ m₁ |v₁|² + ½ m₂ |v₂|² - G m₁ m₂ / r
```
