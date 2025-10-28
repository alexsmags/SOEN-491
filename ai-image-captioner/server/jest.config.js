/** @type {import('jest').Config} */
export default {
  preset: "ts-jest/presets/default-esm",
  testEnvironment: "node",
  testMatch: ["**/__tests__/**/*.test.ts?(x)"],
  transform: {
    "^.+\\.[tj]sx?$": [
      "ts-jest",
      {
        useESM: true,
        tsconfig: "tsconfig.test.json",
        // Ensures instrumentation for coverage
        isolatedModules: false,
        diagnostics: false
      }
    ],
  },
  extensionsToTreatAsEsm: [".ts", ".tsx"],
  moduleNameMapper: {
    "^(\\.{1,2}/.*)\\.js$": "$1"
  },
  setupFilesAfterEnv: ["<rootDir>/jest.setup.ts"],
  clearMocks: true,

  // Coverage
  collectCoverage: true,
  coverageDirectory: "coverage",
  coverageReporters: ["text", "lcov"],
  coverageThreshold: {
    global: { statements: 80, branches: 80, functions: 80, lines: 80 }
  },
  collectCoverageFrom: [
    "server/**/*.ts",
    "config/**/*.ts",
    "!**/__tests__/**",
    "!**/__mocks__/**",
    "!**/*.d.ts"
  ],
};
