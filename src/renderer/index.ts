import { AUDIO_PLACEHOLDER } from '../audio/constants';
import assert from 'assert';
import { numberNode } from '../pipe/ast';
import { inputs } from '../inputs';
import { Params, HSV } from '../params';
import { Scope } from '../params/scope';
import { PipeNode } from '../pipe/grammar.pegjs';
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
  private camera: PerspectiveCamera;
  private renderer: WebGLRenderer;
  private scene: Scene;
  private t0: number;

  private material: ShaderMaterial = new ShaderMaterial({
    uniforms: {
      audio: { value: AUDIO_PLACEHOLDER }
    },
    defines: {
      D_MAX,
      near: near,
      // TODO Add more constants...
      pi: Math.PI
    }
  });

  constructor() {
    this.renderer = new WebGLRenderer({
      canvas: this.canvas,
      context: this.canvas.getContext('webgl2')
    });
    this.camera = new PerspectiveCamera(fov, 0, near, far);
    // TODO support zoom and pan with mouse
    this.camera.position.z = 2;
    const points = new Points(this.geometry, this.material);

    this.scene = new Scene();
    this.scene.add(points);

    this.setSize();
    this.renderer.setAnimationLoop(() => this.render());
  }

  setPipe(pipe: PipeNode) {
    const {
      geometry,
      material: { uniforms }
    } = this;
    const n = pipe.n;
    const i = Float32Array.from(Array.from({ length: n }).keys());
    const vertexShader = vertex(pipe);

    geometry.setAttribute('position', new BufferAttribute(i, 1));
    uniforms.n = { value: n };

    this.t0 = Date.now() / 1000;
    this.material.vertexShader = vertexShader;
    this.material.needsUpdate = true;

    debug('vertexShader', vertexShader);
  }

  setHsv(hsv: HSV) {
    const { material } = this;
    const fragmentShader = fragment(hsv);

    material.fragmentShader = fragmentShader;
    material.needsUpdate = true;

    debug('fragmentShader', fragmentShader);
  }

  setScope(scope: Scope) {
    const {
      material: { uniforms }
    } = this;

    Object.entries(scope).forEach(([name, value]) => {
      uniforms[name] = { value };
    });
  }

  setSize() {
    const width = window.innerWidth;
    const height = window.innerHeight;
    const aspect = width / height;

    this.renderer.setSize(width, height, false);
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
  }

  renderPng(): Promise<Blob> {
    this.render(); // need to call render first, since three.js clears the draw buffers
    return new Promise(r => this.canvas.toBlob(r));
  }

  private render() {
    if (inputs.animate.value) {
      const {
        material: { uniforms },
        t0
      } = this;
      uniforms.t = { value: Date.now() / 1000 - t0 };
      this.renderer.render(this.scene, this.camera);
    }
  }
}

export const renderer = new Renderer();
