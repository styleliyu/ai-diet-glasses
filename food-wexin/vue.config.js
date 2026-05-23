const proxyTarget =
  process.env.VUE_APP_PROXY_TARGET ||
  process.env.VUE_APP_API_BASE_URL ||
  "http://localhost:8080";

module.exports = {
  devServer: {
    proxy: {
      "^/backend": {
        target: proxyTarget,
        changeOrigin: true,
        pathRewrite: {
          "^/backend": "",
        },
      },
    },
  },
};
