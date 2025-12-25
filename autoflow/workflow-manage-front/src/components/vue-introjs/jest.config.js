const path = require('path');
module.exports = {
    automock: false,
    collectCoverage: false,
    moduleFileExtensions: ['js'],
    transform: {
        '^.+\\.js$': '<rootDir>/node_modules/babel-jest',
    },
    moduleNameMapper: {
        '^vue$': 'vue/dist/vue.common.js',
        '~(.*)$': '<rootDir>/src/$1',
    },
    snapshotSerializers: [
    '<rootDir>/node_modules/jest-serializer-vue'
    ],
    testPathIgnorePatterns: [
    '/node_modules/',
    'test/e2e'
    ],
    setupTestFrameworkScriptFile: path.resolve('./jest-setup.js')
};

