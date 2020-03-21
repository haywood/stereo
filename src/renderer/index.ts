import {
  BufferAttribute,
  BufferGeometry,
  PerspectiveCamera,
  Points,
  Scene,
  ShaderMaterial,
  WebGLRenderer
} from 'three';

import { AUDIO_PLACEHOLDER } from '../audio/constants';
import debug from '../debug';
import { inputs } from '../inputs';
import { PipeNode, Variables } from '../inputs/pipe/ast';
import * as ast from '../inputs/pipe/ast';
import { HSV, Scope } from '../types';
import { defines, far, fov, near, screenSize } from './shader/common';
import { fragment } from './shader/fragment';
import { vertex } from './shader/vertex';

export class Renderer {
  readonly canvas = document.querySelector('canvas');
  private readonly video = document.querySelector('video');
  private readonly geometry = new BufferGeometry();
  private readonly camera = new PerspectiveCamera(fov, 0, near, far);
  private readonly scene = new Scene();
  private readonly renderer = new WebGLRenderer({
    canvas: this.canvas,
    context: this.canvas.getContext('webgl2')
  });
  private readonly material: ShaderMaterial = new ShaderMaterial({
    uniforms: {
      audio: { value: AUDIO_PLACEHOLDER }
    },
    defines
  });

  private variables: Variables;
  private t0: number;

  constructor() {
    this.renderer.setAnimationLoop(() => this.render());
    this.camera.position.z = 2;
    this.scene.add(new Points(this.geometry, this.material));
    this.keepAwake();
    this.setSize();
  }

  setPipe(pipe: PipeNode) {
    const { geometry } = this;

    this.variables = pipe.variables;

    const i = new Float32Array(screenSize);
    i.forEach((_, k) => (i[k] = k));
    const vertexShader = vertex(pipe);

    geometry.setAttribute('position', new BufferAttribute(i, 1));

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

  private keepAwake() {
    const interactions = ['click', 'mousemove'];
    const options = { capture: true };

    this.video.srcObject = this.canvas.captureStream(1);

    inputs.animate.stream.subscribe(({ newValue, event }) => {
      if (newValue) {
        this.video.play();
      } else {
        this.video.pause();
      }
    });

    for (const type of interactions) {
      document.addEventListener(type, listener, options);
    }

    function listener() {
      document.querySelector('video').play();

      for (const type of interactions) {
        document.removeEventListener(type, listener, options);
      }
    }
  }
}

export const renderer = new Renderer();
