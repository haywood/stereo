import assert from 'assert';

import {
  BufferAttribute,
  BufferGeometry,
  PerspectiveCamera,
  Points,
  PointsMaterial,
  Scene,
  ShaderMaterial,
  VertexColors,
  WebGLRenderer
} from 'three';

import { AUDIO_PLACEHOLDER } from '../audio/constants';
import debug from '../debug';
import { inputs } from '../inputs';
import { PipeNode, Variables } from '../inputs/pipe/ast';
import { HSV, Scope } from '../types';
import { defines, far, fov, near } from './shader/common';
import { fragment } from './shader/fragment';
import { vertex } from './shader/vertex';

export class Renderer {
  readonly canvas = document.querySelector('canvas');

  private geometry = new BufferGeometry();
  private camera: PerspectiveCamera;
  private renderer: WebGLRenderer;
  private scene: Scene;
  private variables: Variables;
  private t0: number;

  private material: ShaderMaterial = new ShaderMaterial({
    uniforms: {
      audio: { value: AUDIO_PLACEHOLDER }
    },
    defines
  });

  constructor() {
    this.renderer = new WebGLRenderer({
      canvas: this.canvas,
      context: this.canvas.getContext('webgl')
    });
    this.camera = new PerspectiveCamera(fov, 0, near, far);
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
    this.variables = pipe.variables;
    const n = pipe.variables.n.value;
    const i = new Float32Array(n);
    i.forEach((_, k) => (i[k] = k));
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
    const fragmentShader = fragment(hsv, this.variables);

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
