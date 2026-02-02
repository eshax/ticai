const { defineConfig } = require('@vue/cli-service')

module.exports = defineConfig({
  transpileDependencies: true,
  productionSourceMap: false,
  devServer: {
    // 移除代理配置，因为现在使用独立的后端转发服务
    // 后端转发服务运行在 http://localhost:3001
    // 详情请参考 BACKEND_PROXY_README.md
    port: 8080 // Vue开发服务器端口
  },
  configureWebpack: {
    // 代码分割配置
    optimization: {
      splitChunks: {
        chunks: 'all',
        maxInitialRequests: 20,
        maxAsyncRequests: 20,
        minSize: 20000,
        cacheGroups: {
          // 分割 Element Plus 为单独的 chunk
          elementPlus: {
            name: 'chunk-element-plus',
            test: /[\\/]node_modules[\\/]element-plus[\\/]/,
            priority: 20,
            chunks: 'all'
          },
          // 分割其他第三方库
          vendors: {
            name: 'chunk-vendors',
            test: /[\\/]node_modules[\\/]/,
            priority: 10,
            chunks: 'initial'
          },
          // 分割公共代码
          common: {
            name: 'chunk-common',
            minChunks: 2,
            priority: 5,
            chunks: 'initial',
            reuseExistingChunk: true
          }
        }
      }
    }
  },
  // 关闭 preload 和 prefetch，减少不必要的资源加载
  chainWebpack: config => {
    config.plugins.delete('preload')
    config.plugins.delete('prefetch')
  }
})
