import { combineLatest } from 'rxjs';
import { audioStream } from '../audio';
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
import { inputs } from '../inputs';
import { PipeNode, Variables } from '../inputs/pipe/ast';
import * as ast from '../inputs/pipe/ast';
import { HSV, Scope } from '../types';
import { defines, far, fov, near, screenSize, safeName } from './shader/common';
import { fragment } from './shader/fragment';
import { vertex } from './shader/vertex';

const BC = ast.BuiltinConstant;

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

  private pipe: ast.PipeNode;
  private hsv: HSV;
  private t0 = Date.now() / 1000;

  constructor() {
    this.renderer.setAnimationLoop(() => this.render());
    this.camera.position.z = 2;
    this.scene.add(new Points(this.geometry, this.material));
    this.keepAwake();
    this.setSize();

    const i = new Float32Array(screenSize);
    i.forEach((_, k) => (i[k] = k));
    this.geometry.setAttribute('position', new BufferAttribute(i, 1));

    inputs.pipe.stream.subscribe(({ newValue: pipe }) => {
      this.setPipe(pipe);
    });

    combineLatest(inputs.h.stream, inputs.s.stream, inputs.v.stream).subscribe(
      () => {
        this.setHsv({
          h: inputs.h.value,
          s: inputs.s.value,
          v: inputs.v.value
        });
      }
    );

    audioStream.subscribe(audio => {
      this.setScope({ audio });
    });

    inputs.save.stream.subscribe(async () => {
      const blob = await this.renderPng();
      const url = URL.createObjectURL(blob);
      try {
        const a = document.createElement('a');
        a.download = `stereo${document.location.hash}`;
        a.href = url;
        a.click();
      } finally {
        URL.revokeObjectURL(url);
      }
    });

    window.onresize = () => this.setSize();
  }

  private setPipe(pipe: PipeNode) {
    this.pipe = pipe;
    this.setShaders();
  }

  private setHsv(hsv: HSV) {
    this.hsv = hsv;
    this.setShaders();
  }

  private setScope(scope: Scope) {
    const {
      material: { uniforms }
    } = this;

    Object.entries(scope).forEach(([name, value]) => {
      uniforms[name] = { value };
    });
  }

  private renderPng(): Promise<Blob> {
    this.render(); // need to call render first, since three.js clears the draw buffers
    return new Promise(r => this.canvas.toBlob(r));
  }

  private setSize() {
    const width = window.innerWidth;
    const height = window.innerHeight;
    const aspect = width / height;

    this.renderer.setSize(width, height, false);
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
  }

  private setShaders() {
    if (!this.pipe || !this.hsv) return;

    const vertexShader = vertex(this.pipe);
    const fragmentShader = fragment(this.hsv, this.pipe.variables);
    const { material } = this;

    material.vertexShader = vertexShader;
    material.fragmentShader = fragmentShader;
    material.needsUpdate = true;
  }

  private render() {
    if (inputs.animate.value) {
      const {
        material: { uniforms },
        t0
      } = this;
      uniforms[safeName(BC.TIME)] = { value: Date.now() / 1000 - t0 };
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

