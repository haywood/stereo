#!/bin/bash

set -e

npx webpack --config webpack.server.config.js
npx webpack --config webpack.server.config.js --watch &
npx nodemon .