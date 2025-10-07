const chrome = {
  storage: {
    local: {
      data: {},
      get: function(keys, callback) {
        const result = {};
        if (Array.isArray(keys)) {
          keys.forEach(key => {
            result[key] = this.data[key];
          });
        } else if (typeof keys === 'string') {
          result[keys] = this.data[keys];
        } else {
          Object.assign(result, this.data);
        }
        callback(result);
      },
      set: function(items, callback) {
        Object.assign(this.data, items);
        if (callback) callback();
      },
      clear: function(callback) {
        this.data = {};
        if (callback) callback();
      }
    }
  },
  runtime: {
    onMessage: {
      listeners: [],
      addListener: function(callback) {
        this.listeners.push(callback);
      },
      sendMessage: function(message, callback) {
        // Simulate message passing to background script
        // In a real test, you'd likely mock the background script's response directly
        // For now, we'll just call the listeners if any
        this.listeners.forEach(listener => {
          // Simulate async response
          setTimeout(() => {
            listener(message, {}, callback);
          }, 0);
        });
      }
    },
    onInstalled: {
      addListener: jest.fn(), // Ensure this is a Jest mock
    },
    getURL: function(path) {
      return `chrome-extension://mock-id/${path}`;
    }
  },
  tabs: {
    query: function(queryInfo, callback) {
      // Mock active tab for content script messages
      callback([{ id: 1, active: true, url: 'https://www.linkedin.com/in/test-profile/' }]);
    }
  }
};

// Global mock for tests
global.chrome = chrome;


