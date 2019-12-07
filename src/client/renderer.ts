import {
  PerspectiveCamera,
  BufferGeometry,
  BufferAttribute,
  Points,
  PointsMaterial,
  WebGLRenderer,
  VertexColors,
  Scene,
  Vector3
} from 'three';
import { n, color } from './query';
import { Data } from './data';
import * as q from './query';

export class Renderer {
  private renderer: WebGLRenderer;
  private scene: Scene;
  private camera: PerspectiveCamera;
  private points: Points;
  private dimension: number;
  private color: number[];
  private c = new Vector3();
  private delta = 0;

  constructor() {
    this.renderer = new WebGLRenderer();
    this.setSize();
    window.onresize = this.setSize;

    this.points = new Points(
      new BufferGeometry(),
      new PointsMaterial({
        vertexColors: VertexColors,
        size: 0.01,
      })
    );

    this.scene = new Scene();
    this.scene.add(this.points);

    this.renderer.setAnimationLoop(this.render);
  }

  private setSize = () => {
    const near = 0.01, far = 1000;
    const width = window.innerWidth;
    const height = window.innerHeight;
    const aspect = width / height;
    const fov = 100;

    this.renderer.setSize(width, height);
    this.camera = new PerspectiveCamera(fov, aspect, near, far);
    this.camera.position.z = 5;
  }

  get domElement() {
    return this.renderer.domElement;
  }

  render = () => {
    this.renderer.render(this.scene, this.camera)
  }

  updatePoints = ({ position, d }: Data) => {
    const { points } = this;
    if (position.length) {
      const geometry = points.geometry as BufferGeometry;

      if (d !== this.dimension) {
        this.dimension = d;
        this.color = position.map((x, i) => color.evaluate({ x, i }));
      }

      geometry.setAttribute('position', this.newBufferAttribute(position));
      geometry.setAttribute('color', this.newBufferAttribute(this.color));
      geometry.computeBoundingSphere();
      const r = geometry.boundingSphere.radius;
      const c = geometry.boundingSphere.center;

      let delta = c.distanceTo(this.c);
      let ratio = this.delta / delta;
      if (ratio && isFinite(ratio)) {
        q.setRate(ratio * q.rate);
      }
      this.delta = delta;
      this.c = c;
    }
  }

  newBufferAttribute = (value: number[]) => {
    return new BufferAttribute(new Float32Array(value), this.dimension);
  }
}
