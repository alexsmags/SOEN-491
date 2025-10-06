module.exports = {
  testEnvironment: "node",
  collectCoverage: true,
  coverageDirectory: "coverage",
  coverageReporters: ["text", "lcov"],
  transform: {
    "^.+\\.[tj]s$": "ts-jest",
  },
};