export default {
  testEnvironment: "jsdom",
  collectCoverage: true,
  coverageDirectory: "coverage",
  coverageReporters: ["text", "lcov"],
  setupFilesAfterEnv: ["@testing-library/jest-dom"],
  transform: {
    "^.+\\.[tj]sx?$": "babel-jest",
  },
};