# 微信API集成执行流程

## 项目初始化流程

### 1. 环境准备
```bash
# 创建项目目录
mkdir wechat-project && cd wechat-project

# 初始化npm项目
npm init -y

# 安装核心依赖
npm install express wechat-api wechat crypto axios
npm install --save-dev nodemon eslint prettier
```

### 2. 基础配置文件
```javascript
// config/wechat.js
module.exports = {
  appId: process.env.WECHAT_APP_ID,
  appSecret: process.env.WECHAT_APP_SECRET,
  token: process.env.WECHAT_TOKEN,
  encodingAESKey: process.env.WECHAT_ENCODING_AES_KEY,
  checkSignature: true
};
```

### 3. 环境变量配置
```bash
# .env文件
WECHAT_APP_ID=your_app_id
WECHAT_APP_SECRET=your_app_secret
WECHAT_TOKEN=your_token
WECHAT_ENCODING_AES_KEY=your_aes_key
PORT=3000
```

## 服务器验证流程

### 1. Token验证实现
```javascript
// middleware/wechat-verify.js
const crypto = require('crypto');
const config = require('../config/wechat');

function verifySignature(signature, timestamp, nonce, token) {
  const tmpStr = [token, timestamp, nonce].sort().join('');
  const tmpSign = crypto.createHash('sha1').update(tmpStr).digest('hex');
  return tmpSign === signature;
}

module.exports = (req, res, next) => {
  const { signature, timestamp, nonce, echostr } = req.query;
  
  if (verifySignature(signature, timestamp, nonce, config.token)) {
    if (echostr) {
      // 首次验证
      res.send(echostr);
    } else {
      // 正常消息处理
      next();
    }
  } else {
    res.status(403).send('Forbidden');
  }
};
```

### 2. 主服务器设置
```javascript
// app.js
const express = require('express');
const wechatVerify = require('./middleware/wechat-verify');
const messageHandler = require('./handlers/message');

const app = express();

app.use(express.raw({ type: 'text/xml' }));

// 微信验证和消息处理
app.all('/wechat', wechatVerify, messageHandler);

app.listen(process.env.PORT || 3000, () => {
  console.log('微信服务器启动成功');
});
```

## Access Token管理流程

### 1. Token获取和缓存
```javascript
// utils/access-token.js
const axios = require('axios');
const fs = require('fs').promises;
const path = require('path');
const config = require('../config/wechat');

class AccessTokenManager {
  constructor() {
    this.tokenFile = path.join(__dirname, '../.cache/access_token.json');
  }

  async getAccessToken() {
    try {
      // 尝试从缓存读取
      const cached = await this.readTokenFromCache();
      if (cached && !this.isTokenExpired(cached)) {
        return cached.access_token;
      }
    } catch (error) {
      console.log('缓存读取失败，重新获取token');
    }

    // 从微信服务器获取新token
    return await this.fetchNewToken();
  }

  async fetchNewToken() {
    const url = `https://api.weixin.qq.com/cgi-bin/token?grant_type=client_credential&appid=${config.appId}&secret=${config.appSecret}`;
    
    const response = await axios.get(url);
    const { access_token, expires_in } = response.data;
    
    if (!access_token) {
      throw new Error('获取access_token失败: ' + JSON.stringify(response.data));
    }

    // 缓存token
    const tokenData = {
      access_token,
      expires_in,
      timestamp: Date.now()
    };
    
    await this.saveTokenToCache(tokenData);
    return access_token;
  }

  async readTokenFromCache() {
    const data = await fs.readFile(this.tokenFile, 'utf8');
    return JSON.parse(data);
  }

  async saveTokenToCache(tokenData) {
    await fs.mkdir(path.dirname(this.tokenFile), { recursive: true });
    await fs.writeFile(this.tokenFile, JSON.stringify(tokenData, null, 2));
  }

  isTokenExpired(tokenData) {
    const now = Date.now();
    const expireTime = tokenData.timestamp + (tokenData.expires_in - 300) * 1000; // 提前5分钟过期
    return now >= expireTime;
  }
}

module.exports = new AccessTokenManager();
```

## 消息处理流程

### 1. 消息解析和分发
```javascript
// handlers/message.js
const xml2js = require('xml2js');
const textHandler = require('./text');
const imageHandler = require('./image');
const eventHandler = require('./event');

module.exports = async (req, res) => {
  try {
    const xml = req.body.toString();
    const result = await xml2js.parseStringPromise(xml);
    const message = result.xml;
    
    // 提取消息基本信息
    const msgData = {
      ToUserName: message.ToUserName[0],
      FromUserName: message.FromUserName[0],
      CreateTime: message.CreateTime[0],
      MsgType: message.MsgType[0]
    };

    let response;
    
    // 根据消息类型分发处理
    switch (msgData.MsgType) {
      case 'text':
        msgData.Content = message.Content[0];
        response = await textHandler(msgData);
        break;
      case 'image':
        msgData.PicUrl = message.PicUrl[0];
        msgData.MediaId = message.MediaId[0];
        response = await imageHandler(msgData);
        break;
      case 'event':
        msgData.Event = message.Event[0];
        response = await eventHandler(msgData);
        break;
      default:
        response = createTextResponse(msgData, '暂不支持此类型消息');
    }
    
    res.set('Content-Type', 'text/xml');
    res.send(response);
    
  } catch (error) {
    console.error('消息处理错误:', error);
    res.send('success'); // 返回success避免微信重复推送
  }
};

function createTextResponse(msgData, content) {
  const response = `
    <xml>
      <ToUserName><![CDATA[${msgData.FromUserName}]]></ToUserName>
      <FromUserName><![CDATA[${msgData.ToUserName}]]></FromUserName>
      <CreateTime>${Math.floor(Date.now() / 1000)}</CreateTime>
      <MsgType><![CDATA[text]]></MsgType>
      <Content><![CDATA[${content}]]></Content>
    </xml>
  `;
  return response.trim();
}
```

### 2. 文本消息处理
```javascript
// handlers/text.js
module.exports = async (msgData) => {
  const content = msgData.Content.trim();
  let replyContent;
  
  // 简单的关键词回复逻辑
  if (content === '帮助' || content === 'help') {
    replyContent = '欢迎使用我们的服务！\n回复"功能"查看可用功能';
  } else if (content === '功能') {
    replyContent = '可用功能：\n1. 帮助 - 查看帮助信息\n2. 时间 - 获取当前时间';
  } else if (content === '时间') {
    replyContent = `当前时间：${new Date().toLocaleString('zh-CN')}`;
  } else {
    replyContent = `您发送的消息是：${content}`;
  }
  
  return createTextResponse(msgData, replyContent);
};

function createTextResponse(msgData, content) {
  return `
    <xml>
      <ToUserName><![CDATA[${msgData.FromUserName}]]></ToUserName>
      <FromUserName><![CDATA[${msgData.ToUserName}]]></FromUserName>
      <CreateTime>${Math.floor(Date.now() / 1000)}</CreateTime>
      <MsgType><![CDATA[text]]></MsgType>
      <Content><![CDATA[${content}]]></Content>
    </xml>
  `.trim();
}
```

## API调用流程

### 1. 用户信息获取
```javascript
// services/user.js
const axios = require('axios');
const accessTokenManager = require('../utils/access-token');

class UserService {
  async getUserInfo(openid) {
    const accessToken = await accessTokenManager.getAccessToken();
    const url = `https://api.weixin.qq.com/cgi-bin/user/info?access_token=${accessToken}&openid=${openid}&lang=zh_CN`;
    
    const response = await axios.get(url);
    return response.data;
  }
  
  async getUserList() {
    const accessToken = await accessTokenManager.getAccessToken();
    const url = `https://api.weixin.qq.com/cgi-bin/user/get?access_token=${accessToken}`;
    
    const response = await axios.get(url);
    return response.data;
  }
}

module.exports = new UserService();
```

### 2. 模板消息发送
```javascript
// services/template.js
const axios = require('axios');
const accessTokenManager = require('../utils/access-token');

class TemplateService {
  async sendTemplateMessage(data) {
    const accessToken = await accessTokenManager.getAccessToken();
    const url = `https://api.weixin.qq.com/cgi-bin/message/template/send?access_token=${accessToken}`;
    
    const response = await axios.post(url, data);
    return response.data;
  }
}

module.exports = new TemplateService();
```