const path = require('path');
const webpack = require('webpack');
const CleanWebpackPlugin = require('clean-webpack-plugin');

const ENV = process.env.NODE_ENV || 'development';

module.exports = {
    entry: {
        index: './src/index.js'
    },
    output: {
        filename: `[name].min.js`,
        library: 'default',
        libraryTarget: 'umd'
    },
    devtool: 'source-map',
    resolve: {
        extensions: ['.js'],
        modules: [__dirname, path.join(__dirname, 'node_modules')],
        alias: {
            '~': path.join(__dirname, 'src')
        }
    },
    module: {
        rules: [
            {
                test: /\.(js|vue)$/,
                loader: 'eslint-loader',
                enforce: 'pre',
                exclude: /node_modules/,
                options: {
                    formatter: require('eslint-friendly-formatter')
                }
            },
            {
                test: /\.js$/,
                loader: 'babel-loader',
                exclude: /node_modules/,
                include: [__dirname]
            }
        ]
    },
    plugins: [
        new webpack.DefinePlugin({'process.env.NODE_ENV': JSON.stringify(ENV)}),
        new CleanWebpackPlugin([path.join(path.resolve('./dist'), '*')], {verbose: true}),
    ]
};
