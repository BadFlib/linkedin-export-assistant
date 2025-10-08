const { TextEncoder, TextDecoder } = require("util");
global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;

const { JSDOM } = require("jsdom");

// Polyfill for Event, Blob, and URL for JSDOM environment
if (typeof Event === 'undefined') {
  global.Event = class Event {};
}
if (typeof Blob === 'undefined') {
  global.Blob = class Blob {};
}
if (typeof URL === 'undefined') {
  global.URL = {
    createObjectURL: jest.fn(() => 'blob:mockurl'),
    revokeObjectURL: jest.fn(),
  };
}

// Mock chrome API for background script
global.chrome = {
  runtime: {
    onMessage: {
      addListener: jest.fn(),
    },
    sendMessage: jest.fn(),
  },
  storage: {
    local: {
      get: jest.fn((keys, callback) => {
        const data = {};
        if (Array.isArray(keys)) {
          keys.forEach(key => (data[key] = undefined));
        } else if (typeof keys === "string") {
          data[keys] = undefined;
        }
        callback(data);
      }),
      set: jest.fn((items, callback) => {
        callback();
      }),
    },
  },
};

// Mock MutationObserver for JSDOM environment
global.MutationObserver = class {
  constructor(callback) {
    this.callback = callback;
  }
  observe(target, options) {
    // Do nothing in test environment to avoid 'parameter 1 is not of type Node' error
  }
  disconnect() { }
  takeRecords() { return []; }
};

// Set up JSDOM environment for content.js tests
let dom;
let window;
let document;

beforeEach(() => {
  dom = new JSDOM(`<!DOCTYPE html><html><body></body></html>`, { runScripts: "dangerously", resources: "usable" });
  window = dom.window;
  document = window.document;
  global.window = window;
  global.document = document;
  global.HTMLElement = window.HTMLElement;
  global.Node = window.Node;

  // Ensure document.body is explicitly available and writable
  if (!document.body) {
    const body = document.createElement('body');
    document.documentElement.appendChild(body);
  }
  document.body.innerHTML = ''; // Clear body content for each test

  // Clear all mocks before each test
  jest.clearAllMocks();
});


