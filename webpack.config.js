'use strict';
//var webpack = require('webpack'),
//    path = require('path');


module.exports = {
    entry: "./app/scripts/index.js",
    output: {
        path: __dirname + "/app/scripts/dist",
        filename: "bundle.js"
    },
    module: {
        loaders: [
            {
                test: /\.css$/,
                loader: "style!css"
            },
            {
                test: require.resolve('snapsvg'),
                loader: 'imports-loader?this=>window,fix=>module.exports=0'
            }
        ]
    }
};
