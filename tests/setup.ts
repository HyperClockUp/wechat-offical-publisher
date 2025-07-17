// Jest setup file

// Mock console methods to reduce noise in tests
const originalConsole = global.console;
global.console = {
  ...console,
  // Uncomment to ignore specific log levels
  // log: () => {},
  // debug: () => {},
  // info: () => {},
  warn: () => {},
  error: () => {},
};

// Mock environment variables
process.env.NODE_ENV = 'test';
process.env.WECHAT_APP_ID = 'test_app_id';
process.env.WECHAT_APP_SECRET = 'test_app_secret';

// Global test utilities
global.testUtils = {
  createMockFile: (content: string) => {
    return {
      content,
      path: '/mock/file.md',
      exists: true
    };
  },
  
  createMockConfig: () => ({
    appId: 'test_app_id',
    appSecret: 'test_app_secret',
    debug: true,
    publishToDraft: true,
    theme: 'default'
  })
};

// Extend Jest matchers if needed
declare global {
  namespace jest {
    interface Matchers<R> {
      // Add custom matchers here if needed
    }
  }
  
  var testUtils: {
    createMockFile: (content: string) => any;
    createMockConfig: () => any;
  };
}