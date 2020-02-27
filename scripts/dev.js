const { newBundler, root } = require('./bundler');
const express = require('express');
const path = require('path');

const bundler = newBundler({
  logLevel: 4
});

bundler.bundle();

express()
  .use('/stereo', bundler.middleware())
  .use('/stereo', express.static(path.resolve(root, 'dist')))
  .listen(8080);
