import Sphere from "../components/sphere";
import styled from "styled-components";
import { pi, flatten, Matrix, size } from "mathjs";
import {
  BufferGeometry,
  BufferAttribute,
  PointsMaterial,
  Geometry,
  Points,
  VertexColors,
  Scene,
  Color,
  Vector3,
  PerspectiveCamera,
  WebGLRenderer,
  BoxGeometry,
  MeshBasicMaterial,
  Mesh
} from "three";
import React from "react";

const PI = Math.PI;
const fieldOfView = 100; // degrees
const near = 0.1;
const far = 1000;
const DEFAULT_DIMENSION = 3;
const DEFAULT_ORDER = 16;

const COORDINATE_FUNCTIONS = [
  "abs",
  "cbrt",
  "ceil",
  "clz32",
  "cos",
  "cosh",
  "exp",
  "floor",
  "log",
  "log10",
  "log1p",
  "log2",
  "sign",
  "sin",
  "sinh",
  "sqrt",
  "tan",
  "tanh",
  "trunc"
].reduce(
  (norms, name) => {
    norms[name] = Math[name];
    return norms;
  },
  {
    sincos: (r, phi) => r * Math.sin(phi) * Math.cos(phi),
    sincosp: (r, phi) => r * (Math.sin(phi) + Math.cos(phi))
  }
);

class ThreeDemo extends React.Component {
  readonly points: Points = new Points(
    new BufferGeometry(),
    new PointsMaterial({
      vertexColors: VertexColors,
      size: 0.01
    })
  );

  camera?: PerspectiveCamera;
  renderer?: WebGLRenderer;
  scene?: Scene;

  state: {
    dimension: number;
    order: number;
    theta: { value: number; d0: number; d1: number };
    count: number;
    f0: string;
    f1: string;
    nextFrame?: number;
    points?: number[][];
    animate: boolean;
  } = {
    dimension: DEFAULT_DIMENSION,
    order: DEFAULT_ORDER,
    theta: { value: 0, d0: 0, d1: 2 },
    f0: "cos",
    f1: "sin",
    count: 0,
    animate: true
  };

  componentDidMount() {
    // make room for control pannel
    const width = window.innerWidth;
    const height = window.innerHeight;
    const aspect = width / height;

    this.camera = new PerspectiveCamera(fieldOfView, aspect, near, far);
    this.camera.position.z = 2;

    this.scene = new Scene();
    this.scene.add(this.points);

    this.renderer = new WebGLRenderer();
    this.renderer.setSize(width, height);

    this.setState({
      nextFrame: requestAnimationFrame(this.animate.bind(this))
    });
  }

  componentWillUnmount() {
    const { nextFrame } = this.state;
    if (nextFrame) {
      cancelAnimationFrame(nextFrame);
    }
  }

  draw() {
    const geometry = this.points.geometry as BufferGeometry;
    const { dimension, order, theta, f0, f1 } = this.state;

    const sphere = new Sphere(dimension, order);
    sphere.f0 = COORDINATE_FUNCTIONS[f0];
    sphere.f1 = COORDINATE_FUNCTIONS[f1];
    const points = sphere.rotate(theta).valueOf() as number[][];
    const colors = flatten(sphere.points).valueOf() as number[];
    const vertices = flatten(points).valueOf() as number[];

    geometry.setAttribute(
      "position",
      new BufferAttribute(new Float32Array(vertices), 3)
    );
    geometry.setAttribute(
      "color",
      new BufferAttribute(
        new Float32Array(colors.map((x, n) => (x + 1) / 2)),
        3
      )
    );

    this.renderer.render(this.scene, this.camera);
    this.setState({ points: points });
  }

  animate() {
    const { theta } = this.state;
    this.draw();
    this.setState({
      theta: {
        value: theta.value - (20 * (PI / 180)) / 60,
        d0: theta.d0,
        d1: theta.d1
      },
      nextFrame: this.state.animate
        ? requestAnimationFrame(this.animate.bind(this))
        : null
    });
  }

  setStateAndDraw(state) {
    this.setState(state, () => this.draw());
  }

  render() {
    const onDimensionChange = event => {
      const dimension = parseInt(event.target.value);
      const { theta } = this.state;
      this.setStateAndDraw({
        dimension,
        theta: { value: theta.value, d0: 0, d1: dimension < 3 ? 1 : 2 }
      });
    };
    const onOrderChange = event => {
      this.setStateAndDraw({ order: parseInt(event.target.value) });
    };
    const onF0Change = event =>
      this.setStateAndDraw({ f0: event.target.value });
    const onF1Change = event =>
      this.setStateAndDraw({ f1: event.target.value });
    const onAnimateChange = event =>
      this.setState({ animate: event.target.checked }, () => this.animate());

    const dimensions = Array.from(new Array(4).keys()).map(d => d + 1);
    const orders = Array.from(new Array(10).keys()).map(x => 2 ** x);
    const coordinateFunctions = Object.keys(COORDINATE_FUNCTIONS);

    return (
      <Component>
        <div id="control-panel">
          <div>
            <label>Dimension</label>
            <select value={this.state.dimension} onChange={onDimensionChange}>
              {dimensions.map(d => (
                <option value={d}>{d}</option>
              ))}
            </select>
          </div>
          <div>
            <label>Order</label>
            <select value={this.state.order} onChange={onOrderChange}>
              {orders.map(d => (
                <option value={d}>{d}</option>
              ))}
            </select>
          </div>
          <div>
            <label>
              f<sub>0</sub>
            </label>
            <select value={this.state.f0} onChange={onF0Change}>
              {coordinateFunctions.map(f => (
                <option value={f}>{f}</option>
              ))}
            </select>
          </div>
          <div>
            <label>
              f<sub>1</sub>
            </label>
            <select value={this.state.f1} onChange={onF1Change}>
              {coordinateFunctions.map(f => (
                <option value={f}>{f}</option>
              ))}
            </select>
          </div>
          <div>
            <label>Point Count </label>
            <span>{this.state.points && size(this.state.points)[0]}</span>
          </div>
          <div>
            <label>Animate</label>
            <input
              type="checkbox"
              checked={this.state.animate}
              onChange={onAnimateChange}
            />
          </div>
        </div>
        {this.chartComponent()}
      </Component>
    );
  }

  chartComponent() {
    if (this.renderer) {
      return (
        <div ref={el => el && el.appendChild(this.renderer.domElement)}></div>
      );
    } else {
      return <div></div>;
    }
  }
}

const Index = () => <ThreeDemo />;

const Component = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  flex-wrap: wrap;

  #chart {
    flex: 1;
  }

  #control-panel {
    display: flex;
    place-content: center center;
    font-size: 16px;
    gap: 5px;

    div {
      padding: 8px;
    }
  }
`;

export default Index;
