const { defineConfig } = require('@vue/cli-service')
module.exports = defineConfig({
  transpileDependencies: true,
  devServer: {
    // 移除代理配置，因为现在使用独立的后端转发服务
    // 后端转发服务运行在 http://localhost:3001
    // 详情请参考 BACKEND_PROXY_README.md
    port: 8080 // Vue开发服务器端口
  }
})
