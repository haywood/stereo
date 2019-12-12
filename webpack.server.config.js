const path = require('path');
const { CleanWebpackPlugin } = require('clean-webpack-plugin');
const ThreadsPlugin = require('threads-plugin');

module.exports = {
  target: 'node',
  mode: 'development',
  entry: ['./src/server/index.ts'],
  output: {
    path: path.resolve(__dirname, '.server_dist'),
    filename: 'server.js',
  },
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: 'ts-loader',
        exclude: '/node_modules/',
      },
      {
        test: /\.worker\.js$/,
        use: { loader: 'worker-loader' }
      }
    ]
  },
  resolve: {
    extensions: ['.tsx', '.ts', '.js'],
  },
  plugins: [
    new CleanWebpackPlugin(),
    new ThreadsPlugin({ globalObject: 'self' }),
  ]
}