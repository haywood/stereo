const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const { CleanWebpackPlugin } = require('clean-webpack-plugin');
const ThreadsPlugin = require('threads-plugin');

const src = path.resolve(__dirname, 'src/client');

module.exports = {
  target: 'web',
  entry: {
    index: path.resolve(src, 'index.ts'),
  },
  output: {
    path: path.resolve(__dirname, 'stereo'),
    filename: '[name].[hash].js',
    publicPath: '/stereo/',
    globalObject: 'self',
  },
  module: {
    rules: [
      {
        test: /\.worklet\.ts$/,
        use: 'worklet-loader',
      },
      {
        // Include ts, tsx, js, and jsx files.
        test: /\.(ts|js)x?$/,
        exclude: /node_modules/,
        loader: 'babel-loader',
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
      favicon: path.resolve(__dirname, 'logo.png'),
    }),
    new ThreadsPlugin(),
  ],
};
