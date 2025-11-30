const { defineConfig } = require('@vue/cli-service')
module.exports = defineConfig({
  transpileDependencies: true,
  devServer: {
    proxy: {
      // 新的历史数据API代理规则
      '/api-history': {
        target: 'https://apphis.longhuvip.com',
        changeOrigin: true,
        secure: true,
        pathRewrite: {
          '^/api-history': ''
        }
      },
      // 为其他API保留原有的代理规则
      '/api-today': {
        target: 'https://apphwshhq.longhuvip.com',
        changeOrigin: true,
        secure: false,
        pathRewrite: {
          '^/api-today': ''
        }
      }
    }
  }
})
