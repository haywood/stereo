import assert from 'assert';
import {
  BufferAttribute,
  BufferGeometry,
  PerspectiveCamera,
  Points,
  PointsMaterial,
  Scene,
  VertexColors,
  WebGLRenderer
} from 'three';
import debug from '../debug';
import { Data, DataChunk } from '../types';

class Renderer {
  private renderer: WebGLRenderer;
  private scene: Scene;
  private camera: PerspectiveCamera;
  private points: Points;
  private data: Data = {
    n: 0,
    d: 3,
    position: new Float32Array(),
    color: new Float32Array()
  };

  constructor(
    private readonly canvas: HTMLCanvasElement | OffscreenCanvas,
    width: number,
    height: number
  ) {
    this.renderer = new WebGLRenderer({ canvas });

    this.setSize(width, height);

    this.scene = new Scene();
    this.scene.add(this.points);
  }

  private get z() {
    const s = this.points.geometry.boundingSphere;
    if (!s || isNaN(s.radius)) return 5;
    return Math.min(5, s.center.z + s.radius + 1);
  }

  setSize = (width: number, height: number) => {
    const near = 0.01,
      far = 1000;
    const aspect = width / height;
    const fov = 100;

    const hypot = Math.hypot(width, height);
    this.points = new Points(
      new BufferGeometry(),
      new PointsMaterial({
        vertexColors: VertexColors,
        size: hypot / 200_000
      })
    );

    this.renderer.setSize(width, height, false);
    this.camera = new PerspectiveCamera(fov, aspect, near, far);
    this.camera.position.z = this.z;
    this.renderer.setAnimationLoop(this.render);
  };

  get extent(): [number, number, number] {
    const rad = (Math.PI / 180) * this.camera.fov;
    const depth = this.camera.position.z / 3;
    const height = depth * Math.tan(rad / 2);
    const width = height * this.camera.aspect;
    return [width, height, depth];
  }

  render = () => {
    this.renderer.render(this.scene, this.camera);
  };

  renderPng(): Promise<Blob> {
    this.render();
    const canvas = this.canvas;
    if (canvas instanceof HTMLCanvasElement) {
      return new Promise(r => canvas.toBlob(r));
    } else {
      return canvas.convertToBlob();
    }
  }

  update = (chunk: DataChunk) => {
    if (chunk.n != this.data.n || chunk.d != this.data.d) {
      const { n, d } = chunk;
      this.data = {
        n,
        d,
        position: new Float32Array(n * d),
        color: new Float32Array(n * 3)
      };
    }
    const { points } = this;
    const geometry = points.geometry as BufferGeometry;
    const { n, d, position, color } = this.data;

    assert(
      chunk.offset + chunk.size <= n,
      `renderer: expected chunk.offset + chunk.size = ${chunk.offset +
        chunk.size} <= n = ${n}`
    );
    position.set(chunk.position, chunk.offset * d);
    color.set(chunk.color, chunk.offset * 3);
    debug('data', this.data);

    geometry.setAttribute('position', new BufferAttribute(position, d));
    geometry.setAttribute('color', new BufferAttribute(color, 3));

    if (d > 2) geometry.computeBoundingSphere();
    this.camera.position.z = this.z;
  };
}

let renderer: Renderer;
export const worker = {
  init: (
    canvas: HTMLCanvasElement | OffscreenCanvas,
    width: number,
    height: number
  ) => {
    renderer = new Renderer(canvas, width, height);
    return renderer.extent;
  },

  resize: (width: number, height: number) => {
    renderer.setSize(width, height);
    renderer.render();
    return renderer.extent;
  },

  render: () => renderer.render(),

  renderPng() {
    return renderer.renderPng();
  },

  update: (chunk: DataChunk) => {
    renderer.update(chunk);
    return renderer.extent;
  }
};
