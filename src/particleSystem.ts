import * as THREE from "three";

type ParticleSpawnParams = {
  lifetime: number;
  color: THREE.Color;
  size: number;
  position: THREE.Vector3;
  velocity: THREE.Vector3;
};

type ParticleLiveAttributes = {
  time: number;
  previousPosition: THREE.Vector3 | undefined;
};

type ParticleAttributes = ParticleSpawnParams & ParticleLiveAttributes;

const vertexShader = `
attribute float size;
varying vec3 vColor;
varying float fSize;
void main() {
  vColor = color;
  vec4 mvp = modelViewMatrix * vec4(position, 1.0);
  gl_PointSize = size * (300.0 / -mvp.z);
  fSize = gl_PointSize;
  gl_Position = projectionMatrix * mvp;
}`;

const fragmentShader = `
varying vec3 vColor;
varying float fSize;
void main() {
  float dist = 1. - distance(gl_PointCoord, vec2(0.5, 0.5));
  float a = pow(dist + 0.3, fSize/0.5);
  gl_FragColor = vec4(vColor, a);
}`;

export class ParticleSystem extends THREE.Object3D {
  private particles: ParticleAttributes[] = [];
  private clock = new THREE.Clock();
  private geo = new THREE.BufferGeometry();
  private mtl = new THREE.ShaderMaterial();
  private points = new THREE.Points(this.geo, this.mtl);

  constructor(public readonly limit = 100_000) {
    super();

    this.geo.setAttribute("position", makeFloatArray(limit, 3));
    this.geo.setAttribute("color", makeFloatArray(limit, 3));
    this.geo.setAttribute("size", makeFloatArray(limit, 1));
    this.geoAttrPosition.setUsage(THREE.StaticDrawUsage);
    this.geoAttrColor.setUsage(THREE.StaticDrawUsage);
    this.geoAttrSize.setUsage(THREE.StaticDrawUsage);

    this.mtl.setValues({
      vertexShader,
      fragmentShader,
      blending: THREE.AdditiveBlending,
      depthTest: false,
      transparent: true,
      vertexColors: true,
    });

    this.add(this.points);
  }

  /**
   * Register a particle to the system.
   *
   * After spawning, no modifications may be made to particles.
   *
   * Particles are not updated until the next call to `tick`
   */
  spawn(attributes: ParticleSpawnParams) {
    // TODO: use this.limit, insert into free space instead of always at end/loop around?
    this.particles.push({
      ...attributes,
      time: 0,
      previousPosition: undefined,
    });
  }

  tick() {
    // TODO: update velocities and lifetimes of particles, deleting ones that are dead and tracking free space
    const deltaTime = this.clock.getDelta();

    // Particles which will be still alive after this tick.
    const newParticles: ParticleAttributes[] = [];
    for (const p of this.particles) {
      // Lifetime update
      p.time += deltaTime;
      if (p.time > p.lifetime) {
        // Particle has outlived its lifetime. Exclude from new array.
        continue;
      }
      // If still alive, push to new array.
      newParticles.push(p);

      // Velocity/position update
      p.position.addScaledVector(p.velocity, deltaTime);
      // TODO: add acceleration?
      // p.velocity.multiplyScalar((1/ p.acceleration * dt)
    }

    this.reassignParticles(newParticles);
  }

  private reassignParticles(newParticles: ParticleAttributes[]) {
    this.particles = newParticles;
    // update gpu draw info
    for (let i = 0; i < newParticles.length; i++) {
      let p = newParticles[i];
      this.geoAttrPosition.setXYZ(i, p.position.x, p.position.y, p.position.z);
      this.geoAttrColor.setXYZ(i, p.color.r, p.color.g, p.color.b);
      this.geoAttrSize.setX(i, p.size);
    }
    this.dirtyDrawState();
    this.geo.setDrawRange(0, newParticles.length);
  }

  // helpers

  private get geoAttrPosition() {
    return this.geo.getAttribute("position") as THREE.BufferAttribute;
  }

  private get geoAttrColor() {
    return this.geo.getAttribute("color") as THREE.BufferAttribute;
  }

  private get geoAttrSize() {
    return this.geo.getAttribute("size") as THREE.BufferAttribute;
  }

  private dirtyDrawState() {
    this.geoAttrPosition.needsUpdate = true;
    this.geoAttrColor.needsUpdate = true;
    this.geoAttrSize.needsUpdate = true;
  }
}

// utils

function makeFloatArray(items: number, dimensions: number) {
  return new THREE.Float32BufferAttribute(
    Array(items * dimensions).fill(0),
    dimensions
  );
}
