export default {
  coverageProvider: "v8",
  rootDir: "./__tests__",
  testEnvironment: "node",
  // https://github.com/fisker/node-style-text/issues/27#issuecomment-3146139617
  test: {
    deps: {
      interopDefault: false,
    },
  },
};
