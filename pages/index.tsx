import Sphere from "../components/sphere";
import styled from "styled-components";
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
  Mesh,
} from "three";
import React from "react";

const PI = Math.PI;
const fieldOfView = 100; // degrees
const near = 0.1;
const far = 1000;
const DEFAULT_DIMENSION = 3;
const DEFAULT_ORDER = 100;

const simpleNorm = f => (r, phi) => r * f(phi);
const NORMS = [
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
  "trunc",
].reduce(
  (norms, name) => {
    norms[name] = simpleNorm(Math[name]);
    return norms;
  },
  {
    sincos: (r, phi) => r * Math.sin(phi) * Math.cos(phi),
    sincosp: (r, phi) => r * (Math.sin(phi) + Math.cos(phi)),
  },
);

class ThreeDemo extends React.Component {
  readonly points: Points = new Points(
    new BufferGeometry(),
    new PointsMaterial({
      vertexColors: VertexColors,
      size: 0.01,
    }),
  );

  camera?: PerspectiveCamera;
  renderer?: WebGLRenderer;
  scene?: Scene;

  state: {
    dimension: number;
    order: number;
    theta: number[];
    count: number;
    norm: "cos" | "sincos" | "sin";
    nextFrame?: number;
  } = {
    dimension: DEFAULT_DIMENSION,
    order: DEFAULT_ORDER,
    theta: new Array(Math.max(1, DEFAULT_DIMENSION)).fill(0),
    norm: "cos",
    count: 0,
  };

  componentDidMount() {
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
      nextFrame: requestAnimationFrame(this.animate.bind(this)),
    });
  }

  componentWillUnmount() {
    const { nextFrame } = this.state;
    if (nextFrame) {
      cancelAnimationFrame(nextFrame);
    }
  }

  animate() {
    const geometry = this.points.geometry as BufferGeometry;
    const { theta } = this.state;

    const sphere = new Sphere(this.state.dimension, this.state.order);
    sphere.norm = NORMS[this.state.norm];
    const points = sphere.compute(theta);

    const dimension = this.state.dimension;
    if (dimension > 3) {
      for (
        let offset = points.length - dimension + 3;
        offset > 0;
        offset -= dimension
      ) {
        points.splice(offset, dimension - 3);
      }
    }

    geometry.setAttribute(
      "position",
      new BufferAttribute(
        new Float32Array(points),
        Math.max(1, Math.min(dimension, 3)),
      ),
    );
    geometry.setAttribute(
      "color",
      new BufferAttribute(
        new Float32Array(
          points.map((x, n) =>
            Math.abs((n % 2 === 0 ? Math.cos : Math.sin)(x)),
          ),
        ),
        Math.max(1, Math.min(dimension, 3)),
      ),
    );

    this.renderer.render(this.scene, this.camera);

    const dTheta = -(PI / 180) / 60;
    this.setState({
      theta:
        dimension < 2
          ? [theta[0] + dTheta]
          : [...theta.slice(0).map(t => t + dTheta)],
      nextFrame: requestAnimationFrame(this.animate.bind(this)),
    });
  }

  render() {
    const onDimensionChange = event => {
      const dimension = parseInt(event.target.value);
      this.setState(
        {
          dimension,
          theta: new Array(dimension).fill(0),
        },
        () => {},
      );
    };
    const onOrderChange = event => {
      this.setState({ order: parseInt(event.target.value) }, () => {});
    };
    const onNormChange = event => this.setState({ norm: event.target.value });
    const dimensions = Array.from(new Array(4).keys());
    const orders = Array.from(new Array(5).keys()).map(o => 10 ** o);
    const norms = Object.keys(NORMS);
    return (
      <Component>
        <div id="control-panel">
          <span>
            <label>Dimension</label>
            <select value={this.state.dimension} onChange={onDimensionChange}>
              {dimensions.map(d => (
                <option value={d}>{d}</option>
              ))}
            </select>
          </span>
          <span>
            <label>Order</label>
            <select value={this.state.order} onChange={onOrderChange}>
              {orders.map(d => (
                <option value={d}>{d}</option>
              ))}
            </select>
          </span>
          <span>
            <label>Norm</label>
            <select value={this.state.norm} onChange={onNormChange}>
              {norms.map(n => (
                <option value={n}>{n}</option>
              ))}
            </select>
          </span>
        </div>
        <div
          ref={el =>
            this.renderer && el && el.appendChild(this.renderer.domElement)
          }
        ></div>
      </Component>
    );
  }
}

const Index = () => <ThreeDemo />;

const Component = styled.div`
  #control-panel {
    display: grid;
    place-content: center end;
    font-size: 16px;
    gap: 5px;
  }
`;

export default Index;
