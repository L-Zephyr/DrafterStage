const HtmlWebpackPlugin = require('html-webpack-plugin')

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
                test: /(\.js)$/, 
                use: {
                    loader: "babel-loader", 
                },
                exclude: /node_modules/, 
            },
            {
                test: /\.css$/,
                use: ["style-loader", "css-loader"]
            }
        ]
    },
}