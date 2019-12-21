const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const { CleanWebpackPlugin } = require('clean-webpack-plugin');
const ThreadsPlugin = require('threads-plugin');
const FaviconsWebpackPlugin = require('favicons-webpack-plugin');
const src = path.resolve(__dirname, 'src/client');
const ForkTsCheckerWebpackPlugin = require('fork-ts-checker-webpack-plugin');

module.exports = {
  target: 'web',
  mode: 'development',
  entry: {
    index: path.resolve(src, 'index.ts'),
  },
  devtool: 'inline-source-map',
  watchOptions: {
    aggregateTimeout: 1500,
    ignored: ['node_modules']
  },
  output: {
    path: path.resolve(__dirname, '.client_dist'),
    filename: '[name].js',
    globalObject: 'self',
  },
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        loader: 'ts-loader',
        exclude: '/node_modules/',
        options: {
          transpileOnly: true,
        }
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
    new FaviconsWebpackPlugin('logo.svg'),
    new ForkTsCheckerWebpackPlugin(),
  ],
};
