const { defineConfig } = require('@vue/cli-service')
module.exports = defineConfig({
  transpileDependencies: true,
  devServer: {
    proxy: {
      // 代理当日数据接口
      '/api/longhuvip': {
        target: 'https://apphwshhq.longhuvip.com',
        changeOrigin: true,
        secure: false,
        pathRewrite: {
          '^/api/longhuvip': ''
        }
      },
      // 代理历史数据接口
      '/api/longhuvip-history': {
        target: 'https://apphis.longhuvip.com',
        changeOrigin: true,
        secure: false,
        pathRewrite: {
          '^/api/longhuvip-history': ''
        }
      }
    }
  }
})
