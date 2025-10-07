require("@testing-library/jest-dom");
require("./chrome-mock");

// Mock console.warn and console.error to prevent them from cluttering test output
// and to allow asserting if they were called.
const originalWarn = console.warn;
const originalError = console.error;

beforeAll(() => {
  console.warn = jest.fn();
  console.error = jest.fn();
});

afterAll(() => {
  console.warn = originalWarn;
  console.error = originalError;
});

beforeEach(() => {
  // Clear all mocks before each test
  jest.clearAllMocks();
  // Reset chrome.storage.local data before each test
  chrome.storage.local.data = {};
});




// Mock MutationObserver
global.MutationObserver = class {
  constructor(callback) {
    this.callback = callback;
  }
  observe(element, options) {}
  disconnect() {}
  takeRecords() { return []; }
};
