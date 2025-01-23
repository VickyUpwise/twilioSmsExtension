// const HtmlWebpackPlugin = require('html-webpack-plugin');
// const path = require('path')
// const webpack = require('webpack');

// module.exports = {
//   webpack: {
//     configure: (webpackConfig) => {
//         webpackConfig.entry = {
//             main: './src/index.js',
//             settings: './src/Settings/settings.js',
//             bulkMessage: './src/BulkMessage/bulkMessage.js'
//         };
//         // Remove existing HtmlWebpackPlugin instances
//         webpackConfig.plugins = webpackConfig.plugins.filter(
//             plugin => !(plugin instanceof HtmlWebpackPlugin)
//         );
//         // Add custom HtmlWebpackPlugin instances for multiple HTML files
//         webpackConfig.plugins.push(
//             new HtmlWebpackPlugin({
//             template: 'public/index.html',
//             filename: 'index.html',
//             chunks: ['main'],
//             }),
//             new HtmlWebpackPlugin({
//               template: 'public/settings.html',
//               filename: 'settings.html',
//               chunks: ['settings'],
//             }),
//             new HtmlWebpackPlugin({
//               template: 'public/bulk.html',
//               filename: 'bulk.html',
//               chunks: ['bulkMessage'],
//             }),
//         );


//         return webpackConfig;
//     }
//   },
//   resolve: {
//     fallback: {
//       "path": require.resolve('path-browserify'),
//       "buffer": require.resolve('buffer'),
//       "crypto": require.resolve("crypto-browserify"),
//       "fs" : false,
//       "url" : false,
//       "querystring": false,
//     },
//   },
// };

const HtmlWebpackPlugin = require('html-webpack-plugin');
const path = require('path');
const webpack = require('webpack');

module.exports = {
  webpack: {
    configure: (webpackConfig) => {
      webpackConfig.entry = {
        main: './src/index.js',
        settings: './src/Settings/settings.js',
        bulkMessage: './src/BulkMessage/bulkMessage.js',
      };

      // Remove existing HtmlWebpackPlugin instances
      webpackConfig.plugins = webpackConfig.plugins.filter(
        (plugin) => !(plugin instanceof HtmlWebpackPlugin)
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
        })
      );

      // Add fallback for Node.js modules
      webpackConfig.resolve = {
        ...webpackConfig.resolve,
        fallback: {
          path: require.resolve('path-browserify'),
          buffer: require.resolve('buffer/'),
          crypto: require.resolve('crypto-browserify'),
          stream: require.resolve('stream-browserify'),
          util: require.resolve('util/'),
          process: require.resolve('process/browser'),
          fs: false, // Disable Node.js-specific modules
          url: false,
          querystring: false,
        },
      };

      // Add ProvidePlugin for process and buffer
      // webpackConfig.plugins.push(
      //   new webpack.ProvidePlugin({
      //     process: 'process/browser',
      //     Buffer: ['buffer', 'Buffer'],
      //   })
      // );

      return webpackConfig;
    },
  },
};

