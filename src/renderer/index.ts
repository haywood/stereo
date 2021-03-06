import endent from 'endent';
import {
  BufferAttribute,
  BufferGeometry,
  PerspectiveCamera,
  Points,
  Scene,
  ShaderMaterial,
  WebGLRenderer
} from 'three';

import { audioStream } from '../audio';
import { AUDIO_PLACEHOLDER } from '../audio/constants';
import { inputs } from '../inputs';
import { PipeNode } from '../inputs/pipe/ast';
import * as ast from '../inputs/pipe/ast';
import { Scope } from '../types';
import { defines, far, fov, near, safeName } from './shader/common';
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
      audio: { value: AUDIO_PLACEHOLDER },
      dpr: { value: window.devicePixelRatio }
    },
    fragmentShader: endent`
    varying vec4 color;

    void main() {
      gl_FragColor = color;
    }
    `,
    defines
  });

  private pipe: ast.PipeNode;
  private t0 = Date.now() / 1000;

  constructor() {
    this.camera.position.z = 2;
    this.scene.add(new Points(this.geometry, this.material));
    this.keepAwake();
    this.setSize();

    inputs.pipe.stream.subscribe(({ newValue: pipe }) => {
      this.setPipe(pipe);
    });

    audioStream.subscribe(audio => {
      this.setScope({ audio });
    });

    inputs.save.stream.subscribe(async () => {
      // need to call render first, since three.js clears the draw buffers
      this.render();
      const blob = new Promise(r => this.canvas.toBlob(r, 'image/jpeg'));
      const url = URL.createObjectURL(await blob);
      try {
        const a = document.createElement('a');
        a.download = `stereo${document.location.hash}`;
        a.href = url;
        a.click();
      } finally {
        URL.revokeObjectURL(url);
      }
    });

    inputs.animate.stream.subscribe(({ newValue }) => {
      if (newValue) {
        this.renderer.setAnimationLoop(this.animate);
      } else {
        this.renderer.setAnimationLoop(null);
      }
    });

    window.onresize = () => this.setSize();
  }

  private setPipe(pipe: PipeNode) {
    this.pipe = pipe;
    const vertexShader = vertex(this.pipe);
    const { material } = this;

    material.vertexShader = vertexShader;
    material.needsUpdate = true;
  }

  private setScope(scope: Scope) {
    const {
      material: { uniforms }
    } = this;

    Object.entries(scope).forEach(([name, value]) => {
      uniforms[name] = { value };
    });
  }

  private setSize() {
    const width = window.innerWidth;
    const height = window.innerHeight;
    const i = new Float32Array(window.devicePixelRatio * width * height);

    i.forEach((_, k) => (i[k] = k));
    this.geometry.setAttribute('position', new BufferAttribute(i, 1));

    this.renderer.setSize(width, height, false);
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
  }

  private readonly animate = () => {
    const {
      material: { uniforms },
      t0
    } = this;
    uniforms[safeName(BC.TIME)] = { value: Date.now() / 1000 - t0 };
    this.render();
  };

  private render() {
    this.renderer.render(this.scene, this.camera);
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
