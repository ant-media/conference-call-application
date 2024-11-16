module.exports = {
  resolve: {
    fallback: { "url": require.resolve("url/") }
  },
  output: {
    publicPath: process.env.PUBLIC_URL || '/',
  },
};