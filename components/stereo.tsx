import React from "react";
import Scene from "../components/scene";
import Interval from "../lib/interval";
import Cube from "../lib/cube";
import Sphere from "../lib/sphere";
import Spiral from "../lib/spiral";
import Torus from "../lib/torus";
import { tau, pi, floor, nthRoot } from "mathjs";
import Projector from "../lib/stereo";
import Rotator from "../lib/rotator";
import { Fn, CompositeFn, components } from "../lib/fn";
import StereoWorker from "worker-loader?name=static/[hash].worker.js!./stereo.worker";

export default class Stereo extends React.Component {
  worker: Worker;

  state = { points: [] };

  componentDidMount() {
    console.log("setting up web worker");

    this.worker = new StereoWorker();
    this.worker.addEventListener("message", this.onMessage);
    this.worker.postMessage({ needPoints: true });
  }

  componentWillUnmount() {
    const { worker } = this;
    if (worker) {
      worker.terminate();
    }
  }

  onMessage = (msg: any) => {
    const { points } = msg.data;
    if (points) {
      this.setState({ points }, () => {
        this.worker.postMessage({ needPoints: true });
      });
    }
  };

  render() {
    const { points } = this.state;
    const rangeDimension = (points[0] && points[0].length) || 0;
    return (
      <Scene
        id="pipes"
        dimension={rangeDimension}
        points={() => points}
        width={1600}
        height={900}
        animate={true}
      ></Scene>
    );
  }
}
