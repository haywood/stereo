import assert from 'assert';

import { TransferDescriptor, expose } from 'threads';
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

import { Data } from '../../data';

class Renderer {
  private renderer: WebGLRenderer;
  private scene: Scene;
  private camera: PerspectiveCamera;
  private points: Points;
  private z = 5;

  constructor(canvas: OffscreenCanvas, width: number, height: number) {
    this.renderer = new WebGLRenderer({ canvas });
    this.setSize(width, height);

    this.points = new Points(
      new BufferGeometry(),
      new PointsMaterial({
        vertexColors: VertexColors,
        size: 0.001
      })
    );

    this.scene = new Scene();
    this.scene.add(this.points);
  }

  setSize = (width: number, height: number) => {
    const near = 0.01,
      far = 1000;
    const aspect = width / height;
    const fov = 100;

    this.renderer.setSize(width, height, false);
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

    geometry.setAttribute('position', new BufferAttribute(position, d));
    geometry.setAttribute('color', new BufferAttribute(color, 3));

    let z = 5;
    if (d > 2) {
      geometry.computeBoundingSphere();
      const s = geometry.boundingSphere;
      z = Math.min(5, s.center.z + s.radius + 1);
    }
    this.camera.position.z = this.z = z;

    this.render();
  };
}

let renderer: Renderer;
const worker = {
  init: (canvas: OffscreenCanvas, width: number, height: number) => {
    renderer = new Renderer(canvas, width, height);
  },

  resize: (width: number, height: number) => {
    renderer.setSize(width, height);
    renderer.render();
  },

  render: () => renderer.render(),

  update: (data: Data) => renderer.update(data)
};

export type RenderThread = typeof worker & {
  init(
    canvas: TransferDescriptor<OffscreenCanvas>,
    width: number,
    height: number
  ): Promise<void>;
};

expose(worker);
