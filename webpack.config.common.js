const HtmlWebpackPlugin = require('html-webpack-plugin')
const path = require('path')

module.exports = {
    entry: __dirname + '/src/index.js', 
    
    output: {
        path: __dirname + '/public',
        filename: 'bundle.js'
    },

    devtool: 'source-map',

    resolve: {
        alias: {
            vue: 'vue/dist/vue.js'
        }
    },

    devServer: {
        contentBase: "./public",
        historyApiFallback: true,
        inline: true, // 实时刷新
    },

    module: {
        rules: [ 
            {
                test: /\.vue$/,
                use: "vue-loader"
            },
            {
                test: /\.less$/,
                use: ["style-loader", "css-loader", "less-loader"],
            },
            {
                test: /\.(png|jpg)$/,
                use: "url-loader",
            },
            {
                test: /(\.js)$/, 
                use: {
                    loader: "babel-loader", 
                },
                exclude: /node_modules/, 
            },
            {
                test: /\.css$/,
                use: ["style-loader", "css-loader"]
            },
        ]
    },
}