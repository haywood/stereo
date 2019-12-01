const withWorkers = require('@zeit/next-workers')
module.exports = withWorkers({
  webpack(config, options) {

    config.output.globalObject = 'self'
    return config
  }
})
