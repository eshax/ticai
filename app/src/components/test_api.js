// 测试腾讯股票API数据格式
const axios = require('axios');

async function testAPI() {
  try {
    // 测试一只股票的数据
    const url = 'https://qt.gtimg.cn/q=sh600783';
    const response = await axios.get(url);
    console.log('API返回原始数据:', response.data);
    
    // 解析数据
    const match = response.data.match(/v_sh600783="([^"]+)"/);
    if (match) {
      const values = match[1].split('~');
      console.log('数据字段数:', values.length);
      values.forEach((value, index) => {
        console.log(`${index}: ${value}`);
      });
    }
  } catch (error) {
    console.error('测试失败:', error);
  }
}

testAPI();