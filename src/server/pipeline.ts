import Sphere from './sphere';
import Spiral from './spiral';
import Torus from './torus';
import {pi, ones} from 'mathjs';
import Projector from './stereo';
import Rotator from './rotator';
import {CompositeFn, components} from './fn';
import {flatten} from 'mathjs';
import * as tf from '@tensorflow/tfjs-node';

const seeder = new CompositeFn(2);
seeder.add(new Sphere(seeder.d + 1, 1));
seeder.add(new Spiral(seeder.d + 1, 1, ones(seeder.d).valueOf() as number[]));
//seeder.add(new Torus(seeder.d + 1, 1, 0.25));
let seed;

export default (n, t, rate) => {
  if (!seed || n !== seed.length) seed = Array.from(seeder.sample(n));

  const pipe = new CompositeFn(seed[0].length);
  const seconds = t / 1000;
  pipe.add(
    new Rotator(pipe.d, components(pipe.d - 1).map((i) => ({phi: rate * seconds, d0: 0, d1: i + 1})))
  );
  pipe.add(new Projector(pipe.d, 3));
  pipe.add(new Rotator(pipe.d, [{phi: pi / 5, d0: 1, d1: 2}]));

  const position = flatten(seed.map(pipe.fn));
  const d = pipe.d;
  return { position, pipe, seeder, d };
};
