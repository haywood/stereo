import * as React from "react";
import styled from "styled-components";
import Sphere2 from "./sphere2";
import Scene from "./scene";
import { evaluate, pi, tau, format, round } from "mathjs";
import Projector from "./projector";
import Rotator from "./rotator";
import DimensionPicker from "./dimension_picker";

// TODO add controls for
// - animation on/off
// - initial orientation
export default class Stereo extends React.Component {
  points = [];
  sphere;
  count = 0;
  state = {
    animate: true,
    from: 4,
    to: 3,
    rotation: { phi: "pi / 150", d0: 0, d1: 3 }
  };

  constructor(props) {
    super(props);
    this.resetSphere();
  }

  resetSphere = () => {
    const { from: d } = this.state;
    this.sphere = new Sphere2(1, d);
    this.points = this.sphere.sample(
      2000,
      new Array(d - 1).fill(0),
      new Array(d - 1).fill(tau)
    );
  };

  generatePoints = () => {
    const { from, to, rotation } = this.state;
    const { phi, d0, d1 } = rotation;
    if (this.count > 0) {
      for (const p of this.points) {
        Rotator.rotatePoint(p, { phi: evaluate(phi), d0, d1 });
      }
    }
    this.count++;
    return Projector.stereo(this.points, from, to);
  };

  render() {
    // TODO scene.width should be 100vw - controlPanel.width
    // TODO scene.height should be 100vh
    return (
      <Component>
        <Scene
          id="scene"
          dimension={this.state.to}
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
            <DimensionPicker
              label="From"
              min={this.state.to}
              max={10}
              initialValue={this.state.from}
              onChange={this.onFromChange}
            ></DimensionPicker>
            <DimensionPicker
              label="To"
              min={1}
              max={this.state.from}
              initialValue={this.state.to}
              onChange={this.onToChange}
            ></DimensionPicker>
          </fieldset>
          <fieldset>
            <h3>Rotation Settings</h3>
            <div>
              <label>Rate</label>
              <input
                value={this.state.rotation.phi}
                required={true}
                // TODO delay evaluation until loss of focus
                onChange={this.onPhiChange}
              />
              rad/s
            </div>
            <DimensionPicker
              label="D0"
              min={0}
              max={this.state.from - 1}
              initialValue={this.state.rotation.d0}
              onChange={this.onD0Change}
            ></DimensionPicker>
            <DimensionPicker
              label="D1"
              min={0}
              max={this.state.from - 1}
              initialValue={this.state.rotation.d1}
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

  onFromChange = (from: number) => {
    const { phi } = this.state.rotation;
    this.setState(
      { from, rotation: { phi, d0: 0, d1: from - 1 } },
      this.resetSphere
    );
  };

  onToChange = (to: number) => {
    this.setState({ to }, this.resetSphere);
  };

  onPhiChange = event => {
    const { rotation } = this.state;
    const phi = event.target.value;
    this.setState({ rotation: { ...rotation, phi } }, this.resetSphere);
  };

  onD0Change = d0 => {
    const { rotation } = this.state;
    this.setState({ rotation: { ...rotation, d0 } }, this.resetSphere);
  };

  onD1Change = d1 => {
    const { rotation } = this.state;
    this.setState({ rotation: { ...rotation, d1 } }, this.resetSphere);
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
