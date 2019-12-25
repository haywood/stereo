const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const { CleanWebpackPlugin } = require('clean-webpack-plugin');
const ThreadsPlugin = require('threads-plugin');
const FaviconsWebpackPlugin = require('favicons-webpack-plugin');
const TerserPlugin = require('terser-webpack-plugin');

const src = path.resolve(__dirname, 'src/client');

module.exports = {
  target: 'web',
  entry: {
    index: path.resolve(src, 'index.ts'),
  },
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: '[name].[hash].js',
  },
  optimization: {
    usedExports: true,
    splitChunks: {
      chunks: 'all',
    },
    minimizer: [
      new TerserPlugin({ terserOptions: { module: true } })
    ],
  },
  module: {
    rules: [
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
    }),
    new ThreadsPlugin({ globalObject: 'self' }),
    new FaviconsWebpackPlugin({
      logo: path.resolve(__dirname, 'logo.png'),
      prefix: 'public/',
    }),
  ],
};
