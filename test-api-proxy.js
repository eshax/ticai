const axios = require('axios');

async function testApiDirect() {
  console.log('直接测试远程API...');
  try {
    const response = await axios.get('https://apphis.longhuvip.com/w1/api/index.php', {
      params: {
        Day: '2025-11-28',
        PidType: 1,
        a: 'DailyLimitPerformance',
        c: 'HisHomeDingPan',
        st: 1000
      },
      headers: {
        'Referer': 'https://apphis.longhuvip.com',
        'Origin': 'https://apphis.longhuvip.com',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });
    console.log('直接API调用成功，状态码:', response.status);
    console.log('响应数据:', response.data);
  } catch (error) {
    console.error('直接API调用失败:', error.message);
    if (error.response) {
      console.error('响应状态码:', error.response.status);
      console.error('响应数据:', error.response.data);
    }
  }
}

async function testApiLocal() {
  console.log('\n测试本地代理API...');
  try {
    const response = await axios.get('http://localhost:8080/api/longhuvip-history/w1/api/index.php', {
      params: {
        Day: '2025-11-28',
        PidType: 1,
        a: 'DailyLimitPerformance',
        c: 'HisHomeDingPan',
        st: 1000
      }
    });
    console.log('本地代理API调用成功，状态码:', response.status);
    console.log('响应数据:', response.data);
  } catch (error) {
    console.error('本地代理API调用失败:', error.message);
    if (error.response) {
      console.error('响应状态码:', error.response.status);
      console.error('响应数据:', error.response.data);
    }
  }
}

// 运行测试
testApiDirect().then(testApiLocal);