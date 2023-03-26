import * as THREE from "three";
import { BufferAttribute, GLBufferAttribute } from "three";

type ParticleInitialAttributes = {
  lifetime: number;
  color: number;
  size: number;
  position: THREE.Vector3;
  velocity: THREE.Vector3;
};

type ParticleLiveAttributes = {
  time: number;
  previousPosition: THREE.Vector3 | undefined;
};

type ParticleAttributes = ParticleInitialAttributes | ParticleLiveAttributes;

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

  constructor(
    public readonly limit = 100_000,
    private clock = new THREE.Clock(),
    private geo = new THREE.BufferGeometry(),
    private mtl = new THREE.ShaderMaterial(),
    private points = new THREE.Points(geo, mtl)
  ) {
    super();

    geo.setAttribute("position", makeFloatArray(limit, 3));
    geo.setAttribute("color", makeFloatArray(limit, 3));
    geo.setAttribute("size", makeFloatArray(limit, 1));
    (<BufferAttribute>geo.attributes.position).setUsage(THREE.DynamicDrawUsage);
    (<BufferAttribute>geo.attributes.color).setUsage(THREE.DynamicDrawUsage);
    (<BufferAttribute>geo.attributes.size).setUsage(THREE.DynamicDrawUsage);
    geo.setDrawRange(0, 0);

    mtl.setValues({
      vertexShader,
      fragmentShader,
      blending: THREE.AdditiveBlending,
      depthTest: false,
      transparent: true,
      vertexColors: true,
    });

    this.add(points);
  }

  spawn(attributes: ParticleInitialAttributes) {
    // TODO: use this.limit, insert into free space instead of always at end/loop around?
    this.particles.push({
      ...attributes,
      time: 0,
      previousPosition: undefined,
    });
  }

  tick() {
    // TODO: update velocities and lifetimes of particles, deleting ones that are dead and tracking free space
    this.clock.getDelta();
  }
}

// utils

function makeFloatArray(items: number, dimensions: number) {
  return new THREE.Float32BufferAttribute(
    Array(items * dimensions).fill(0),
    dimensions
  );
}
