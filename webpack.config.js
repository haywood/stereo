const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin')
const { CleanWebpackPlugin } = require('clean-webpack-plugin');
const ThreadsPlugin = require('threads-plugin');

module.exports = {
  mode: 'development',
  entry: ['./src/client/index.ts'],
  devtool: 'inline-source-map',
  devServer: {
    contentBase: '.dist',
  },
  output: {
    filename: 'stereo.js',
    path: path.resolve(__dirname, '.dist'),
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
  ]
};
