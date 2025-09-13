module.exports = {
  env: {
    browser: true,
    es2021: true,
    webextensions: true,
    node: true,
    jest: true
  },
  extends: [
    'eslint:recommended',
    'standard'
  ],
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module'
  },
  globals: {
    chrome: 'readonly',
    browser: 'readonly',
    MyAyAIDashboard: 'readonly',
    ValueTracker: 'readonly',
    DashboardComponents: 'readonly',
    PlatformDetectors: 'readonly',
    OptimizationEngine: 'readonly',
    QualityScorer: 'readonly',
    PromptOptimizer: 'readonly',
    HealthMonitor: 'readonly',
    ErrorHandler: 'readonly',
    Logger: 'readonly'
  },
  rules: {
    // Code Quality
    'no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
    'no-console': ['warn', { allow: ['warn', 'error', 'info'] }],
    'no-debugger': 'error',
    'no-alert': 'error',
    
    // Performance
    'no-loop-func': 'error',
    'no-implied-eval': 'error',
    'prefer-const': 'error',
    
    // Best Practices
    'eqeqeq': 'error',
    'curly': 'error',
    'no-eval': 'error',
    'no-new-func': 'error',
    'no-return-assign': 'error',
    'no-self-compare': 'error',
    'no-throw-literal': 'error',
    'no-unmodified-loop-condition': 'error',
    'no-useless-call': 'error',
    'no-useless-concat': 'error',
    'no-useless-return': 'error',
    'prefer-promise-reject-errors': 'error',
    
    // Style
    'indent': ['error', 2],
    'quotes': ['error', 'single'],
    'semi': ['error', 'always'],
    'comma-dangle': ['error', 'never'],
    'object-curly-spacing': ['error', 'always'],
    'array-bracket-spacing': ['error', 'never'],
    'space-before-function-paren': ['error', 'never'],
    'keyword-spacing': ['error', { before: true, after: true }],
    'space-infix-ops': 'error',
    'space-unary-ops': 'error',
    'spaced-comment': ['error', 'always'],
    'no-trailing-spaces': 'error',
    'eol-last': 'error',
    'max-len': ['warn', { code: 120, ignoreUrls: true, ignoreStrings: true }],
    
    // ES6+
    'arrow-spacing': 'error',
    'no-var': 'error',
    'prefer-arrow-callback': 'error',
    'prefer-template': 'error',
    'template-curly-spacing': 'error',
    
    // Extension-specific
    'no-undef': 'error',
    'no-unused-expressions': ['error', { allowShortCircuit: true, allowTernary: true }]
  },
  overrides: [
    {
      files: ['tests/**/*.js', '**/*.test.js', '**/*.spec.js'],
      env: {
        jest: true
      },
      rules: {
        'no-console': 'off'
      }
    },
    {
      files: ['background/**/*.js'],
      env: {
        serviceworker: true
      }
    },
    {
      files: ['content/**/*.js'],
      env: {
        browser: true
      },
      rules: {
        'no-console': ['warn', { allow: ['warn', 'error'] }]
      }
    }
  ]
};
