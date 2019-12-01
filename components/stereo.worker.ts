import React from "react";
import Interval from "../lib/interval";
import Cube from "../lib/cube";
import Sphere from "../lib/sphere";
import Spiral from "../lib/spiral";
import Torus from "../lib/torus";
import { tau, pi, floor, nthRoot } from "mathjs";
import Projector from "../lib/stereo";
import Rotator from "../lib/rotator";
import { Fn, CompositeFn, components } from "../lib/fn";

const ctx: Worker = self as any;

const sphere = d => new Sphere(d, 1);
const spiral = d => new Spiral(d, 1, new Array(d - 1).fill(1));
const torus = d => new Torus(d, 1, 0.25);
const cube = d => new Cube(d, tau);
const interval = d =>
  new Interval(d, new Array(d).fill(0), new Array(d).fill(tau));

const N = 4096;
const rate = tau / 360;

const seeder = new CompositeFn(2);
seeder.add(sphere(3));
seeder.add(spiral(seeder.d + 1));
seeder.add(torus(seeder.d + 1));
const seed = Array.from(seeder.sample(N));

const pipeline = t => {
  const pipe = new CompositeFn(seed[0].length);
  components(pipe.d - 1).forEach(i => {
    pipe.add(new Rotator(pipe.d, rate * t, 0, i + 1));
  });
  pipe.add(new Projector(pipe.d, 3));
  pipe.add(new Rotator(pipe.d, pi / 5, 1, 2));

  return pipe;
};

let t = 0;
let points;
updatePoints();
const msg = { points };
console.log("sending first message to page", msg);
ctx.postMessage(msg);

ctx.onmessage = msg => {
  if (msg.data.needPoints) {
    const msg = { points };
    ctx.postMessage(msg);
    setImmediate(updatePoints);
  }
};

function updatePoints() {
  points = seed.map(pipeline(t++).fn);
}

export default () => {};
