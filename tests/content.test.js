const { JSDOM } = require("jsdom");
const fs = require("fs");
const path = require("path");

// Mock chrome API for content script
global.chrome = {
  runtime: {
    sendMessage: jest.fn(),
    onMessage: {
        addListener: jest.fn(),
    }
  },
  storage: {
    local: {
      get: jest.fn((keys, callback) => {
        const data = {};
        callback(data);
      }),
      set: jest.fn((items, callback) => {
        callback();
      }),
    },
  },
};

let dom;
let window;
let document;

let contentScript;

describe("Content Script Tests", () => {

  beforeEach(() => {
    dom = new JSDOM(`<!DOCTYPE html><html><body></body></html>`, { runScripts: "dangerously", resources: "usable" });
    window = dom.window;
    document = window.document;
    global.window = window;
    global.document = document;
    global.HTMLElement = window.HTMLElement;
    global.Node = window.Node;
    global.URL = window.URL;

    // Set window.location properties directly after JSDOM window is created
    window.location.href = 'about:blank';
    window.location.pathname = 'about:blank';

    // Explicitly set document.body
    if (!document.body) {
      const body = document.createElement('body');
      document.documentElement.appendChild(body);
    }
    document.body.innerHTML = ''; // Clear document.body content for each test

    jest.resetModules();
    // Import content.js AFTER JSDOM is set up
    contentScript = require("../content.js");

    // Reset mocks
    jest.clearAllMocks();

    // Mock setTimeout and clearTimeout for canExport test
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe("showNotification", () => {
    test("should display a notification", () => {
        contentScript.showNotification("Test message.", "info", document);
        console.log("Document body after showNotification:", document.body.innerHTML);
        const notification = document.querySelector(".linkedin-export-notification");
        expect(notification).not.toBeNull();
        expect(notification.textContent).toContain("Test message.");
        expect(notification.className).toContain("linkedin-export-notification--info");
    });

    test("should remove notification after 5 seconds", () => {
        contentScript.showNotification("Temporary message.", "info", document);
        const notification = document.querySelector(".linkedin-export-notification");
        expect(notification).not.toBeNull();

        jest.advanceTimersByTime(5301); // 5000 for fade out + 300 for removal + 1 for safety
        expect(document.querySelector(".linkedin-export-notification")).toBeNull();
    });

    test("should remove previous notification before displaying new one", () => {
        contentScript.showNotification("First message.", "info", document);
        expect(document.querySelectorAll(".linkedin-export-notification")).toHaveLength(1);

        contentScript.showNotification("Second message.", "info", document);
        expect(document.querySelectorAll(".linkedin-export-notification")).toHaveLength(1);
        expect(document.querySelector(".linkedin-export-notification").textContent).toContain("Second message.");
    });
  });
});
