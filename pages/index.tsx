import Sphere from "../components/sphere";
import GeometryHelper from "../components/geometry_helper";
import LogSpiral from "../components/spiral";
import styled from "styled-components";
import { norm, tau, cos, sin, pi, flatten, Matrix, size } from "mathjs";
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
const FRAMES_PER_SECOND = 60;
const RADIANS_PER_SECOND = PI / 180;
const RATE = 80;
const DEGREES_PER_FRAME = (-RATE * RADIANS_PER_SECOND) / FRAMES_PER_SECOND;

const spiral = new LogSpiral(0.1, 1);
const COORDINATE_FUNCTIONS = [
  "abs",
  "cbrt",
  "ceil",
  "clz32",
  "cos",
  "cosh",
  "exp",
  "floor",
  "log1p",
  "sign",
  "sin",
  "sinh",
  "sqrt",
  "tan",
  "tanh",
  "trunc"
].reduce(
  (fs, name) => {
    fs[name] = Math[name];
    return fs;
  },
  {
    logSpiralX: phi => spiral.x(phi),
    logSpiralY: phi => spiral.y(phi),
    identity: phi => 1
  }
);

const MAX_DIMENSION = 10;
const PLANES_OF_ROTATION = {};
for (let d0 = 0; d0 < MAX_DIMENSION; d0++) {
  for (let d1 = 0; d1 < MAX_DIMENSION; d1++) {
    if (d0 === d1) continue;

    PLANES_OF_ROTATION[`${d0},${d1}`] = { d0, d1 };
  }
}

const DEFAULT_DIMENSIONS = Array.from(new Array(MAX_DIMENSION).keys()).map(
  d => d + 1
);
const DEFAULT_DIMENSION = 3;
const DEFAULT_ORDERS = Array.from(new Array(20).keys());
const DEFAULT_ORDER = 4;
const DEFAULT_MODE = "iterativeRotation";

class ThreeDemo extends React.Component {
  readonly points: Points = new Points(
    new BufferGeometry(),
    new PointsMaterial({
      vertexColors: VertexColors,
      size: 0.02
    })
  );

  camera?: PerspectiveCamera;
  renderer?: WebGLRenderer;
  scene?: Scene;

  state = {
    dimension: DEFAULT_DIMENSION,
    order: null,
    f0: "cos",
    f1: "sin",
    count: 0,
    animate: true,
    nextFrame: null,
    points: null,
    sphere: null,
    orders: safeOrdersForDimension(DEFAULT_DIMENSION, DEFAULT_MODE),
    dimensions: DEFAULT_DIMENSIONS,
    mode: DEFAULT_MODE,
    planeOfRotation: `0,${DEFAULT_DIMENSION - 1}`
  };

  constructor(props) {
    super(props);
    this.state.order = highestOrderForDimension(
      this.state.dimension,
      this.state.mode
    );
    this.state.sphere = this.newSphere();
  }

  setStateAndSphere(state) {
    this.setState(state, () => this.setSphere());
  }

  setSphere() {
    this.setStateAndDraw({ count: 0, sphere: this.newSphere() });
  }

  setStateAndDraw(state) {
    this.setState(state, () => requestAnimationFrame(() => this.draw()));
  }

  newSphere() {
    const { dimension, order, f0, f1, mode } = this.state;

    return new Sphere(
      dimension,
      order,
      COORDINATE_FUNCTIONS[f0],
      COORDINATE_FUNCTIONS[f1],
      mode
    );
  }

  componentDidMount() {
    const width = window.innerWidth;
    const height = window.innerHeight;
    const aspect = width / height;

    this.camera = new PerspectiveCamera(fieldOfView, aspect, near, far);
    this.camera.position.z = 5;

    this.scene = new Scene();
    this.scene.add(this.points);

    this.renderer = new WebGLRenderer();
    this.renderer.setSize(width, height);

    if (this.state.animate) {
      console.log("starting animation");
      this.setState({
        nextFrame: requestAnimationFrame(this.animate.bind(this))
      });
    } else {
      console.log("drawing once");
      this.draw();
    }
  }

  componentWillUnmount() {
    const { nextFrame } = this.state;
    if (nextFrame) {
      cancelAnimationFrame(nextFrame);
    }
  }

  draw() {
    const geometry = this.points.geometry as BufferGeometry;
    const { sphere, count, dimension, planeOfRotation } = this.state;
    if (dimension > 1) {
      const { d0, d1 } = PLANES_OF_ROTATION[planeOfRotation];
      sphere.rotate({
        phi: count * DEGREES_PER_FRAME,
        d0,
        d1
      });
    } else {
      sphere.rotate({
        phi: count * DEGREES_PER_FRAME,
        d0: 0,
        d1: 0
      });
    }
    const vertices = GeometryHelper.vertices(sphere.points, dimension);
    const colors = GeometryHelper.colors(vertices);

    geometry.setAttribute(
      "position",
      new BufferAttribute(new Float32Array(vertices), 3)
    );
    geometry.setAttribute(
      "color",
      new BufferAttribute(new Float32Array(colors), 3)
    );

    this.renderer.render(this.scene, this.camera);
  }

  animate() {
    const { sphere, count, dimension } = this.state;
    this.draw();
    this.setState({
      count: this.nextCount(),
      nextFrame: this.state.animate
        ? requestAnimationFrame(this.animate.bind(this))
        : null
    });
  }

  nextCount() {
    const { sphere, count } = this.state;
    let noneVisible = true;
    for (const p of sphere.points) {
      if (norm(p) < far) {
        noneVisible = false;
        break;
      }
    }
    return noneVisible ? 0 : count + 1;
  }

  render() {
    return (
      <Component>
        {this.controlPanelComponent()}
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

  controlPanelComponent() {
    return (
      <div id="control-panel">
        {this.dimensionPicker()}
        {this.orderPicker()}
        {this.modePicker()}
        {this.f0Picker()}
        {this.f1Picker()}
        {this.planeOfRotationPicker()}
        <div>
          <label>Point Count </label>
          <span>{this.state.sphere && size(this.state.sphere.points)[0]}</span>
        </div>
        {this.animationSwitch()}
        <div>
          <button onClick={() => this.setStateAndDraw({ count: 0 })}>
            Reset Animation
          </button>
        </div>
      </div>
    );
  }

  dimensionPicker() {
    return this.picker(
      "Dimension",
      this.state.dimension,
      this.state.dimensions,
      event => {
        const dimension = parseInt(event.target.value);
        this.setState({ dimension }, () => {
          const { mode } = this.state;
          const orders = safeOrdersForDimension(dimension, mode);
          const order = Math.min(this.state.order, orders[orders.length - 1]);
          const planeOfRotation = `0,${dimension - 1}`;
          this.setStateAndSphere({ order, orders, planeOfRotation });
        });
      }
    );
  }

  planeOfRotationPicker() {
    const { dimension } = this.state;
    const options = [];
    for (const key in PLANES_OF_ROTATION) {
      const { d0, d1 } = PLANES_OF_ROTATION[key];
      if (d0 < dimension && d1 < dimension) {
        options.push(key);
      }
    }
    return this.picker(
      "Plane of Rotation",
      this.state.planeOfRotation,
      options,
      event => {
        this.setState({ planeOfRotation: event.target.value });
      }
    );
  }

  orderPicker() {
    return this.picker("Order", this.state.order, this.state.orders, event => {
      const order = parseInt(event.target.value);
      this.setStateAndSphere({ order });
    });
  }

  modePicker() {
    return this.picker(
      "mode",
      this.state.mode,
      ["iterativeRotation", "halveAndDouble", "arithmeticSpiral", "logSpiral"],
      event => {
        const { dimension } = this.state;
        const mode = event.target.value;
        this.setStateAndSphere({
          mode,
          order: highestOrderForDimension(dimension, mode),
          orders: safeOrdersForDimension(dimension, mode)
        });
      }
    );
  }

  f0Picker() {
    return this.picker(
      "f0",
      this.state.f0,
      Object.keys(COORDINATE_FUNCTIONS),
      event => this.setStateAndSphere({ f0: event.target.value })
    );
  }

  f1Picker() {
    return this.picker(
      "f1",
      this.state.f1,
      Object.keys(COORDINATE_FUNCTIONS),
      event => this.setStateAndSphere({ f1: event.target.value })
    );
  }

  animationSwitch() {
    const onChange = event =>
      this.setState(
        { animate: event.target.checked },
        () => this.state.animate && this.animate()
      );

    return (
      <div>
        <label>Animate</label>
        <input
          type="checkbox"
          checked={this.state.animate}
          onChange={onChange}
        />
      </div>
    );
  }

  picker(label, defaultValue, options, onChange) {
    return (
      <div>
        <label>{label}</label>
        <select value={defaultValue} onChange={onChange}>
          {options.map(o => (
            <option value={o}>{o}</option>
          ))}
        </select>
      </div>
    );
  }
}

function highestOrderForDimension(d: number, mode: string) {
  const orders = safeOrdersForDimension(d, mode);
  return orders[orders.length - 1];
}

function safeOrdersForDimension(d: number, mode: string) {
  return DEFAULT_ORDERS.filter(o => {
    const count = pointCount(o, d, mode);
    console.log(`pointCount(${o}, ${d}) = ${count}`);
    return count <= 2048;
  });
}

function pointCount(o, d, mode) {
  if (mode.endsWith("Spiral") || mode === "iterativeRotation") return 2 ** o;
  else if (mode === "halveAndDouble") {
    let count = d;
    for (let k = 0; k < o; k++) {
      count *= 2 ** k + 1;
    }
    return count;
  } else {
    throw new Error(`Invalid mode ${mode}`);
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
