import { describe, it, expect, vi, beforeEach, beforeAll } from 'vitest';

let utils;

beforeAll(async () => {
  utils = await import('./utils');
});

describe('checkDev', () => {
  const originalLocation = window.location;

  beforeEach(() => {
    // Reset location mock before each test
    vi.stubGlobal('location', {
      ...originalLocation,
      hostname: 'production.com',
    });
  });

  it('should return true for localhost', () => {
    window.location.hostname = 'localhost';
    expect(utils.checkDev()).toBe(true);
  });

  it('should return true for 127.0.0.1', () => {
    window.location.hostname = '127.0.0.1';
    expect(utils.checkDev()).toBe(true);
  });

  it('should return true for preview URLs', () => {
    window.location.hostname = 'my-app-preview.com';
    expect(utils.checkDev()).toBe(true);
  });

  it('should return false for other hostnames', () => {
    window.location.hostname = 'google.com';
    expect(utils.checkDev()).toBe(false);
  });
});

describe('log', () => {
  beforeEach(() => {
    vi.spyOn(console, 'log').mockClear();
  });

  it('should log messages when checkDev returns true', () => {
    vi.spyOn(global, 'window', 'get').mockReturnValueOnce({
        location: { hostname: 'localhost' }
    } as any);
    utils.log('Hello', 'World');
    expect(console.log).toHaveBeenCalledWith('Hello', 'World');
  });

  it('should not log messages when checkDev returns false', () => {
    vi.spyOn(global, 'window', 'get').mockReturnValueOnce({
        location: { hostname: 'production.com' }
    } as any);
    utils.log('Should not appear');
    expect(console.log).not.toHaveBeenCalled();
  });
});