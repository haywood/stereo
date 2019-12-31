const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const { CleanWebpackPlugin } = require('clean-webpack-plugin');
const ThreadsPlugin = require('threads-plugin');

const src = path.resolve(__dirname, 'src/web');

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
        loader: 'worklet-loader',
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
      {
        test: /\.(png|jpe?g|gif|svg)$/i,
        loader: 'file-loader',
      },
      {
        test: /\.css$/i,
        use: [
          // Creates `style` nodes from JS strings
          'style-loader',
          // Translates CSS into CommonJS
          'css-loader',
        ],
      },
      {
        test: /\.s[ac]ss$/i,
        use: [
          // Creates `style` nodes from JS strings
          'style-loader',
          // Translates CSS into CommonJS
          'css-loader',
          // Compiles Sass to CSS
          'sass-loader',
        ],
      },
      {
        test: /\.(html)$/,
        use: {
          loader: 'html-loader',
        }
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
