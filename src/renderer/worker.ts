import assert from 'assert';
import {
  BufferAttribute,
  VertexColors,
  BufferGeometry,
  PerspectiveCamera,
  Points,
  PointsMaterial,
  ShaderMaterial,
  Scene,
  WebGLRenderer
} from 'three';
import debug from '../debug';
import { Data, DataChunk } from '../types';
import vertexShader from './shader.vert';
import fragmentShader from './shader.frag';

const screenDiag = Math.hypot(window.screen.width, window.screen.height);

class Renderer {
  private renderer: WebGLRenderer;
  private scene: Scene;
  private camera: PerspectiveCamera;
  private points: Points;
  private material: ShaderMaterial;
  private data: Data = {
    n: 0,
    d: 3,
    position: new Float32Array(3),
    color: new Float32Array(3)
  };

  constructor(
    private readonly canvas: HTMLCanvasElement | OffscreenCanvas,
    width: number,
    height: number
  ) {
    this.renderer = new WebGLRenderer({
      canvas,
      context: canvas.getContext('webgl2')
    });
    this.points = new Points(new BufferGeometry());

    this.setSize(width, height);

    this.scene = new Scene();
    this.scene.add(this.points);
    this.renderer.setAnimationLoop(this.render);
  }

  private get z() {
    return 3;
  }

  setSize = (width: number, height: number) => {
    const near = Math.max(screenDiag / 100_000, 0.01);
    const far = 10 / near;
    const aspect = width / height;
    const fov = 100;

    this.material = this.points.material = new ShaderMaterial({
      vertexShader,
      fragmentShader,
      defines: {
        D_MAX: 10,
        NEAR: near
      },
      uniforms: {
        d: { value: 0 },
        n: { value: 0 }
      }
    });

    this.renderer.setSize(width, height, false);
    this.camera = new PerspectiveCamera(fov, aspect, near, far);
    this.camera.position.z = this.z;
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
    const { points } = this;
    const geometry = points.geometry as BufferGeometry;
    const { n, d } = chunk;

    this.material.uniforms.n.value = n;
    this.material.uniforms.d.value = d;
    debug('data', this.data);

    const i = Float32Array.from(Array.from({ length: n }).keys());
    geometry.setAttribute('position', new BufferAttribute(i, 1));
    points.rotation.x += 0.005;
    points.rotation.y += 0.005;
    points.rotation.z += 0.005;

    //if (d > 2) geometry.computeBoundingSphere();
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
