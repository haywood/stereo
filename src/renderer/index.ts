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
const fov = 100;

export class Renderer {
  readonly canvas = document.querySelector('canvas');

  private geometry = new BufferGeometry();
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

  constructor() {
    this.renderer = new WebGLRenderer({
      canvas: this.canvas,
      context: this.canvas.getContext('webgl2')
    });
    this.camera = new PerspectiveCamera(fov, 0, near, far);
    // TODO support zoom and pan with mouse
    this.camera.position.z = 2;
    this.points = new Points(this.geometry);

    this.scene = new Scene();
    this.scene.add(this.points);

    this.setSize();
    this.renderer.setAnimationLoop(this.render);
  }

  setSize = () => {
    const width = window.innerWidth;
    const height = window.innerHeight;
    const aspect = width / height;

    this.renderer.setSize(width, height, false);
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
  };

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
    const { points, uniforms, geometry } = this;
    const { pipe, hsv, scope } = params;

    Object.entries(scope).forEach(([name, value]) => {
      uniforms[name] = { value };
    });

    if (!isEqual(pipe, this.pipe) || !isEqual(hsv, this.hsv)) {
      const resolver = new Resolver(params.scope);
      const n = resolver.resolve(pipe.n);
      const i = Float32Array.from(Array.from({ length: n }).keys());
      const vertexShader = vertex(pipe);
      const fragmentShader = fragment(hsv);

      geometry.setAttribute('position', new BufferAttribute(i, 1));
      uniforms.n = { value: n };

      this.t0 = Date.now() / 1000;
      this.pipe = pipe;
      this.material = this.points.material = new ShaderMaterial({
        vertexShader,
        fragmentShader,
        uniforms: this.uniforms,
        defines: {
          D_MAX,
          near: near,
          pi: Math.PI
        }
      });

      debug('vertexShader', vertexShader);
      debug('fragmentShader', fragmentShader);
    }
  };
}

export const renderer = new Renderer();
