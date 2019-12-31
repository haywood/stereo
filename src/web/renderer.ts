import {
  PerspectiveCamera,
  BufferGeometry,
  BufferAttribute,
  Points,
  PointsMaterial,
  WebGLRenderer,
  VertexColors,
  Scene,
} from 'three';
import { Data } from '../core/data';
import assert from 'assert';

export class Renderer {
  private renderer: WebGLRenderer;
  private scene: Scene;
  private camera: PerspectiveCamera;
  private points: Points;
  private z = 5;

  constructor() {
    this.renderer = new WebGLRenderer();
    this.setSize();
    window.onresize = () => {
      this.setSize();
      requestAnimationFrame(this.render);
    };

    this.points = new Points(
      new BufferGeometry(),
      new PointsMaterial({
        vertexColors: VertexColors,
        size: 0.001,
      })
    );

    this.scene = new Scene();
    this.scene.add(this.points);
  }

  private setSize = () => {
    const near = 0.01, far = 1000;
    const width = window.innerWidth;
    const height = window.innerHeight;
    const aspect = width / height;
    const fov = 100;

    this.renderer.setSize(width, height);
    this.camera = new PerspectiveCamera(fov, aspect, near, far);
    this.camera.position.z = this.z;
  };

  get domElement() {
    return this.renderer.domElement;
  }

  render = () => {
    this.renderer.render(this.scene, this.camera);
  };

  update = ({ d, position, color }: Data) => {
    const { points } = this;
    const geometry = points.geometry as BufferGeometry;
    assert.equal(position.length % d, 0);
    assert.equal(color.length % 3, 0);

    for (let i = 0; i < position.length; i++) {
      const p = position[i];
      if (isNaN(p) || !isFinite(p)) {
        position[i] = 2 ** 32 - 1;
        if (!isNaN(p)) position[i] *= Math.sign(p);
        console.warn(`found value ${p} at index ${i}; setting to ${position[i]} for rendering`);
      }
    }

    geometry.setAttribute('position', new BufferAttribute(position, d));
    geometry.setAttribute('color', new BufferAttribute(color, 3));

    let z = 5;
    if (d > 2) {
      geometry.computeBoundingSphere();
      const s = geometry.boundingSphere;
      z = Math.min(5, s.center.z + s.radius + 1);
    }
    this.camera.position.z = this.z = z;

    requestAnimationFrame(this.render);
  };
}
