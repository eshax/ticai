// 简单的API请求测试脚本
// 这个脚本将直接测试axios请求，不依赖Vue开发服务器
const axios = require('axios');

// 创建axios实例，模拟前端请求
const apiClient = axios.create({
  baseURL: '/api/longhuvip',
  timeout: 10000
});

// 记录请求和响应详情
apiClient.interceptors.request.use(config => {
  console.log('请求配置:', {
    url: config.url,
    params: config.params,
    headers: config.headers
  });
  return config;
});

apiClient.interceptors.response.use(response => {
  console.log('响应状态:', response.status);
  console.log('响应头:', response.headers);
  console.log('响应数据:', response.data);
  return response;
}, error => {
  console.error('请求错误:', error.message);
  if (error.response) {
    console.error('错误响应状态:', error.response.status);
    console.error('错误响应数据:', error.response.data);
  } else if (error.request) {
    console.error('请求已发送但无响应:', error.request);
  }
  return Promise.reject(error);
});

// 测试请求函数
async function testApiRequest() {
  try {
    console.log('=== 开始API测试 ===');
    console.log('注意：此脚本直接运行，不会使用vue.config.js中的代理配置');
    console.log('要使用代理配置，请运行开发服务器：npm run serve');
    
    // 这里只是为了演示API调用格式，实际运行时会失败，因为没有代理
    const response = await apiClient.get('/w1/api/index.php', {
      params: {
        a: 'DailyLimitPerformance',
        c: 'HomeDingPan',
        st: 1000
      }
    });
    
    console.log('测试成功！');
    return response.data;
  } catch (error) {
    console.error('测试失败，但这是预期的，因为直接运行脚本没有代理');
    console.log('请按照以下步骤解决代理问题：');
    console.log('1. 确保vue.config.js中的代理配置正确');
    console.log('2. 运行开发服务器：npm run serve');
    console.log('3. 在浏览器中访问应用');
    console.log('4. 打开浏览器控制台查看我们添加的调试日志');
    return null;
  }
}

// 运行测试
testApiRequest().then(() => {
  console.log('=== API测试完成 ===');
});