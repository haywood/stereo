const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const { CleanWebpackPlugin } = require('clean-webpack-plugin');
const ThreadsPlugin = require('threads-plugin');
const FaviconsWebpackPlugin = require('favicons-webpack-plugin');
const src = path.resolve(__dirname, 'src/client');

module.exports = {
  target: 'web',
  entry: {
    index: path.resolve(src, 'index.ts'),
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
      {
        test: /\.pegjs$/,
        loader: 'pegjs-loader?allowedStartRules[]=pipe,allowedStartRules[]=arith',
      },
    ]
  },
  resolve: {
    extensions: ['.tsx', '.ts', '.js', '.pegjs'],
  },
  plugins: [
    new CleanWebpackPlugin(),
    new HtmlWebpackPlugin({
      title: 'Stereo',
    }),
    new ThreadsPlugin({ globalObject: 'self' }),
    new FaviconsWebpackPlugin(path.resolve(__dirname, 'logo.png')),
  ],
};
