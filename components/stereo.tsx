import * as React from "react";
import styled from "styled-components";
import Sphere2 from "./sphere2";
import Scene from "./scene";
import { pi, tau, format, round } from "mathjs";
import Projector from "./projector";
import Rotator from "./rotator";

// TODO add controls for
// - animation on/off
// - from
// - to
// - plane of rotation
export default class Stereo extends React.Component {
  points = [];
  sphere;
  count = 0;
  state = {
    animate: true,
    from: 5,
    to: 3
  };

  constructor(props) {
    super(props);
    this.resetSphere();
  }

  resetSphere() {
    const { from: d } = this.state;
    this.sphere = new Sphere2(1, d);
    this.points = this.sphere.sample(
      2000,
      new Array(d - 1).fill(0),
      new Array(d - 1).fill(tau)
    );
  }

  generatePoints() {
    const { from, to } = this.state;
    if (this.count > 0) {
      for (const p of this.points) {
        Rotator.rotatePoint(p, { phi: pi / 150, d0: 0, d1: from - 1 });
      }
    }
    this.count++;
    return Projector.stereo(this.points, from, to);
  }

  render() {
    return (
      <Scene
        dimension={this.state.to}
        points={() => this.generatePoints()}
      ></Scene>
    );
  }
}

const Component = styled.div``;
