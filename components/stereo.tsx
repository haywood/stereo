import * as React from "react";
import Picker from "./picker";
import styled from "styled-components";
import SphereGenerator from "../lib/sphere_generator";
import FancyNumberSphereGenerator from "../lib/fancy_number_sphere_generator";
import { FancyNumber } from "../lib/fancy_number";
import Scene from "./scene";
import { evaluate, pi, tau, format, round } from "mathjs";
import Projector from "./projector";
import Rotator from "../lib/rotator";
import DimensionPicker from "./dimension_picker";
import CubeGenerator from "../lib/cube_generator";
import FancyNumberCubeGenerator from "../lib/fancy_number_cube_generator";

class Domain {
  constructor(
    readonly name: string,
    readonly dimension: number,
    readonly generatorClass,
    readonly ranges: Range[],
    readonly defaultRange: Range = ranges[0]
  ) {}
  get id() {
    return this.name.toLowerCase().replace(/\s+/g, "_");
  }

  newGenerator() {
    return new this.generatorClass(10000, this.dimension);
  }
}

class Range {
  constructor(readonly name: string, readonly dimension: number) {}

  get id() {
    return this.name.toLowerCase().replace(/\s+/g, "_");
  }
}

const rn = d => new Range(`R${d}`, d);
const RANGES = {
  r1: rn(1),
  r2: rn(2),
  r3: rn(3),
  r4: rn(4),
  r5: rn(5),
  r6: rn(6),
  r7: rn(7),
  r8: rn(8),
  r9: rn(9),
  r10: rn(10)
};
const rangeList = Object.values(RANGES);

const DOMAINS = {
  quaternion_cube: new Domain(
    "Quaternion Cube",
    4,
    FancyNumberCubeGenerator,
    rangeList.slice(0, 4).reverse(),
    RANGES.r3
  ),
  unit_4_cube: new Domain(
    "Unit 4 Cube",
    4,
    CubeGenerator,
    rangeList.slice(0, 4).reverse(),
    RANGES.r4
  ),
  unit_3_cube: new Domain(
    "Unit 3 Cube",
    3,
    CubeGenerator,
    rangeList.slice(0, 3).reverse(),
    RANGES.r3
  ),
  unit_2_cube: new Domain(
    "Unit 2 Cube",
    2,
    CubeGenerator,
    rangeList.slice(0, 2).reverse(),
    RANGES.r2
  ),
  quaternion: new Domain(
    "Quaternion",
    4,
    FancyNumberSphereGenerator,
    rangeList.slice(0, 4).reverse(),
    RANGES.r3
  ),
  quaternion_r3: new Domain(
    "Quaternion R3",
    3,
    FancyNumberSphereGenerator,
    rangeList.slice(0, 3).reverse(),
    RANGES.r3
  ),
  octonion: new Domain(
    "Octonion",
    8,
    FancyNumberSphereGenerator,
    rangeList.slice(0, 8).reverse(),
    RANGES.r4
  ),
  r2: new Domain(
    "R2",
    2,
    SphereGenerator,
    rangeList.slice(0, 2).reverse(),
    RANGES.r2
  ),
  r3: new Domain(
    "R3",
    3,
    SphereGenerator,
    rangeList.slice(0, 3).reverse(),
    RANGES.r3
  ),
  r4: new Domain(
    "R4",
    4,
    SphereGenerator,
    rangeList.slice(0, 4).reverse(),
    RANGES.r4
  )
};
const DEFAULT_DOMAIN = DOMAINS.quaternion;

export default class Stereo extends React.Component {
  generator;
  state = {
    animate: true,
    domain: DEFAULT_DOMAIN.id,
    range: DEFAULT_DOMAIN.defaultRange.id,
    phi: "pi / 150",
    d0: 0,
    d1: DEFAULT_DOMAIN.dimension - 1
  };

  constructor(props) {
    super(props);
    this.resetSphere();
  }

  get points() {
    const { generator } = this;
    const { domain } = this.state;
    return generator.points;
  }

  componentDidMount() {
    window["stereo"] = this;
  }

  resetSphere = () => {
    this.generator = DOMAINS[this.state.domain].newGenerator();
  };

  generatePoints = () => {
    const { domain, range, phi, d0, d1 } = this.state;
    this.generator.rotate({ phi: evaluate(phi), d0, d1 });
    return Projector.stereo(
      this.points,
      DOMAINS[domain].dimension,
      RANGES[range].dimension
    );
  };

  render() {
    // TODO scene.width should be 100vw - controlPanel.width
    // TODO scene.height should be 100vh
    return (
      <Component>
        <Scene
          id="scene"
          dimension={RANGES[this.state.range].dimension}
          points={this.generatePoints}
          width={1400}
          height={900}
        ></Scene>
        <div id="control_panel">
          <fieldset>
            <h3>Basic Settings</h3>
            <div>
              <label>Point Count</label>
              <span>{this.points.length}</span>
            </div>
            <Picker
              label="Domain"
              initialValue={this.state.domain}
              options={Object.values(DOMAINS).map(d => ({
                value: d.id,
                text: d.name
              }))}
              onChange={this.onDomainChange}
            ></Picker>
            <Picker
              label="Range"
              initialValue={this.state.range}
              options={DOMAINS[this.state.domain].ranges.map(r => ({
                value: r.id,
                text: r.name
              }))}
              onChange={this.onRangeChange}
            ></Picker>
          </fieldset>
          <fieldset>
            <h3>Rotation Settings</h3>
            <div>
              <label>Rate</label>
              <input
                value={this.state.phi}
                required={true}
                // TODO delay evaluation until loss of focus
                onChange={this.onPhiChange}
              />
              rad/s
            </div>
            <DimensionPicker
              label="D0"
              min={0}
              max={DOMAINS[this.state.domain].dimension - 1}
              initialValue={this.state.d0}
              onChange={this.onD0Change}
            ></DimensionPicker>
            <DimensionPicker
              label="D1"
              min={0}
              max={DOMAINS[this.state.domain].dimension - 1}
              initialValue={this.state.d1}
              onChange={this.onD1Change}
            ></DimensionPicker>
          </fieldset>
          <fieldset>
            <h3>Orientation Settings</h3>
          </fieldset>
        </div>
      </Component>
    );
  }

  onDomainChange = domain => {
    const range = DOMAINS[domain].defaultRange.id;
    const d0 = 0;
    const d1 = DOMAINS[domain].dimension - 1;

    return this.setState({ domain, range, d0, d1 }, this.resetSphere);
  };

  onRangeChange = range => {
    this.setState({ range }, this.resetSphere);
  };

  onPhiChange = event => {
    const phi = event.target.value;
    this.setState({ phi }, this.resetSphere);
  };

  onD0Change = d0 => {
    this.setState({ d0 }, this.resetSphere);
  };

  onD1Change = d1 => {
    this.setState({ d1 }, this.resetSphere);
  };
}

const Component = styled.div`
  #control_panel {
    padding: 16px;
    position: absolute;
    top: 0;
    right: 0;
    width: 200px;

    fieldset {
      border: none;
    }

    label {
      padding-right: 8px;
    }
  }
`;
