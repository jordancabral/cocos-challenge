import type { Config } from 'jest';

const shared = {
  preset: 'ts-jest' as const,
  testEnvironment: 'node' as const,
};

const config: Config = {
  coverageThreshold: {
    global: {
      statements: 80.01,
      branches: 80.01,
      functions: 80.01,
      lines: 80.01,
    },
  },
  projects: [
    {
      displayName: 'unit',
      ...shared,
      testMatch: ['<rootDir>/test/unit/**/*.spec.ts'],
      collectCoverageFrom: [
        'src/domain/**/*.ts',
        'src/application/**/*.ts',
        'src/infrastructure/config/**/*.ts',
        'src/infrastructure/logging/**/*.ts',
        'src/infrastructure/http/**/*.ts',
      ],
    },
    {
      displayName: 'integration',
      ...shared,
      testMatch: ['<rootDir>/test/integration/**/*.spec.ts'],
    },
  ],
};

export default config;
