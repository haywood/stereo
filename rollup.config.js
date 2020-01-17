import commonjs from '@rollup/plugin-commonjs';
import resolve from '@rollup/plugin-node-resolve';
import typescript from '@rollup/plugin-typescript';
import path from 'path';
import copy from 'rollup-plugin-copy';
import dev from 'rollup-plugin-dev';
import livereload from 'rollup-plugin-livereload';
import builtins from 'rollup-plugin-node-builtins';
import globals from 'rollup-plugin-node-globals';
import notify from 'rollup-plugin-notify';
import pegjs from 'rollup-plugin-pegjs';
import progress from 'rollup-plugin-progress';
import scss from 'rollup-plugin-scss';
import { terser } from 'rollup-plugin-terser';

const out = path.resolve(__dirname, 'stereo');
const watch = process.env.ROLLUP_WATCH === 'true';

const common = {
  output: {
    dir: out,
    sourcemap: true,
    plugins: [terser()]
  },
  plugins: [
    globals(),
    builtins(),
    resolve(),
    commonjs(),
    typescript(),
    progress(),
    notify()
  ]
};

export default [main(), worker(), worklet()];

function main() {
  const plugins = [
    ...common.plugins,
    scss({
      output: path.resolve(out, 'stereo.css')
    }),
    pegjs({
      allowedStartRules: ['pipe', 'scalar']
    }),
    copy({
      targets: [
        { src: 'src/web/index.html', dest: out },
        { src: 'src/web/logo.png', dest: out }
      ]
    })
  ];

  if (watch) {
    plugins.push(livereload(out), dev());
  }

  return {
    input: {
      stereo: 'src/web/index.ts'
    },
    output: {
      ...common.output,
      format: 'es'
    },
    plugins
  };
}

function worker() {
  return {
    input: {
      'pipe/worker': 'src/pipe/worker.ts'
    },
    output: {
      ...common.output,
      format: 'iife'
    },
    plugins: common.plugins
  };
}

function worklet() {
  return {
    input: {
      'audio/worklet': 'src/audio/worklet.ts'
    },
    output: {
      ...common.output,
      format: 'iife'
    },
    plugins: common.plugins
  };
}
