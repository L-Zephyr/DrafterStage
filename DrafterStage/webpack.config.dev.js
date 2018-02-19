const merge = require('webpack-merge')
const common = require('./webpack.config.common')
const HtmlWebpackPlugin = require('html-webpack-plugin')

module.exports = merge(common, {
    plugins: [
        new HtmlWebpackPlugin({
            title: 'Drafter Stage',
            template: 'index.dev.html'
        }),
    ]
})