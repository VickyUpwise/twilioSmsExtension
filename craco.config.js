const HtmlWebpackPlugin = require('html-webpack-plugin');
const path = require('path')

module.exports = {
  webpack: {
    configure: (webpackConfig) => {
        webpackConfig.entry = {
            main: './src/index.js',
            settings: './src/Settings/settings.js',
            bulkMessage: './src/BulkMessage/bulkMessage.js'
        };
        // Remove existing HtmlWebpackPlugin instances
        webpackConfig.plugins = webpackConfig.plugins.filter(
            plugin => !(plugin instanceof HtmlWebpackPlugin)
        );
        // Add custom HtmlWebpackPlugin instances for multiple HTML files
        webpackConfig.plugins.push(
            new HtmlWebpackPlugin({
            template: 'public/index.html',
            filename: 'index.html',
            chunks: ['main'],
            }),
            new HtmlWebpackPlugin({
              template: 'public/settings.html',
              filename: 'settings.html',
              chunks: ['settings'],
            }),
            new HtmlWebpackPlugin({
              template: 'public/bulk.html',
              filename: 'bulk.html',
              chunks: ['bulkMessage'],
            }),
        );


        return webpackConfig;
    }
  },
  resolve: {
    fallback: {
      "crypto": require.resolve("crypto-browserify"),
      "fs" : false,
      "url" : false,
      "querystring": false,
    },
  },
};
