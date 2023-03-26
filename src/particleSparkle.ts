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

let lastP: [number, number] | undefined;
window.onmousemove = ({ clientX: x, clientY: y }) => {
  const points = getPath(x, y);
  for (let i = 0; i < points.length; i++) {
    const [xi, yi] = points[i];

    const coreVelocity = getVelocityAtPoint(i, points);

    ps.spawn({
      color: new THREE.Color(0xaaaaaa),
      lifetime: 2,
      position: new THREE.Vector3(xi - w / 2, -(yi - h / 2), -1000),
      velocity: coreVelocity.clone().multiplyScalar(10),
      size: 30,
    });
  }
  lastP = points[points.length - 1];
};

/** Get velocity as gradient per point in path, scaled. */
function getVelocityAtPoint(i: number, points: [number, number][]) {
  const [xi, yi] = points[i];
  const velocity = new THREE.Vector3();
  let [xi_1, yi_1] = [xi, yi];
  if (i != 0)
    // points along this new path
    [xi_1, yi_1] = points[i - 1];
  else if (lastP)
    // first point in this path but previous points were drawn
    [xi_1, yi_1] = lastP;
  let [dx, dy] = [xi - xi_1, yi - yi_1];
  dx *= Math.random() - 0.5;
  dy *= Math.random() - 0.5;
  velocity.set(dx, dy, 0);
  return velocity;
}
