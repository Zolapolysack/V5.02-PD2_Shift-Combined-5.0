const { JSDOM } = require('jsdom');

// Setup JSDOM for DOM testing
const dom = new JSDOM('<!DOCTYPE html><html><body></body></html>', {
  url: 'http://localhost'
});
global.window = dom.window;
global.document = dom.window.document;
global.navigator = dom.window.navigator;

// Mock console methods for testing
global.console = {
  ...console,
  log: jest.fn(),
  error: jest.fn(),
  warn: jest.fn()
};

describe('PD2Notify', () => {
  beforeEach(() => {
    // Clear DOM before each test
    document.body.innerHTML = '';
    // Reset window.PD2NotifyState
    delete window.PD2NotifyState;
  });

  test('should create notification container', () => {
    require('../pd2-notify.js');
    expect(document.getElementById('notifications')).toBeTruthy();
  });

  test('should show notification', () => {
    require('../pd2-notify.js');
    window.PD2Notify('Test message', 'success');
    const notifications = document.getElementById('notifications');
    expect(notifications.children.length).toBe(1);
  });

  test('should deduplicate notifications', () => {
    require('../pd2-notify.js');
    window.PD2Notify('Test message', 'success');
    window.PD2Notify('Test message', 'success');
    const notifications = document.getElementById('notifications');
    expect(notifications.children.length).toBe(1);
  });
});
