const webpack = require('webpack');
const nodeExternals = require('webpack-node-externals');

module.exports = {
    entry: './src/server.js',
    target: 'node',
    externals: [nodeExternals()],
    output: {
        path: __dirname + '/dist',
		publicPath: '/',
		filename: 'bundle.js'
    },
    module: {
        loaders: [{
            test: /\.js?$/,
            exclude: /node_modules/,
            loader: 'babel-loader',
            query: {
                presets: ['es2015']
            }
        }]
    },
    plugins: [
        new webpack.optimize.UglifyJsPlugin({
            compress: {
                warnings: false
            },
            output: {
                comments: false
            }
        })
    ]
};
