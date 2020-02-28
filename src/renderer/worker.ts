import assert from 'assert';
import { Params } from '../params';
import { Resolver } from '../pipe/resolver';
import { vertex } from './shader/vertex';
import { fragment } from './shader/fragment';
import { D_MAX } from './shader/common';
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

const screenDiag = Math.hypot(window.screen.width, window.screen.height);
const near = Math.max(screenDiag / 100_000, 0.01);
const far = 10 / near;

class Renderer {
  private renderer: WebGLRenderer;
  private scene: Scene;
  private camera: PerspectiveCamera;
  private points: Points;
  private material: ShaderMaterial;

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

  setSize = (width: number, height: number) => {
    const aspect = width / height;
    const fov = 100;

    this.renderer.setSize(width, height, false);
    this.camera = new PerspectiveCamera(fov, aspect, near, far);
    // TODO support zoom and pan with mouse
    this.camera.position.z = 2;
  };

  get extent(): [number, number, number] {
    const rad = (Math.PI / 180) * this.camera.fov;
    const depth = this.camera.position.z / 3;
    const height = depth * Math.tan(rad / 2);
    const width = height * this.camera.aspect;
    return [width, height, depth];
  }

  render = () => {
    const { points, material } = this;
    const u = material.uniforms;
    u.t = { value: Date.now() / 1000 - u.t0.value };
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

  update = (params: Params) => {
    const { points } = this;
    const resolver = new Resolver(params.scope);
    const geometry = points.geometry as BufferGeometry;
    const { pipe, hsv, scope } = params;
    const n = resolver.resolve(pipe.n);
    const vertexShader = vertex(pipe);
    const fragmentShader = fragment(hsv);

    this.material = this.points.material = new ShaderMaterial({
      vertexShader,
      fragmentShader,
      defines: {
        D_MAX,
        near: near,
        pi: Math.PI
      },
      uniforms: {
        t0: { value: Date.now() / 1000 },
        n: { value: n },
        ...Object.entries(scope).reduce((memo, [name, value]) => {
          memo[name] = { value };
          return memo;
        }, {})
      }
    });

    debug('vertexShader', vertexShader);
    debug('fragmentShader', fragmentShader);

    const i = Float32Array.from(Array.from({ length: n }).keys());
    geometry.setAttribute('position', new BufferAttribute(i, 1));
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

  update: (params: Params) => {
    renderer.update(params);
    return renderer.extent;
  }
};
