const http = require('http');
const https = require('https');
const url = require('url');
const PORT = 8081;

// 简易的解析JSON请求体函数
function parseJSONBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => {
      body += chunk;
    });
    req.on('end', () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch (e) {
        reject(e);
      }
    });
    req.on('error', reject);
  });
}

// 简易的HTTP请求函数
function httpGet(targetUrl, params) {
  return new Promise((resolve, reject) => {
    const parsedUrl = url.parse(targetUrl);
    const queryString = new URLSearchParams(params).toString();
    const options = {
      hostname: parsedUrl.hostname,
      path: `${parsedUrl.pathname}${queryString ? '?' + queryString : ''}`,
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Node.js'
      }
    };

    const protocol = parsedUrl.protocol === 'https:' ? https : http;
    const req = protocol.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          resolve({});
        }
      });
    });

    req.on('error', reject);
    req.end();
  });
}

/**
 * 格式化股票数据为标准JSON格式
 */
function formatStockData(stockData) {
  if (!Array.isArray(stockData)) {
    return [];
  }

  return stockData.map(stock => {
    let m_days_n_boards_boards = 0;
    let m_days_n_boards_days = 0;

    const boards = stock[18];
    if (typeof boards === 'string') {
      const match = boards.match(/(\d+)天(\d+)板/);
      if (match) {
        m_days_n_boards_days = parseInt(match[1], 10) || 0;
        m_days_n_boards_boards = parseInt(match[2], 10) || 0;
      }
    }

    try {
      return {
        symbol: stock[0] || '',
        stock_chi_name: stock[1] || '',
        change_percent: 0,
        limit_up_days: stock[15] || 0,
        primaryTheme: stock[5] || '',
        allThemes: [],
        boards: stock[18] || '',
        oneline: stock[17] == 0 ? 1 : 0,
        m_days_n_boards_days: m_days_n_boards_days,
        m_days_n_boards_boards: m_days_n_boards_boards
      };
    } catch (error) {
      console.error('格式化股票数据失败:', error.message);
      return null;
    }
  }).filter(Boolean);
}

// 创建HTTP服务器
const server = http.createServer(async (req, res) => {
  // 添加CORS头
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // 处理预检请求
  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  // 日志记录
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);

  // 解析URL
  const parsedUrl = url.parse(req.url, true);
  const pathname = parsedUrl.pathname;
  const query = parsedUrl.query;

  try {
    // 历史数据API
    if (pathname === '/api/proxy/kpl-history') {
      const { Day, a = 'DailyLimitPerformance', c = 'HisHomeDingPan', st = 1000 } = query;

      if (!Day) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          error: '缺少必要参数',
          message: 'Day参数是必需的'
        }));
        return;
      }

      const targetUrl = 'https://apphis.longhuvip.com/w1/api/index.php';
      const requests = [];

      // 并行请求PidType 1-5
      for (let pidType = 1; pidType <= 5; pidType++) {
        requests.push(
          (async (pid) => {
            try {
              const response = await httpGet(targetUrl, { Day, PidType: pid, a, c, st });
              if (response.info && Array.isArray(response.info) && response.info.length >= 2 && Array.isArray(response.info[0])) {
                return response.info[0];
              }
            } catch (error) {
              console.error(`获取PidType=${pid}数据失败:`, error.message);
            }
            return [];
          })(pidType)
        );
      }

      const results = await Promise.all(requests);
      const allData = results.flat();
      const formattedData = formatStockData(allData);

      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        data: formattedData,
        date: Day,
        code: '200'
      }));

    // 今日数据API
    } else if (pathname === '/api/proxy/kpl-today') {
      const { a = 'DailyLimitPerformance', c = 'HomeDingPan', st = 1000 } = query;
      const targetUrl = 'https://apphwshhq.longhuvip.com/w1/api/index.php';
      const requests = [];

      for (let pidType = 1; pidType <= 5; pidType++) {
        requests.push(
          (async (pid) => {
            try {
              const response = await httpGet(targetUrl, { PidType: pid, a, c, st });
              if (response.info && Array.isArray(response.info) && response.info.length >= 1 && Array.isArray(response.info[0])) {
                return response.info[0];
              }
            } catch (error) {
              console.error(`获取PidType=${pid}数据失败:`, error.message);
            }
            return [];
          })(pidType)
        );
      }

      const results = await Promise.all(requests);
      const allData = results.flat();
      const formattedData = formatStockData(allData);

      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        data: formattedData,
        date: new Date().toISOString().split('T')[0],
        code: '200'
      }));

    // 健康检查端点
    } else if (pathname === '/health') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        status: 'healthy',
        timestamp: new Date().toISOString()
      }));

    // 404处理
    } else {
      res.writeHead(404, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        error: 'Not Found',
        message: '路径不存在'
      }));
    }
  } catch (error) {
    console.error('错误发生:', error);
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      error: '服务器内部错误',
      message: error.message
    }));
  }
});

// 启动服务器
server.listen(PORT, () => {
  console.log(`后端服务已启动，监听端口 ${PORT}`);
  console.log(`历史数据API: http://localhost:${PORT}/api/proxy/kpl-history?Day=YYYY-MM-DD`);
  console.log(`今日数据API: http://localhost:${PORT}/api/proxy/kpl-today`);
  console.log(`健康检查: http://localhost:${PORT}/health`);
});