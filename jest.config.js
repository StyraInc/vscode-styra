const { defaults } = require('jest-config');

/** @type {import('jest').Config} */
const config = {
  roots: ['src'],
  testPathIgnorePatterns: [...defaults.testPathIgnorePatterns, 'src/test/suite', 'out/test/suite', '.js'],
};

module.exports = config;