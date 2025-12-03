# 后端API转发服务

本项目实现了一个纯后端的API转发服务，用于解决跨域问题，避免使用前端代理或JSONP。

## 快速开始

### 1. 安装依赖

首先确保安装了所需的npm包：

```bash
npm install express axios cors --save
```

### 2. 启动后端转发服务

```bash
node backend-server.js
```

服务启动后将监听在 `http://localhost:8081`。

### 3. 可用的API端点

- **历史数据API**: `http://localhost:8081/api/proxy/history?Day=YYYY-MM-DD`
- **今日数据API**: `http://localhost:8081/api/proxy/today`
- **健康检查**: `http://localhost:8081/health`

## 技术实现说明

### 后端服务器 (backend-server.js)

- 使用 **Express.js** 框架创建HTTP服务器
- 通过 **Axios** 发送请求到目标API服务器
- 使用 **CORS** 中间件允许跨域请求
- 实现了错误处理和日志记录
- 支持转发历史数据和今日数据两种请求

### 前端API调用 (kpl.js)

- 已更新为使用后端转发服务的URL
- 增加了错误处理和调试信息
- 提供了清晰的错误提示，包括服务未启动时的指导

## 常见问题解决

### 服务启动失败

- 检查端口8081是否被占用
- 确保已安装所有依赖包
- 查看控制台错误信息

### 请求超时

- 检查网络连接
- 确认目标API服务器是否可访问
- 可以调整代码中的超时时间设置

### 数据获取失败

- 确保日期格式正确（YYYY-MM-DD）
- 检查后端服务是否正在运行
- 查看浏览器控制台和后端服务器日志获取详细错误信息

## 使用示例

### 测试后端服务

可以使用curl或浏览器直接测试后端服务：

```bash
# 测试健康检查
curl http://localhost:8081/health

# 测试今日数据
curl http://localhost:8081/api/proxy/today

# 测试历史数据（替换为有效日期）
curl "http://localhost:8081/api/proxy/history?Day=2023-12-01"
```

## 注意事项

1. 后端服务需要与前端项目一起运行
2. 生产环境部署时需要考虑安全性和性能优化
3. 可以根据需要修改端口号和API路径
4. 建议在生产环境中添加更完善的错误处理和日志记录