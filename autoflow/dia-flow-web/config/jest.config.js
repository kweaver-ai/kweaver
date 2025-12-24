const currentWorkingDirectory = process.cwd();

module.exports = {
  rootDir: './',
  preset: 'ts-jest/presets/js-with-ts',
  testMatch: [`${currentWorkingDirectory}/src/**/*.test.{js,jsx,ts,tsx}`],
  transform: {
    '/.test.tsx?/': ['ts-jest'],
  },
  collectCoverage: true,
  coverageDirectory: `${currentWorkingDirectory}/testResult/coverage`,
  moduleNameMapper: {
    '^.+\\.css$': 'identity-obj-proxy',
    '^.+\\.less$': 'identity-obj-proxy',
    'antd/es/locale/zh_TW': 'identity-obj-proxy',
    'antd/es/locale/zh_CN': 'identity-obj-proxy',
    'antd/es/locale/en_US': 'identity-obj-proxy',
    '^@/(.*)$': `${currentWorkingDirectory}/src/$1`,
  },
  coverageReporters: ['json', 'lcov', 'text', 'clover', 'html', 'cobertura'],
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx'],
  setupFiles: ['jest-canvas-mock'],
  setupFilesAfterEnv: ['<rootDir>/tests/setupAfterEnv.ts'],
  testEnvironment: 'jsdom',
  reporters: [
    'default',
    [
      'jest-junit',
      {
        suiteName: 'console tests',
        outputDirectory: `${currentWorkingDirectory}/testResult/junitResult`,
        outputName: 'UTReport.xml',
        classNameTemplate: '{classname}-{title}',
        titleTemplate: '{classname}-{title}',
        ancestorSeparator: ' › ',
        usePathForSuiteName: 'true',
      },
    ],
  ],
};
