const { newBundler, root } = require('./bundler');
const express = require('express');
const path = require('path');

newBundler().bundle();

express()
  .use('/stereo', express.static(path.resolve(root, 'dist')))
  .listen(8080);
