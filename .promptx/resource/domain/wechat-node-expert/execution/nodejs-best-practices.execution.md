# Node.js开发最佳实践执行流程

## 项目结构规范

### 1. 标准目录结构
```
project-root/
├── src/
│   ├── controllers/     # 控制器层
│   ├── services/        # 业务逻辑层
│   ├── models/          # 数据模型
│   ├── middleware/      # 中间件
│   ├── utils/           # 工具函数
│   ├── config/          # 配置文件
│   └── routes/          # 路由定义
├── tests/               # 测试文件
├── docs/                # 文档
├── scripts/             # 脚本文件
├── .env.example         # 环境变量示例
├── .gitignore
├── package.json
└── README.md
```

### 2. 模块化设计原则
```javascript
// 单一职责原则示例
// services/userService.js
class UserService {
  constructor(userRepository) {
    this.userRepository = userRepository;
  }

  async createUser(userData) {
    // 业务逻辑验证
    this.validateUserData(userData);
    
    // 调用数据层
    return await this.userRepository.create(userData);
  }

  validateUserData(userData) {
    if (!userData.email) {
      throw new Error('Email is required');
    }
    // 更多验证逻辑
  }
}

module.exports = UserService;
```

## 错误处理机制

### 1. 全局错误处理中间件
```javascript
// middleware/errorHandler.js
const logger = require('../utils/logger');

function errorHandler(err, req, res, next) {
  // 记录错误日志
  logger.error({
    message: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('User-Agent')
  });

  // 区分错误类型
  if (err.name === 'ValidationError') {
    return res.status(400).json({
      error: 'Validation Error',
      message: err.message,
      details: err.details
    });
  }

  if (err.name === 'UnauthorizedError') {
    return res.status(401).json({
      error: 'Unauthorized',
      message: 'Invalid token'
    });
  }

  // 生产环境不暴露详细错误信息
  const isDevelopment = process.env.NODE_ENV === 'development';
  
  res.status(err.status || 500).json({
    error: 'Internal Server Error',
    message: isDevelopment ? err.message : 'Something went wrong',
    ...(isDevelopment && { stack: err.stack })
  });
}

module.exports = errorHandler;
```

### 2. 异步错误捕获
```javascript
// utils/asyncHandler.js
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

module.exports = asyncHandler;

// 使用示例
const asyncHandler = require('../utils/asyncHandler');

router.get('/users/:id', asyncHandler(async (req, res) => {
  const user = await userService.getUserById(req.params.id);
  res.json(user);
}));
```

## 配置管理

### 1. 环境配置分离
```javascript
// config/index.js
const dotenv = require('dotenv');
const path = require('path');

// 根据环境加载不同配置文件
const envFile = process.env.NODE_ENV === 'production' 
  ? '.env.production' 
  : '.env.development';

dotenv.config({ path: path.resolve(process.cwd(), envFile) });

const config = {
  port: process.env.PORT || 3000,
  nodeEnv: process.env.NODE_ENV || 'development',
  
  database: {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    name: process.env.DB_NAME || 'myapp',
    username: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD
  },
  
  jwt: {
    secret: process.env.JWT_SECRET,
    expiresIn: process.env.JWT_EXPIRES_IN || '24h'
  },
  
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: process.env.REDIS_PORT || 6379,
    password: process.env.REDIS_PASSWORD
  }
};

// 验证必需的环境变量
const requiredEnvVars = ['DB_USERNAME', 'DB_PASSWORD', 'JWT_SECRET'];
requiredEnvVars.forEach(envVar => {
  if (!process.env[envVar]) {
    throw new Error(`Missing required environment variable: ${envVar}`);
  }
});

module.exports = config;
```

### 2. 配置验证
```javascript
// config/validation.js
const Joi = require('joi');

const configSchema = Joi.object({
  PORT: Joi.number().default(3000),
  NODE_ENV: Joi.string().valid('development', 'production', 'test').default('development'),
  DB_HOST: Joi.string().required(),
  DB_PORT: Joi.number().default(5432),
  DB_NAME: Joi.string().required(),
  JWT_SECRET: Joi.string().min(32).required()
});

const { error, value } = configSchema.validate(process.env);

if (error) {
  throw new Error(`Config validation error: ${error.message}`);
}

module.exports = value;
```

## 日志管理

### 1. 结构化日志
```javascript
// utils/logger.js
const winston = require('winston');
const path = require('path');

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: 'wechat-api' },
  transports: [
    // 错误日志文件
    new winston.transports.File({
      filename: path.join('logs', 'error.log'),
      level: 'error',
      maxsize: 5242880, // 5MB
      maxFiles: 5
    }),
    
    // 所有日志文件
    new winston.transports.File({
      filename: path.join('logs', 'combined.log'),
      maxsize: 5242880,
      maxFiles: 5
    })
  ]
});

// 开发环境添加控制台输出
if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.combine(
      winston.format.colorize(),
      winston.format.simple()
    )
  }));
}

module.exports = logger;
```

### 2. 请求日志中间件
```javascript
// middleware/requestLogger.js
const logger = require('../utils/logger');
const { v4: uuidv4 } = require('uuid');

function requestLogger(req, res, next) {
  const requestId = uuidv4();
  req.requestId = requestId;
  
  const startTime = Date.now();
  
  // 记录请求开始
  logger.info({
    requestId,
    method: req.method,
    url: req.url,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    message: 'Request started'
  });
  
  // 监听响应结束
  res.on('finish', () => {
    const duration = Date.now() - startTime;
    
    logger.info({
      requestId,
      method: req.method,
      url: req.url,
      statusCode: res.statusCode,
      duration: `${duration}ms`,
      message: 'Request completed'
    });
  });
  
  next();
}

module.exports = requestLogger;
```

## 性能优化

### 1. 数据库连接池
```javascript
// config/database.js
const { Pool } = require('pg');
const config = require('./index');

const pool = new Pool({
  host: config.database.host,
  port: config.database.port,
  database: config.database.name,
  user: config.database.username,
  password: config.database.password,
  max: 20, // 最大连接数
  idleTimeoutMillis: 30000, // 空闲超时
  connectionTimeoutMillis: 2000, // 连接超时
});

// 监听连接池事件
pool.on('connect', () => {
  console.log('Connected to database');
});

pool.on('error', (err) => {
  console.error('Database connection error:', err);
});

module.exports = pool;
```

### 2. Redis缓存实现
```javascript
// utils/cache.js
const redis = require('redis');
const config = require('../config');
const logger = require('./logger');

class CacheService {
  constructor() {
    this.client = redis.createClient({
      host: config.redis.host,
      port: config.redis.port,
      password: config.redis.password,
      retry_strategy: (options) => {
        if (options.error && options.error.code === 'ECONNREFUSED') {
          logger.error('Redis server refused connection');
          return new Error('Redis server refused connection');
        }
        if (options.total_retry_time > 1000 * 60 * 60) {
          return new Error('Retry time exhausted');
        }
        return Math.min(options.attempt * 100, 3000);
      }
    });
    
    this.client.on('error', (err) => {
      logger.error('Redis error:', err);
    });
  }

  async get(key) {
    try {
      const value = await this.client.get(key);
      return value ? JSON.parse(value) : null;
    } catch (error) {
      logger.error('Cache get error:', error);
      return null;
    }
  }

  async set(key, value, ttl = 3600) {
    try {
      await this.client.setex(key, ttl, JSON.stringify(value));
      return true;
    } catch (error) {
      logger.error('Cache set error:', error);
      return false;
    }
  }

  async del(key) {
    try {
      await this.client.del(key);
      return true;
    } catch (error) {
      logger.error('Cache delete error:', error);
      return false;
    }
  }
}

module.exports = new CacheService();
```

## 安全实践

### 1. 输入验证中间件
```javascript
// middleware/validation.js
const Joi = require('joi');

function validate(schema) {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.body);
    
    if (error) {
      return res.status(400).json({
        error: 'Validation Error',
        message: error.details[0].message
      });
    }
    
    req.body = value; // 使用验证后的值
    next();
  };
}

// 使用示例
const userSchema = Joi.object({
  name: Joi.string().min(2).max(50).required(),
  email: Joi.string().email().required(),
  age: Joi.number().min(18).max(120)
});

router.post('/users', validate(userSchema), createUser);
```

### 2. 安全头设置
```javascript
// middleware/security.js
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

// 安全头
const securityHeaders = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"]
    }
  }
});

// 速率限制
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15分钟
  max: 100, // 最多100个请求
  message: 'Too many requests from this IP'
});

module.exports = {
  securityHeaders,
  limiter
};
```