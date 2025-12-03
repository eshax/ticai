// 简单的测试脚本，使用Node.js内置模块
const http = require('http');
const https = require('https');

// 测试参数
const params = {
    Day: '2025-11-28',
    PidType: 1,
    a: 'DailyLimitPerformance',
    c: 'HisHomeDingPan',
    st: 1000
};

// 构建查询字符串
function buildQueryString(params) {
    return '?' + Object.keys(params)
        .map(key => `${encodeURIComponent(key)}=${encodeURIComponent(params[key])}`)
        .join('&');
}

// 测试直接API调用
function testDirectApi() {
    console.log('\n=== 测试直接API调用 ===');
    const queryString = buildQueryString(params);
    const options = {
        hostname: 'apphis.longhuvip.com',
        port: 443,
        path: `/w1/api/index.php${queryString}`,
        method: 'GET',
        headers: {
            'Referer': 'https://apphis.longhuvip.com',
            'Origin': 'https://apphis.longhuvip.com'
        }
    };

    console.log(`请求URL: https://apphis.longhuvip.com/w1/api/index.php${queryString}`);

    const req = https.request(options, (res) => {
        console.log(`状态码: ${res.statusCode}`);
        console.log(`响应头: ${JSON.stringify(res.headers, null, 2)}`);
        
        let data = '';
        res.on('data', (chunk) => {
            data += chunk;
        });
        
        res.on('end', () => {
            console.log('响应数据:');
            try {
                const jsonData = JSON.parse(data);
                console.log(JSON.stringify(jsonData, null, 2));
            } catch (e) {
                console.log(data);
            }
        });
    });

    req.on('error', (error) => {
        console.error(`直接API调用失败: ${error.message}`);
    });

    req.end();
}

// 测试本地代理API调用
function testProxyApi() {
    console.log('\n=== 测试本地代理API调用 ===');
    const queryString = buildQueryString(params);
    const options = {
        hostname: 'localhost',
        port: 8080,
        path: `/api-history/w1/api/index.php${queryString}`,
        method: 'GET',
        headers: {
            'Host': 'localhost:8080',
            'Referer': 'http://localhost:8080',
            'Origin': 'http://localhost:8080'
        }
    };

    console.log(`请求URL: http://localhost:8080/api-history/w1/api/index.php${queryString}`);

    const req = http.request(options, (res) => {
        console.log(`状态码: ${res.statusCode}`);
        console.log(`响应头: ${JSON.stringify(res.headers, null, 2)}`);
        
        let data = '';
        res.on('data', (chunk) => {
            data += chunk;
        });
        
        res.on('end', () => {
            console.log('响应数据:');
            try {
                const jsonData = JSON.parse(data);
                console.log(JSON.stringify(jsonData, null, 2));
            } catch (e) {
                console.log(data);
            }
        });
    });

    req.on('error', (error) => {
        console.error(`本地代理API调用失败: ${error.message}`);
        if (error.code === 'ECONNREFUSED') {
            console.error('无法连接到本地服务器，请确保开发服务器正在运行');
        }
    });

    req.end();
}

// 运行测试
console.log('开始API测试...');
console.log(`测试参数: ${JSON.stringify(params)}`);

testDirectApi();
setTimeout(testProxyApi, 2000); // 2秒后测试代理调用