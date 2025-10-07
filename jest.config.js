module.exports = {
  setupFilesAfterEnv: ["<rootDir>/tests/test-setup.js"],
  testEnvironment: "node", // Default for background scripts
  // For content.js and popup.js, we might need 'jsdom'
  // testMatch: ["<rootDir>/tests/**/*.test.js"]
};

