import { Config } from '../src/types';

// Simple unit tests without complex mocking

describe('Config Types', () => {
  it('should validate config structure', () => {
    const validConfig: Config = {
      appId: 'test_app_id',
      appSecret: 'test_app_secret',
      debug: true,
      publishToDraft: true,
      theme: 'default'
    };

    expect(validConfig.appId).toBe('test_app_id');
    expect(validConfig.appSecret).toBe('test_app_secret');
    expect(validConfig.debug).toBe(true);
    expect(validConfig.publishToDraft).toBe(true);
    expect(validConfig.theme).toBe('default');
  });

  it('should handle optional config properties', () => {
    const minimalConfig: Config = {
      appId: 'test_app_id',
      appSecret: 'test_app_secret'
    };

    expect(minimalConfig.appId).toBeDefined();
    expect(minimalConfig.appSecret).toBeDefined();
  });
});