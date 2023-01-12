const { defaults } = require('jest-config');

/** @type {import('jest').Config} */
const config = {
  resetMocks: true,
  // roots: ['src'],
  setupFiles: ['./src/test-jest/vscode-mock.ts'],
  testPathIgnorePatterns: [...defaults.testPathIgnorePatterns, 'src/test/suite', 'out/test/suite', '.js'],
};

// eslint-disable-next-line no-undef
module.exports = config;