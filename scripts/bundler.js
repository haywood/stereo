const Bundler = require('parcel-bundler');
const path = require('path');

const root = path.resolve(__dirname, '..');
const src = path.resolve(root, 'src');
const index = path.resolve(src, 'index.html');
const audioWorklet = path.resolve(src, 'audio', 'worklet.ts');

const entryFiles = [index, audioWorklet];
const publicUrl = './';

exports.root = root;

exports.newBundler = (options = {}) =>
  new Bundler(entryFiles, {
    ...options,
    publicUrl
  });
