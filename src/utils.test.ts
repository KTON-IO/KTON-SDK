import { describe, it, expect, vi, beforeEach } from 'vitest';
import { log } from './utils';

// We need to import the actual implementation for testing
const { checkDev } = await import('./utils');

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
    expect(checkDev()).toBe(true);
  });

  it('should return true for 127.0.0.1', () => {
    window.location.hostname = '127.0.0.1';
    expect(checkDev()).toBe(true);
  });

  it('should return true for preview URLs', () => {
    window.location.hostname = 'my-app-preview.com';
    expect(checkDev()).toBe(true);
  });

  it('should return false for other hostnames', () => {
    window.location.hostname = 'google.com';
    expect(checkDev()).toBe(false);
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
    log('Hello', 'World');
    expect(console.log).toHaveBeenCalledWith('Hello', 'World');
  });

  it('should not log messages when checkDev returns false', () => {
    vi.spyOn(global, 'window', 'get').mockReturnValueOnce({
        location: { hostname: 'production.com' }
    } as any);
    log('Should not appear');
    expect(console.log).not.toHaveBeenCalled();
  });
});