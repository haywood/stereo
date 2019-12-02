const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin')

module.exports = {
  mode: 'development',
  entry: ['./src/client/index.ts'],
  devtool: 'inline-source-map',
  output: {
    filename: 'stereo.js',
    path: path.resolve(__dirname, '.dist'),
    publicPath: '/public',
  },
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: 'ts-loader',
        exclude: '/node_modules/',
      }
    ]
  },
  resolve: {
    extensions: [ '.tsx', '.ts', '.js' ],
  },
  plugins: [
    new HtmlWebpackPlugin({
      title: 'Stereo',
    })
  ]
};
