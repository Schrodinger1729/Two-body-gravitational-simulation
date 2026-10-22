export const GRAVITATIONAL_CONSTANT = 1;
export const INITIAL_SEPARATION = 220;

export class TwoBodySystem {
  constructor(massA, massB, relativeSpeed) {
    this.massA = massA;
    this.massB = massB;
    this.time = 0;
    this.setInitialState(relativeSpeed);
  }

  setInitialState(relativeSpeed) {
    const totalMass = this.massA + this.massB;
    const distanceA = INITIAL_SEPARATION * this.massB / totalMass;
    const distanceB = INITIAL_SEPARATION * this.massA / totalMass;
    const speedA = relativeSpeed * this.massB / totalMass;
    const speedB = relativeSpeed * this.massA / totalMass;

    this.bodyA = { x: -distanceA, y: 0, vx: 0, vy: speedA };
    this.bodyB = { x: distanceB, y: 0, vx: 0, vy: -speedB };
    this.time = 0;
  }

  get separation() {
    return Math.hypot(this.bodyB.x - this.bodyA.x, this.bodyB.y - this.bodyA.y);
  }

  get totalEnergy() {
    const kinetic = 0.5 * this.massA * (this.bodyA.vx ** 2 + this.bodyA.vy ** 2)
      + 0.5 * this.massB * (this.bodyB.vx ** 2 + this.bodyB.vy ** 2);
    return kinetic - GRAVITATIONAL_CONSTANT * this.massA * this.massB / this.separation;
  }

  accelerations() {
    const dx = this.bodyB.x - this.bodyA.x;
    const dy = this.bodyB.y - this.bodyA.y;
    const distanceSquared = dx * dx + dy * dy;
    const distanceCubed = distanceSquared * Math.sqrt(distanceSquared);
    const scaleA = GRAVITATIONAL_CONSTANT * this.massB / distanceCubed;
    const scaleB = GRAVITATIONAL_CONSTANT * this.massA / distanceCubed;

    return {
      axA: dx * scaleA,
      ayA: dy * scaleA,
      axB: -dx * scaleB,
      ayB: -dy * scaleB,
    };
  }

  step(dt) {
    const before = this.accelerations();

    this.bodyA.x += this.bodyA.vx * dt + 0.5 * before.axA * dt * dt;
    this.bodyA.y += this.bodyA.vy * dt + 0.5 * before.ayA * dt * dt;
    this.bodyB.x += this.bodyB.vx * dt + 0.5 * before.axB * dt * dt;
    this.bodyB.y += this.bodyB.vy * dt + 0.5 * before.ayB * dt * dt;

    const after = this.accelerations();
    this.bodyA.vx += 0.5 * (before.axA + after.axA) * dt;
    this.bodyA.vy += 0.5 * (before.ayA + after.ayA) * dt;
    this.bodyB.vx += 0.5 * (before.axB + after.axB) * dt;
    this.bodyB.vy += 0.5 * (before.ayB + after.ayB) * dt;
    this.time += dt;
  }
}
