const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin')
const { CleanWebpackPlugin } = require('clean-webpack-plugin');
const ThreadsPlugin = require('threads-plugin');

module.exports = {
  target: 'web',
  mode: 'development',
  entry: ['./src/client/index.ts'],
  devtool: 'inline-source-map',
  watchOptions: {
    aggregateTimeout: 1500,
    ignored: ['node_modules']
  },
  devServer: {
    contentBase: '.dist',
  },
  output: {
    path: path.resolve(__dirname, '.client_dist'),
    filename: 'client.js',
  },
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: 'ts-loader',
        exclude: '/node_modules/',
      },
    ]
  },
  resolve: {
    extensions: ['.tsx', '.ts', '.js'],
  },
  plugins: [
    new CleanWebpackPlugin(),
    new HtmlWebpackPlugin({
      title: 'Stereo',
    }),
    new ThreadsPlugin({ globalObject: 'self' }),
  ],
};