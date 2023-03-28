import * as THREE from "three";
import { ParticleSystem } from "./particleSystem";

class LineBuilder {
  private lastMousePosition: [number, number] | undefined;
  private lastPathPoint: [number, number] | undefined;

  /**
   * @returns Velocity from this point and the previous call to this function.
   * Converts from screen coords in pixels to 3d world units.
   */
  getVelocityFromPrevious(xi: number, yi: number) {
    const velocity = new THREE.Vector3();
    let [xi_1, yi_1] = [xi, yi];
    if (this.lastPathPoint) {
      [xi_1, yi_1] = this.lastPathPoint;
      let [dx, dy] = [xi - xi_1, yi - yi_1];
      // Invert y axis (screen to world)
      velocity.set(dx, -dy, 0);
    }
    this.lastPathPoint = [xi, yi];
    return velocity;
  }

  /**
   * @returns array of points interpolating between this point and the previous
   * call to this function.
   */
  getPathToNextMousePosition(x: number, y: number) {
    const points: [number, number][] = [];
    if (!this.lastMousePosition) {
      // Beginning of line - only possible to add one point.
      points.push([x, y]);
    } else {
      const [lastX, lastY] = this.lastMousePosition;
      // Connect to previous point with paths at every world unit.
      x = lerp(lastX, x, 0.4);
      y = lerp(lastY, y, 0.4);
      let [dx, dy] = [x - lastX, y - lastY];
      let l = vlen(dx, dy);
      for (let i = 0; i < l; i += 2)
        points.push([lerp(lastX, x, i / l), lerp(lastY, y, i / l)]);
    }

    this.lastMousePosition = [x, y];
    return points;
  }
}

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
// rend.setPixelRatio(window.devicePixelRatio);
rend.setSize(w, h);
document.body.appendChild(rend.domElement);
function tick() {
  ps.tick();
  rend.render(scene, cam);
  requestAnimationFrame(tick);
}
tick();

let line = new LineBuilder();

function handleMove(x: number, y: number) {
  const points = line.getPathToNextMousePosition(x, y);
  for (let i = 0; i < points.length; i++) {
    const [xi, yi] = points[i];

    const position = new THREE.Vector3(xi - w / 2, -(yi - h / 2), -1000);

    const coreVelocity = line.getVelocityFromPrevious(xi, yi);
    coreVelocity.multiply(
      new THREE.Vector3(
        lerp(-0.8, 1.8, Math.random()),
        lerp(-0.8, 1.8, Math.random()),
        lerp(-0.8, 1.8, Math.random())
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
}

// @ts-ignore
window.ontouchmove = ({ touches: [{ clientX: x, clientY: y }] }) =>
  handleMove(x, y);
window.onmousemove = ({ clientX: x, clientY: y }) => handleMove(x, y);
