// Test setup file
require('dotenv').config({ path: '.env.test' });

// Set test environment
process.env.NODE_ENV = 'test';

// Increase timeout for database operations
jest.setTimeout(30000);

// Global test utilities
global.testUtils = {
  delay: (ms) => new Promise(resolve => setTimeout(resolve, ms)),
  
  generateTestTodo: (overrides = {}) => ({
    title: 'Test Todo',
    description: 'Test Description',
    priority: 'medium',
    completed: false,
    ...overrides
  }),

  generateMultipleTestTodos: (count = 3) => {
    return Array.from({ length: count }, (_, i) => ({
      title: `Test Todo ${i + 1}`,
      description: `Test Description ${i + 1}`,
      priority: i % 2 === 0 ? 'high' : 'low',
      completed: i % 3 === 0
    }));
  }
};

// Mock console methods in tests to reduce noise
if (process.env.NODE_ENV === 'test') {
  global.console = {
    ...console,
    log: jest.fn(),
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  };
}
