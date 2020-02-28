import { isEqual } from 'lodash';
import assert from 'assert';
import { Params, HSV } from '../params';
import { Scope } from '../params/scope';
import { PipeNode } from '../pipe/grammar.pegjs';
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
  private pipe: PipeNode = {
    kind: 'pipe',
    n: { kind: 'number', value: 0 },
    d0: 0,
    steps: []
  };
  private hsv: HSV;
  private uniforms: any = {};
  private t0: number;

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
    const { points, material, uniforms, t0 } = this;
    uniforms.t = { value: Date.now() / 1000 - t0 };
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

  // TODO: should have a separate method for each of pipe, hsv, and scope
  update = (params: Params) => {
    const { points, uniforms } = this;
    const geometry = points.geometry as BufferGeometry;
    const { pipe, hsv, scope } = params;
    const vertexShader = vertex(pipe);
    const fragmentShader = fragment(hsv);

    Object.entries(scope).forEach(([name, value]) => {
      uniforms[name] = { value };
    });

    if (!isEqual(pipe.n, this.pipe.n)) {
      this.pipe.n = pipe.n;

      const resolver = new Resolver(params.scope);
      const n = resolver.resolve(pipe.n);
      uniforms.n = { value: n };
      const i = Float32Array.from(Array.from({ length: n }).keys());
      geometry.setAttribute('position', new BufferAttribute(i, 1));
    }

    if (!isEqual(pipe.steps, this.pipe.steps) || !isEqual(hsv, this.hsv)) {
      this.pipe = pipe;
      this.t0 = Date.now() / 1000;

      this.material = this.points.material = new ShaderMaterial({
        vertexShader,
        fragmentShader,
        defines: {
          D_MAX,
          near: near,
          pi: Math.PI
        },
        uniforms: this.uniforms
      });

      debug('vertexShader', vertexShader);
      debug('fragmentShader', fragmentShader);
    }
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
