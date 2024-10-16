const HtmlWebpackPlugin = require('html-webpack-plugin');

module.exports = {
  webpack: {
    configure: (webpackConfig) => {
        webpackConfig.entry = {
            main: './src/index.js',
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
        );

        return webpackConfig;
    }
  }
};