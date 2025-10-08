const HtmlWebpackPlugin = require("html-webpack-plugin");


module.exports = {
  webpack: {
    configure: (webpackConfig) => {
      webpackConfig.entry = {
        main: "./src/index.js",
        settings: "./src/Components/Settings/settings.js",
        bulkMessage: "./src/Components/BulkMessageComponent/bulkMessage.js",
      };

      // ✅ Correct location for resolve.fallback
      webpackConfig.resolve = {
        ...webpackConfig.resolve,
        fallback: {
          ...webpackConfig.resolve?.fallback,
          path: require.resolve("path-browserify"),
          http: false, // or require.resolve("stream-http") if needed
        },
      };

      // Remove existing HtmlWebpackPlugin instances
      webpackConfig.plugins = webpackConfig.plugins.filter(
        (plugin) => !(plugin instanceof HtmlWebpackPlugin)
      );

      // Add custom HtmlWebpackPlugin instances for multiple HTML files
      webpackConfig.plugins.push(
        new HtmlWebpackPlugin({
          template: "public/index.html",
          filename: "index.html",
          chunks: ["main"],
        }),
        new HtmlWebpackPlugin({
          template: "public/settings.html",
          filename: "settings.html",
          chunks: ["settings"],
        }),
        new HtmlWebpackPlugin({
          template: "public/bulkMessage.html",
          filename:"bulkMessage.html",
          chunks:["bulkMessage"],
        })
      );

      return webpackConfig;
    },
  },
};
