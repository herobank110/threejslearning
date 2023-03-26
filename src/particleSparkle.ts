import * as THREE from "three";
import { ParticleSystem } from "./particleSystem";

const lerp = (a, b, x) => a + (b - a) * x;
const vlen = (a, b) => Math.sqrt(a * a + b * b);
const mapRange = (x, a, b, c, d) => c + (d - c) * ((x - a) / (b - a));

let { innerWidth: w, innerHeight: h } = window;
let cam = new THREE.PerspectiveCamera(40, w / h, 1, 10000);
cam.position.z = 300;
let scene = new THREE.Scene();

let ps = new ParticleSystem()
scene.add(ps);
let rend = new THREE.WebGLRenderer();
rend.setPixelRatio(window.devicePixelRatio);
rend.setSize(w, h);
document.body.appendChild(rend.domElement);
function tick() {
  rend.render(scene, cam);
  requestAnimationFrame(tick);
}
tick();

let [lastX, lastY] = [-1, -1];
function getPath(x: number, y: number) {
  let ret: [number, number][] = [];
  if (lastX == -1) ret.push([x, y]);
  else {
    x = lerp(lastX, x, 0.4);
    y = lerp(lastY, y, 0.4);
    let [dx, dy] = [x - lastX, y - lastY];
    let l = vlen(dx, dy);
    for (let i = 0; i < l; i += 2)
      ret.push([lerp(lastX, x, i / l), lerp(lastY, y, i / l)]);
  }

  lastX = x;
  lastY = y;
  console.log(lastX, lastY);
  return ret;
}

window.onmousemove = ({ clientX: x, clientY: y }) => {
  if (n >= t) return;
  let p = getPath(x, y);
  for (let i = 0; i < p.length; i++) {
    const [xi, yi] = p[i];
    geo
      .getAttribute("position")
      // @ts-ignore
      .setXYZ(n + i, xi - w / 2, -(yi - h / 2), -1000);
    // @ts-ignore
    geo.getAttribute("color").setXYZ(n + i, 1, 1, 1);
    // @ts-ignore
    geo.getAttribute("size").setX(n + i, 30);
  }
  geo.getAttribute("position").needsUpdate = true;
  geo.getAttribute("color").needsUpdate = true;
  geo.getAttribute("size").needsUpdate = true;
  n += p.length;
  geo.setDrawRange(0, n);
};
