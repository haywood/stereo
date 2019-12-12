#!/usr/bin/env ts-node

const { spawn, exec } = require('child_process');
const { join } = require('path');

main();

async function main() {
    const webpackServerConfig = join(__dirname, 'webpack.server.config.js');
    const webpackClientConfig = join(__dirname, 'webpack.client.config.js');
    const server = join(__dirname, '.server_dist', 'server.js');

    // build once
    await exec(`npx webpack --config ${webpackServerConfig}`);

    spawn('npx', ['webpack', '--config', webpackServerConfig, '--watch'], { stdio: 'inherit' });
    spawn('npx', ['webpack-dev-server', '--config', webpackClientConfig], { stdio: 'inherit' });
    spawn('npx', ['nodemon', server], { stdio: 'inherit' });
}