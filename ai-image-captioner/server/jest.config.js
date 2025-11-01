/** @type {import('jest').Config} */
export default {
  preset: "ts-jest/presets/default-esm",
  testEnvironment: "node",
  testMatch: ["**/__tests__/**/*.(test|spec).ts?(x)", "**/?(*.)+(test|spec).ts?(x)"],
  transform: {
    "^.+\\.[tj]sx?$": [
      "ts-jest",
      {
        useESM: true,
        tsconfig: "tsconfig.test.json",
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

  collectCoverage: true,
  coverageDirectory: "coverage",
  coverageReporters: ["text", "lcov"],
  coverageThreshold: {
    global: { statements: 75, branches: 75, functions: 75, lines: 75 }
  },
  collectCoverageFrom: [
  "**/*.{ts,tsx}",
  "!**/__tests__/**",
  "!**/__mocks__/**",
  "!**/*.d.ts",
  "!**/coverage/**",
  "!**/dist/**",
  "!**/build/**",
  "!jest.config.*",
],
};
