const fs = require('fs');
const path = require('path');

// 读取 server.js 文件内容
const serverPath = path.join(__dirname, 'server.js');
const standalonePath = path.join(__dirname, 'standalone-server.js');

// 创建输出目录
const outputDir = path.join(__dirname, 'dist');
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir);
}

// 复制文件到 dist 目录
function copyFile(source, destination) {
  try {
    const content = fs.readFileSync(source, 'utf8');
    fs.writeFileSync(destination, content, 'utf8');
    console.log(`已复制: ${path.basename(source)} -> dist/${path.basename(destination)}`);
  } catch (error) {
    console.error(`复制文件时出错 ${source}:`, error.message);
  }
}

// 复制主要文件
copyFile(serverPath, path.join(outputDir, 'server.js'));
copyFile(standalonePath, path.join(outputDir, 'standalone-server.js'));
copyFile(path.join(__dirname, 'package.json'), path.join(outputDir, 'package.json'));

// 创建 README 文件说明如何使用
const readmeContent = `# API 打包说明

## 文件说明
- server.js: 需要安装依赖的 Express 服务器
- standalone-server.js: 使用内置模块的独立服务器（无需外部依赖）

## 使用方法

### 方法一：使用独立服务器（推荐）
```bash
node standalone-server.js
```

### 方法二：使用 Express 服务器
```bash
npm install
node server.js
```

## 注意事项
- 独立服务器监听 8081 端口
- Express 服务器监听默认端口
`;

fs.writeFileSync(path.join(outputDir, 'README.md'), readmeContent, 'utf8');
console.log('打包完成！输出目录: dist/');