import {
  PerspectiveCamera,
  BufferGeometry,
  BufferAttribute,
  Points,
  PointsMaterial,
  WebGLRenderer,
  VertexColors,
  Scene
} from 'three';
import {n, color} from './query';

export class Renderer {
  private renderer: WebGLRenderer;
  private scene: Scene;
  private camera: PerspectiveCamera;
  private points: Points;
  private dimension: number;
  private color: number[];

  constructor() {
    this.renderer = new WebGLRenderer();
    this.renderer.setSize(window.innerWidth, window.innerHeight);

    this.camera = new PerspectiveCamera(100, window.innerWidth / window.innerHeight, 0.01, 1000);
    this.camera.position.z = 5;

    this.points = new Points(
      new BufferGeometry(),
      new PointsMaterial({
        vertexColors: VertexColors,
        size: 0.01,
      })
    );

    this.scene = new Scene();
    this.scene.add(this.points);

    this.renderer.setAnimationLoop(this.render);
  }

  get domElement() {
    return this.renderer.domElement;
  }

  render = () => {
    this.renderer.render(this.scene, this.camera)
  }

  update = ({position, d}) => {
    const {points} = this;
    if (position.length) {
      const geometry = points.geometry as BufferGeometry;

      if (d !== this.dimension) {
        this.dimension = d;
        this.color = position.map((x, i) => color.evaluate({x, i}));
      }

      geometry.setAttribute('position', this.newBufferAttribute(position));
      geometry.setAttribute('color', this.newBufferAttribute(this.color));
    }
  }

  newBufferAttribute(value: number[]) {
    return new BufferAttribute(new Float32Array(value), this.dimension);
  }
}
