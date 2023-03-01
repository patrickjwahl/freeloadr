const path = require('path');

module.exports = {
  experimental: {
    appDir: true
  },
  sassOptions: {
    includePaths: [path.join(__dirname, 'styles')],
  },
  reactStrictMode: false,
  images: {
      remotePatterns: [
          {
              protocol: 'https',
              hostname: 'freeloadr-image-data.s3.amazonaws.com'
          },
          {
              protocol: 'https',
              hostname: 'd2mtxmys7aqndv.cloudfront.net'
          }
      ]
  }
}
