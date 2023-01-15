const { defaults } = require('jest-config');

/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  resetMocks: true,
  // roots: ['src'],
  setupFiles: ['./src/test-jest/vscode-mock.ts'],
  testPathIgnorePatterns: [...defaults.testPathIgnorePatterns, 'src/test/suite', 'out/test/suite', '.js'],
};
