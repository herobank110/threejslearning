import * as THREE from "three";

const lerp = (a, b, x) => a + (b - a) * x;
const vlen = (a, b) => Math.sqrt(a * a + b * b);
const mapRange = (x, a, b, c, d) => c + (d - c) * ((x - a) / (b - a));

let { innerWidth: w, innerHeight: h } = window;
let cam = new THREE.PerspectiveCamera(40, w / h, 1, 10000);
cam.position.z = 300;
let scene = new THREE.Scene();
let t = 10000,
  n = 0;
let sm = new THREE.ShaderMaterial({
  vertexShader: `
  attribute float size;
  varying vec3 vColor;
  varying float fSize;
  void main() {
   vColor = color;
   vec4 mvp = modelViewMatrix * vec4(position, 1.0);
   gl_PointSize = size * (300.0 / -mvp.z);
   fSize = gl_PointSize;
   gl_Position = projectionMatrix * mvp;
  }`,
  fragmentShader: `
  varying vec3 vColor;
  varying float fSize;
  void main() {
   float dist = 1. - distance(gl_PointCoord, vec2(0.5, 0.5));
   float a = pow(dist + 0.3, fSize/0.5);
   gl_FragColor = vec4(vColor, a);
  }`,
  blending: THREE.AdditiveBlending,
  depthTest: false,
  transparent: true,
  vertexColors: true,
});
let geo = new THREE.BufferGeometry();
geo.setAttribute(
  "position",
  new THREE.Float32BufferAttribute(Array(t * 3).fill(0), 3)
);
geo.setAttribute(
  "color",
  new THREE.Float32BufferAttribute(Array(t * 3).fill(0), 3)
);
geo.setAttribute("size", new THREE.Float32BufferAttribute(Array(t).fill(0), 1));
// @ts-ignore
geo.getAttribute("position").setUsage(THREE.DynamicDrawUsage);
// @ts-ignore
geo.getAttribute("color").setUsage(THREE.DynamicDrawUsage);
// @ts-ignore
geo.getAttribute("size").setUsage(THREE.DynamicDrawUsage);
geo.setDrawRange(0, 0);

let ps = new THREE.Points(geo, sm);
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