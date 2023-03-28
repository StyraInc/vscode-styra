const {defaults} = require('jest-config');

/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  collectCoverage: true,
  collectCoverageFrom: [
    'src/**/*.ts',
    '!**/node_modules/**',
    '!src/bin/**',
    '!src/test*/**',
    '!src/external/**',
  ],
  // reference: https://istanbul.js.org/docs/advanced/alternative-reporters/
  coverageReporters: ['text', 'lcov', 'json-summary'],
  preset: 'ts-jest',
  testEnvironment: 'node',
  resetMocks: true,
  // roots: ['src'],
  setupFiles: ['./src/test-jest/vscode-mock.ts'],
  testPathIgnorePatterns: [...defaults.testPathIgnorePatterns, 'src/test/suite', 'out/test/suite', '.js'],
};
