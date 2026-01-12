const express = require('express');
const axios = require('axios');
const cors = require('cors');
const app = express();
const PORT = 8081;
const iconv = require('iconv-lite');
iconv.skipDecodeWarning = true;

// 启用CORS，允许所有来源的请求
app.use(cors());

// 解析JSON请求体
app.use(express.json());

/**
 * 格式化股票数据为标准JSON格式
 * @param {Array} stockData 原始股票数据数组
 * @returns {Array} 格式化后的股票数据数组
 */
function formatStockData(stockData) {
  if (!Array.isArray(stockData)) {
    return [];
  }

  return stockData.map(stock => {

    let m_days_n_boards_boards = 0;
    let m_days_n_boards_days = 0;

    boards = stock[18];
    if (typeof boards === 'string') {
      const boardsStr = boards;
      // 匹配"7天5板"格式的正则表达式
      const match = boardsStr.match(/(\d+)天(\d+)板/);
      if (match) {
        m_days_n_boards_days = parseInt(match[1], 10) || 0;
        m_days_n_boards_boards = parseInt(match[2], 10) || 0;
      }
    }

    try {
      return {
        symbol: stock[0] || '', // 股票代码
        stock_chi_name: stock[1] || '', // 股票中文名称
        change_percent: 0, // 涨跌幅固定为0
        limit_up_days: stock[15] || 0, // 连续涨停天数
        primaryTheme: stock[5] || '', // 主要主题
        allThemes: [],
        // allThemes: Array.isArray(stock[12]) ? stock[12] : typeof stock[12] === 'string' ? stock[12].split('、') : [], // 所有主题，以、分割的字符串数组
        boards: stock[18] || '', // 所属板块
        m_days_n_boards_days: m_days_n_boards_days,
        m_days_n_boards_boards: m_days_n_boards_boards
      };
    } catch (error) {
      console.error('格式化股票数据失败:', error.message);
      return null; // 格式化失败返回null，后续会过滤掉
    }
  }).filter(Boolean); // 过滤掉null值
}

/**
 * 日志记录中间件
 */
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

/**
 * 错误处理中间件
 */
app.use((err, req, res, next) => {
  console.error('错误发生:', err);
  res.status(500).json({
    error: '服务器内部错误',
    message: err.message
  });
});

/**
 * 转发到历史数据API - 获取所有PidType(1-5)的数据并合并
 * GET /api/proxy/kpl-history?Day=2023-12-01
 */
app.get('/api/proxy/kpl-history', async (req, res, next) => {
  try {
    const { Day, a = 'DailyLimitPerformance', c = 'HisHomeDingPan', st = 1000 } = req.query;

    if (!Day) {
      return res.status(400).json({
        error: '缺少必要参数',
        message: 'Day参数是必需的'
      });
    }

    console.log(`转发历史数据请求，日期: ${Day} - 合并PidType 1-5`);

    // 目标API URL
    const targetUrl = 'https://apphis.longhuvip.com/w1/api/index.php';

    // 创建并行请求的Promise数组
    const requests = [];

    // 为每个PidType创建请求函数
    for (let pidType = 1; pidType <= 5; pidType++) {
      requests.push(
        (async (pid) => {
          console.log(`异步获取日期${Day}的PidType=${pid}数据`);
          try {
            const response = await axios.get(targetUrl, {
              params: { Day, PidType: pid, a, c, st },
              timeout: 10000 // 10秒超时
            });

            console.log(`日期${Day}的PidType=${pid}请求成功，状态码:`, response.status);

            // 处理响应数据
            if (response.data && response.data.info && Array.isArray(response.data.info)) {
              if (response.data.info.length >= 2 && Array.isArray(response.data.info[0])) {
                const stockDataArray = response.data.info[0];
                console.log(`日期${Day}的PidType=${pid}获取到嵌套结构数据，包含${stockDataArray.length}条股票记录`);
                return stockDataArray; // 返回股票数据数组
              }
            } else {
              console.log(`日期${Day}的PidType=${pid}未返回有效数据或格式不正确`);
            }
            return []; // 无有效数据时返回空数组
          } catch (pidError) {
            console.error(`获取日期${Day}的PidType=${pid}数据失败:`, pidError.message);
            return []; // 错误时返回空数组
          }
        })(pidType) // 使用IIFE立即执行函数来捕获当前的pidType值
      );
    }

    // 并行执行所有请求
    const results = await Promise.all(requests);

    // 合并所有结果
    const allData = results.flat(); // 将多个数组扁平化为一个

    console.log(`日期${Day}的所有PidType数据合并完成，总计${allData.length}条记录`);

    // 格式化数据
    const formattedData = formatStockData(allData);
    console.log(`日期${Day}的数据格式化完成，格式化后共${formattedData.length}条记录`);

    // 按照要求格式返回合并后的数据
    res.json({
      data: formattedData,
      date: Day,
      code: '200' // 成功状态码
    });
  } catch (error) {
    console.error('转发历史数据请求失败:', error.message);
    // 使用统一的错误响应格式
    res.status(500).json({
      info: [[], Day || new Date().toISOString().split('T')[0]], // 保持info字段结构
      ttag: Math.random() * 0.01,
      errcode: '1', // 错误状态码
      error: error.message || '获取历史龙虎榜数据失败'
    });
  }
});

/**
 * 转发到今日数据API - 获取所有PidType(1-5)的数据并合并
 * GET /api/proxy/kpl-today
 */
app.get('/api/proxy/kpl-today', async (req, res, next) => {
  try {
    const { a = 'DailyLimitPerformance', c = 'HomeDingPan', st = 1000 } = req.query;

    console.log('转发今日数据请求 - 合并PidType 1-5');

    // 目标API URL
    const targetUrl = 'https://apphwshhq.longhuvip.com/w1/api/index.php';

    // 创建并行请求的Promise数组
    const requests = [];

    // 为每个PidType创建请求函数
    for (let pidType = 1; pidType <= 5; pidType++) {
      requests.push(
        (async (pid) => {
          console.log(`异步获取PidType=${pid}的数据`);
          try {
            const response = await axios.get(targetUrl, {
              params: { PidType: pid, a, c, st },
              timeout: 10000 // 10秒超时
            });

            console.log(`PidType=${pid}请求成功，状态码:`, response.status);

            // 处理响应数据
            if (response.data && response.data.info && Array.isArray(response.data.info)) {
              if (response.data.info.length >= 1 && Array.isArray(response.data.info[0])) {
                const stockDataArray = response.data.info[0];
                console.log(`PidType=${pid}获取到嵌套结构数据，包含${stockDataArray.length}条股票记录`);
                return stockDataArray; // 返回股票数据数组
              }
            } else {
              console.log(`PidType=${pid}未返回有效数据或格式不正确`);
            }
            return []; // 无有效数据时返回空数组
          } catch (pidError) {
            console.error(`获取PidType=${pid}数据失败:`, pidError.message);
            return []; // 错误时返回空数组
          }
        })(pidType) // 使用IIFE立即执行函数来捕获当前的pidType值
      );
    }

    // 并行执行所有请求
    const results = await Promise.all(requests);

    // 合并所有结果
    const allData = results.flat(); // 将多个数组扁平化为一个

    console.log(`所有PidType数据合并完成，总计${allData.length}条记录`);

    // 格式化数据
    const formattedData = formatStockData(allData);
    console.log(`今日数据格式化完成，格式化后共${formattedData.length}条记录`);

    // 按照要求格式返回合并后的数据
    res.json({
      data: formattedData,
      date: new Date().toISOString().split('T')[0],
      code: '200' // 成功状态码
    });
  } catch (error) {
    console.error('转发今日数据请求失败:', error.message);
    // 使用统一的错误响应格式
    res.status(500).json({
      data: [],
      date: new Date().toISOString().split('T')[0],
      ttag: Math.random() * 0.01,
      code: '400', // 错误状态码
      error: error.message || '获取今日数据失败'
    });
  }
});

/**
 * 健康检查端点
 */
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString()
  });
});

/**
 * 转发到新浪股票数据API
 * GET /api/proxy/sina-stock?codes=sz001331,sh600337
 */
app.get('/api/proxy/sina-stock', async (req, res, next) => {
  try {
    const { codes } = req.query;
    
    if (!codes) {
      return res.status(400).json({
        error: '缺少必要参数',
        message: 'codes参数是必需的'  
      });
    }
    
    console.log(`转发新浪股票数据请求，代码: ${codes}`);
    
    // 新浪股票接口
    const url = `https://hq.sinajs.cn/list=${codes}`;
    // 添加请求头模拟浏览器请求，解决403问题
    const headers = {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
      'Referer': 'https://finance.sina.com.cn/',
      'Accept': '*/*',
      'Accept-Language': 'zh-CN,zh;q=0.9'
    };
    
    // 以二进制形式获取响应，避免自动解码
    const response = await axios.get(url, { 
      headers,
      responseType: 'arraybuffer'
    });
    
    // 将GBK编码转换为UTF-8
    const utf8Data = iconv.decode(response.data, 'gb18030');
    
    res.send(utf8Data);
  } catch (error) {
    console.error('转发新浪股票数据请求失败:', error.message);
    res.status(500).json({
      error: '服务器内部错误',
      message: error.message
    });
  }
});

/**
 * 转发到网易财经股票数据API
 * GET /api/proxy/netease-stock?codes=sz001331,sh600337
 */
app.get('/api/proxy/netease-stock', async (req, res, next) => {
  try {
    const { codes } = req.query;
    
    if (!codes) {
      return res.status(400).json({
        error: '缺少必要参数',
        message: 'codes参数是必需的'  
      });
    }
    
    console.log(`转发网易财经股票数据请求，代码: ${codes}`);
    
    // 网易财经接口
    const url = `http://api.money.126.net/data/feed/${codes},jsonp=callback`;
    // 添加请求头模拟浏览器请求，避免403问题
    const headers = {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
      'Referer': 'http://money.163.com/',
      'Accept': '*/*',
      'Accept-Language': 'zh-CN,zh;q=0.9'
    };
    
    // 以二进制形式获取响应，避免自动解码
    const response = await axios.get(url, { 
      headers,
      responseType: 'arraybuffer'
    });
    
    // 将GBK编码转换为UTF-8
    const utf8Data = iconv.decode(response.data, 'gb18030');
    
    res.send(utf8Data);
  } catch (error) {
    console.error('转发网易财经股票数据请求失败:', error.message);
    res.status(500).json({
      error: '服务器内部错误',
      message: error.message
    });
  }
});

/**
 * 转发到新浪财经搜索API
 * GET /api/proxy/sina-search?keyword=天普股份
 */
app.get('/api/proxy/sina-search', async (req, res, next) => {
  try {
    const { keyword } = req.query;
    
    if (!keyword) {
      return res.status(400).json({
        error: '缺少必要参数',
        message: 'keyword参数是必需的'  
      });
    }
    
    console.log(`转发新浪财经搜索请求，关键词: ${keyword}`);
    
    // 新浪财经搜索接口 - 这里使用的是示例接口，实际使用时需要确认正确的API
    // 注意：新浪的搜索API可能会有变化或限制
    const url = `https://suggest3.sinajs.cn/suggest/type=11,12&key=${encodeURIComponent(keyword)}`;
    const headers = {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
      'Referer': 'https://finance.sina.com.cn/',
      'Accept': '*/*',
      'Accept-Language': 'zh-CN,zh;q=0.9'
    };
    
    const response = await axios.get(url, { headers });
    
    // 解析新浪搜索API响应
    console.log(`新浪搜索API原始响应: ${response.data}`);
    const data = response.data;
    
    // 尝试多种解析方式
    try {
      // 方式1：原始格式解析 - var SuggestNews1 = ["天普股份","sz002709","天普股份","天普股份最新消息","天普股份股吧"];
      let match = data.match(/\[(.*)\]/);
      
      if (match) {
        // 解析JSON数组
        const suggestions = JSON.parse(`[${match[1]}]`);
        console.log(`解析后的搜索结果数组: ${JSON.stringify(suggestions)}`);
        
        // 构建标准响应格式
        const result = {
          data: []
        };
        
        // 处理搜索结果 - 检查数组长度是否足够
        if (suggestions.length >= 2) {
          // 如果结果只有一组数据
          if (suggestions.length < 10) {
            const name = suggestions[0];
            const code = suggestions[1];
            if (name && code) {
              result.data.push({name, code});
            }
          } else {
            // 处理多组数据，每组5个元素
            for (let i = 0; i < suggestions.length; i += 5) {
              const name = suggestions[i];
              const code = suggestions[i + 1];
              
              if (name && code) {
                result.data.push({name, code});
              }
            }
          }
        }
        
        console.log(`构建的搜索结果: ${JSON.stringify(result)}`);
        res.json(result);
        return;
      }
    } catch (error) {
      console.error(`解析搜索结果失败: ${error.message}`);
    }
    
    // 如果所有解析方式都失败，返回原始数据
    res.send(data);
  } catch (error) {
    console.error('转发新浪财经搜索请求失败:', error.message);
    res.status(500).json({
      error: '服务器内部错误',
      message: error.message
    });
  }
});

// 启动服务器
app.listen(PORT, () => {
  console.log(`后端转发服务已启动，监听端口 ${PORT}`);
  console.log(`历史数据API: http://localhost:${PORT}/api/proxy/history?Day=YYYY-MM-DD`);
  console.log(`今日数据API: http://localhost:${PORT}/api/proxy/today`);
  console.log(`新浪股票API: http://localhost:${PORT}/api/proxy/sina-stock?codes=sz001331,sh600337`);
  console.log(`网易股票API: http://localhost:${PORT}/api/proxy/netease-stock?codes=sz001331,sh600337`);
  console.log(`新浪搜索API: http://localhost:${PORT}/api/proxy/sina-search?keyword=天普股份`);
  console.log(`健康检查: http://localhost:${PORT}/health`);
});