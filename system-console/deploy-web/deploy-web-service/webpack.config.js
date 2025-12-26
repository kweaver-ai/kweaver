
const path = require('path');
const { CleanWebpackPlugin } = require('clean-webpack-plugin');

module.exports = {
  mode: 'development',
  entry: [
    './index.js'
  ],
  target: 'node',
  output: {
    path: path.resolve(__dirname, 'build'),
    filename: 'bundle.js',
    publicPath: 'build/'
  },
  resolve: {
    extensions: ['.ts', '.js']
  },
  plugins: [new CleanWebpackPlugin()],
  module: {
    rules: [
      {
        use: [
          {
            loader: 'ts-loader',
            options: {
              transpileOnly: true
            }
          }
        ],
        test: /\.ts$/,
      },
      {
        use: 'babel-loader',
        exclude: /(node_modules)/,
        test: /\.js$/
      }
    ]
  }
}