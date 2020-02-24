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
      uniforms: {
        n: { value: 0 }
      },
      vertexShader: `
      uniform int n;

      vec3 lattice_01(int d) {
        float branching_factor = round(pow(float(n), 1. / float(d)));
        vec3 x;

        for (int k = 0; k < d; k++) {
          float exp = float(d - k - 1);
          float dividend = round(position[0] / pow(branching_factor, exp));
          x[k] = float(int(dividend) % int(branching_factor)) / (branching_factor - 1.);
        }

        return x;
      }

      vec3 interval(int d, vec3 x) {
        vec3 a = vec3(-1.);
        vec3 b = vec3(1.);
        vec3 y;

        for (int k = 0; k < d; k++) {
          y[k] = a[k] + x[k] * (b[k] - a[k]);
        }

        return y;
      }

      void main() {
        int d = 3;
        vec3 x = lattice_01(d);
        vec3 y = interval(d, x);

        vec4 mvPosition = modelViewMatrix * vec4(y, 1.);
        gl_PointSize = -400. * ${near} / mvPosition.z;
        gl_Position = projectionMatrix * mvPosition;
      }
      `,

      fragmentShader: `
      void main() {
        gl_FragColor = vec4(1.);
      }
      `
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
    const { n } = chunk;

    this.material.uniforms.n.value = n;
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
