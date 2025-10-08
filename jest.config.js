module.exports = {
  setupFilesAfterEnv: ["<rootDir>/tests/test-setup.js"],
  transform: {
    "^.+\\.js$": "babel-jest",
  },
  testEnvironment: "jsdom", // Default to jsdom for content scripts
  testPathIgnorePatterns: ["/node_modules/"],
  // You can override testEnvironment for specific files if needed
  // For example, if background.test.js needs 'node' environment:
  // projects: [
  //   {
  //     displayName: "content",
  //     testEnvironment: "jsdom",
  //     testMatch: ["<rootDir>/tests/content.test.js"],
  //   },
  //   {
  //     displayName: "background",
  //     testEnvironment: "node",
  //     testMatch: ["<rootDir>/tests/background.test.js"],
  //   },
  // ],
};

