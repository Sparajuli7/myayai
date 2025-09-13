module.exports = {
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/tests/setup.js'],
  testMatch: [
    '<rootDir>/tests/**/*.test.js',
    '<rootDir>/tests/**/*.spec.js'
  ],
  collectCoverageFrom: [
    '**/*.js',
    '!node_modules/**',
    '!dist/**',
    '!build/**',
    '!tests/**',
    '!coverage/**',
    '!*.config.js',
    '!scripts/**'
  ],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80
    }
  },
  moduleNameMapping: {
    '^@/(.*)$': '<rootDir>/$1'
  },
  testTimeout: 10000,
  verbose: true,
  globals: {
    chrome: {
      runtime: {
        getURL: jest.fn(),
        sendMessage: jest.fn(),
        onMessage: {
          addListener: jest.fn()
        }
      },
      storage: {
        sync: {
          get: jest.fn(),
          set: jest.fn(),
          clear: jest.fn()
        },
        local: {
          get: jest.fn(),
          set: jest.fn(),
          clear: jest.fn()
        }
      },
      tabs: {
        query: jest.fn(),
        create: jest.fn(),
        executeScript: jest.fn(),
        sendMessage: jest.fn()
      },
      notifications: {
        create: jest.fn()
      }
    }
  }
};
