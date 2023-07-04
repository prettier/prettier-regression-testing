module.exports = {
  coverageProvider: "v8",
  rootDir: "./__tests__",
  testEnvironment: "node",
  transform: {
    "^.+\\.(t|j)sx?$": "@swc/jest",
  },
};
