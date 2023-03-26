import * as THREE from "three";
import { ParticleSystem } from "./particleSystem";

const lerp = (a, b, x) => a + (b - a) * x;
const vlen = (a, b) => Math.sqrt(a * a + b * b);
const mapRange = (x, a, b, c, d) => c + (d - c) * ((x - a) / (b - a));

let { innerWidth: w, innerHeight: h } = window;
let cam = new THREE.PerspectiveCamera(40, w / h, 1, 10000);
cam.position.z = 300;
let scene = new THREE.Scene();
let ps = new ParticleSystem();
scene.add(ps);
let rend = new THREE.WebGLRenderer();
rend.setPixelRatio(window.devicePixelRatio);
rend.setSize(w, h);
document.body.appendChild(rend.domElement);
function tick() {
  ps.tick();
  rend.render(scene, cam);
  requestAnimationFrame(tick);
}
tick();

let [lastX, lastY] = [-1, -1];
function getPath(x: number, y: number) {
  const points: [number, number][] = [];
  if (lastX == -1) {
    // Beginning of line - only possible to add one point.
    points.push([x, y]);
  } else {
    // Connect to previous point with paths at every world unit.
    x = lerp(lastX, x, 0.4);
    y = lerp(lastY, y, 0.4);
    let [dx, dy] = [x - lastX, y - lastY];
    let l = vlen(dx, dy);
    for (let i = 0; i < l; i += 2)
      points.push([lerp(lastX, x, i / l), lerp(lastY, y, i / l)]);
  }

  lastX = x;
  lastY = y;
  return points;
}

window.onmousemove = ({ clientX: x, clientY: y }) => {
  const points = getPath(x, y);
  for (let i = 0; i < points.length; i++) {
    const [xi, yi] = points[i];

    const position = new THREE.Vector3(xi - w / 2, -(yi - h / 2), -1000);

    const coreVelocity = getVelocityAtPoint(xi, yi);
    coreVelocity.multiply(
      new THREE.Vector3(
        mapRange(Math.random(), 0, 1, -0.8, 1.8),
        mapRange(Math.random(), 0, 1, -0.8, 1.8),
        mapRange(Math.random(), 0, 1, -0.8, 1.8)
      )
    );

    // head spray
    ps.spawn({
      color: new THREE.Color(0xaaaa22),
      lifetime: 0.25,
      position: position.clone(),
      velocity: coreVelocity.clone().multiplyScalar(10),
      size: lerp(50, 80, Math.random()),
    });

    // underlying line spread
    ps.spawn({
      color: new THREE.Color(0xaaaaaa),
      lifetime: 2,
      position: position.clone(),
      velocity: coreVelocity.clone().multiplyScalar(10),
      size: 30,
    });

    // mini spray
    ps.spawn({
      color: new THREE.Color(0x444444),
      lifetime: 2.8,
      position: position.clone(),
      velocity: coreVelocity
        .clone()
        .multiplyScalar(lerp(100, 200, Math.random())),
      size: 23,
    });
  }
};

let lastP: [number, number] | undefined;

/** Get velocity as gradient per point in path, scaled. */
function getVelocityAtPoint(xi: number, yi: number) {
  const velocity = new THREE.Vector3();
  let [xi_1, yi_1] = [xi, yi];
  if (lastP) {
    [xi_1, yi_1] = lastP;
    let [dx, dy] = [xi - xi_1, yi - yi_1];
    // Invert y axis (screen to world)
    velocity.set(dx, -dy, 0);
  }
  lastP = [xi, yi];
  return velocity;
}
