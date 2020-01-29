const { newBundler, root } = require('./bundler');
const path = require('path');

const outDir = path.resolve(root, 'stereo');

newBundler({ outDir }).bundle();
