const merge = require('webpack-merge')
const common = require('./webpack.config.common')
const UglifyJsPlugin = require('uglifyjs-webpack-plugin')
const DeployResourcePlugin = require('./Plugin/DeployResourcePlugin')
const HtmlWebpackPlugin = require('html-webpack-plugin')

module.exports = merge(common, {
    plugins: [
        new HtmlWebpackPlugin({
            title: 'Drafter Stage',
            template: 'index.html'
        }),
        // new UglifyJsPlugin(),
        new DeployResourcePlugin(),
    ]
})