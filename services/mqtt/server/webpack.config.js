const webpack = require('webpack');
const nodeExternals = require('webpack-node-externals');

module.exports = {
    entry: './src/server.js',
    target: 'node',
    externals: [nodeExternals()],
    output: {
        path: __dirname + '/dist',
		publicPath: '/',
		filename: 'mqtt.js'   //bundle
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

    ]
};
