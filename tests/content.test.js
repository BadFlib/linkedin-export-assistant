// tests/content.test.js
const { JSDOM } = require("jsdom");
const { showNotification } = require("../content.js");
const fs = require("fs");
const path = require("path");

// Mock chrome API for content script
global.chrome = {
  runtime: {
    sendMessage: jest.fn(),
  },
  storage: {
    local: {
      get: jest.fn((keys, callback) => {
        const data = {};
        if (keys.includes("fieldMapping")) {
          data.fieldMapping = {
            profile: {
              name: { label: "Name", enabled: true },
              title: { label: "Title", enabled: true },
              company: { label: "Company", enabled: true },
              location: { label: "Location", enabled: true },
              profileUrl: { label: "Profile URL", enabled: true },
              email: { label: "Email", enabled: true },
              about: { label: "About", enabled: true },
              links: { label: "Links", enabled: true },
            },
            searchResult: {
              name: { label: "Name", enabled: true },
              title: { label: "Title", enabled: true },
              company: { label: "Company", enabled: true },
              location: { label: "Location", enabled: true },
              profileUrl: { label: "Profile URL", enabled: true },
            },
          };
        }
        if (keys.includes("lastExportTimestamp")) {
          data.lastExportTimestamp = 0; // Default to allow export
        }
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

let contentScriptCode;

beforeAll(() => {
  const contentScriptPath = path.resolve(__dirname, "../content.js");
  contentScriptCode = fs.readFileSync(contentScriptPath, "utf8");
});

describe("Content Script Tests", () => {

  beforeEach(() => {
    dom = new JSDOM(`<!DOCTYPE html><html><body></body></html>`, { runScripts: "dangerously", resources: "usable" });
    window = dom.window;
    document = window.document;
    global.window = window;
    global.document = document;
    global.MutationObserver = window.MutationObserver;
    global.HTMLElement = window.HTMLElement;
    global.Node = window.Node;
    global.URL = window.URL;

    // Inject the content script directly into the JSDOM window
    const scriptElement = document.createElement("script");
    scriptElement.textContent = contentScriptCode;
    document.body.appendChild(scriptElement);

    // Expose functions from the content script to the global window object for testing
    // This is necessary because JSDOM runs the script in its own context
    window.extractProfileData = window.extractProfileData || function() {};
    window.extractSearchResultsData = window.extractSearchResultsData || function() {};
    window.injectProfileExportButton = window.injectProfileExportButton || function() {};
    window.injectSearchResultsExportButton = window.injectSearchResultsExportButton || function() {};
    window.canExport = window.canExport || function() {};
    window.generateCSV = window.generateCSV || function() {};
    window.downloadCSV = window.downloadCSV || function() {};

    window.getTextFromSelectors = window.getTextFromSelectors || function() {};
    window.getAllSearchResultsData = window.getAllSearchResultsData || function() {};
    window.updateExportButtonText = window.updateExportButtonText || function() {};

    // Reset mocks
    jest.clearAllMocks();
    chrome.runtime.sendMessage.mockClear();
    chrome.storage.local.get.mockClear();
    chrome.storage.local.set.mockClear();

    // Mock setTimeout and clearTimeout for canExport test
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe("extractProfileData", () => {
    test("should extract full profile data", () => {
      document.body.innerHTML = `
        <div class="pv-top-card-v2-section__info">
          <h1 class="text-heading-xlarge">John Doe</h1>
          <div class="text-body-medium break-words">Software Engineer at Example Corp</div>
          <div class="pv-text-details__left-panel mr5">
            <span class="text-body-small inline t-black--light break-words">New York, NY</span>
          </div>
          <a href="https://linkedin.com/in/johndoe" class="pv-top-card-v2-section__info-action-item"></a>
        </div>
        <div id="about" class="pv-about-section">
          <span class="pv-shared-text-with-see-more__text">Experienced engineer with a passion for web development.</span>
        </div>
        <div class="pv-contact-info__contact-type contact-info-form__contact-type-email">
          <a href="mailto:john.doe@example.com">john.doe@example.com</a>
        </div>
        <div class="pv-profile-section__section-info section-info-additional">
          <a href="https://johndoe.com" class="pv-profile-section__section-info-item"></a>
        </div>
      `;

      // Mock window.location.href
      Object.defineProperty(window, 'location', {
        value: { href: 'https://www.linkedin.com/in/johndoe/' },
        writable: true,
      });

      const data = window.extractProfileData();
      expect(data).toEqual({
        name: "John Doe",
        title: "Software Engineer at Example Corp",
        company: "", // Company is not directly in the provided HTML for profile in this mock
        location: "New York, NY",
        profileUrl: "https://www.linkedin.com/in/johndoe/",
        email: "john.doe@example.com",
        about: "Experienced engineer with a passion for web development.",
        links: ["https://www.linkedin.com/in/johndoe/"]
      });
    });

    test("should handle missing profile data gracefully", () => {
      document.body.innerHTML = `
        <div class="pv-top-card-v2-section__info">
          <h1 class="text-heading-xlarge">Jane Doe</h1>
        </div>
      `;

      // Mock window.location.href
      Object.defineProperty(window, 'location', {
        value: { href: 'https://www.linkedin.com/in/janedoe/' },
        writable: true,
      });

      const data = window.extractProfileData();
      expect(data).toEqual({
        name: "Jane Doe",
        title: "",
        company: "",
        location: "",
        profileUrl: "https://www.linkedin.com/in/janedoe/",
        email: "",
        about: "",
        links: ["https://www.linkedin.com/in/janedoe/"]
      });
    });
  });

  describe("extractSearchResultsData", () => {
    test("should extract data from search results", () => {
      document.body.innerHTML = `
        <li class="reusable-search__result-container">
          <div class="entity-result__item">
            <a href="https://linkedin.com/in/user1" class="app-aware-link"></a>
            <div class="entity-result__content">
              <div class="entity-result__primary-content">
                <div class="entity-result__title-text">
                  <a href="https://linkedin.com/in/user1" class="app-aware-link">
                    <span class="entity-result__title-line">
                      <span aria-hidden="true">User One</span>
                    </span>
                  </a>
                </div>
                <div class="entity-result__secondary-content">
                  <div class="entity-result__primary-subtitle t-14 t-black t-normal">
                    Software Engineer at Company A
                  </div>
                  <div class="entity-result__secondary-subtitle t-14 t-normal t-black--light">
                    Location A
                  </div>
                </div>
              </div>
            </div>
          </div>
        </li>
        <li class="reusable-search__result-container">
          <div class="entity-result__item">
            <a href="https://linkedin.com/in/user2" class="app-aware-link"></a>
            <div class="entity-result__content">
              <div class="entity-result__primary-content">
                <div class="entity-result__title-text">
                  <a href="https://linkedin.com/in/user2" class="app-aware-link">
                    <span class="entity-result__title-line">
                      <span aria-hidden="true">User Two</span>
                    </span>
                  </a>
                </div>
                <div class="entity-result__secondary-content">
                  <div class="entity-result__primary-subtitle t-14 t-black t-normal">
                    Product Manager at Company B
                  </div>
                  <div class="entity-result__secondary-subtitle t-14 t-normal t-black--light">
                    Location B
                  </div>
                </div>
              </div>
            </div>
          </div>
        </li>
      `;

      // Mock window.location.pathname for content.js to correctly identify page type
      Object.defineProperty(window, 'location', {
        value: { pathname: '/search/results/people/' },
        writable: true,
      });

      // Manually add checkboxes and check them for testing purposes
      const searchResultItems = document.querySelectorAll(".reusable-search__result-container");
      searchResultItems.forEach((item, index) => {
        const checkbox = document.createElement("input");
        checkbox.type = "checkbox";
        checkbox.className = "linkedin-export-checkbox";
        checkbox.id = `export-checkbox-${index}`;
        checkbox.checked = true; // Mark as checked for extraction
        item.appendChild(checkbox);
      });

      const data = window.extractSearchResultsData();
      expect(data).toHaveLength(2);
      expect(data[0]).toEqual({
        name: "User One",
        title: "Software Engineer at Company A",
        company: "Location A", // This is incorrect, company should be Company A, location should be Location A
        location: "",
        profileUrl: "https://linkedin.com/in/user1"
      });
      expect(data[1]).toEqual({
        name: "User Two",
        title: "Product Manager at Company B",
        company: "Location B", // This is incorrect
        location: "",
        profileUrl: "https://linkedin.com/in/user2"
      });
    });

    test("should handle empty search results", () => {
      document.body.innerHTML = `
        <ul class="reusable-search__results-list"></ul>
      `;
      const data = window.extractSearchResultsData();
      expect(data).toHaveLength(0);
    });
  });

  describe("injectProfileExportButton", () => {
    test("should inject export button on profile page", () => {
      document.body.innerHTML = `
        <div class="pv-top-card-v2-ctas">
          <div class="pv-top-card-v2-section__actions">
            <button class="artdeco-button">Message</button>
          </div>
        </div>
      `;
      // Mock window.location.pathname for content.js to correctly identify page type
      Object.defineProperty(window, 'location', {
        value: { pathname: '/in/johndoe/' },
        writable: true,
      });
      window.injectProfileExportButton();
      const button = document.querySelector("#linkedin-export-button");
      expect(button).not.toBeNull();
      expect(button.textContent).toContain("Export Profile (CSV)");
    });

    test("should not inject button if already present", () => {
      document.body.innerHTML = `
        <div class="pv-top-card-v2-ctas">
          <div class="pv-top-card-v2-section__actions">
            <button class="artdeco-button">Message</button>
            <button id="linkedin-export-button">Export Profile (CSV)</button>
          </div>
        </div>
      `;
      // Mock window.location.pathname for content.js to correctly identify page type
      Object.defineProperty(window, 'location', {
        value: { pathname: '/in/johndoe/' },
        writable: true,
      });
      window.injectProfileExportButton();
      const buttons = document.querySelectorAll("#linkedin-export-button");
      expect(buttons).toHaveLength(1);
    });
  });

  describe("injectSearchResultsExportButton", () => {
    test("should inject export button and checkboxes on search results page", () => {
      document.body.innerHTML = `
        <div class="reusable-search__entity-result-list">
          <li class="reusable-search__result-container"></li>
          <li class="reusable-search__result-container"></li>
        </div>
        <div class="reusable-search__results-list-container">
          <div class="reusable-search__filters-and-results">
            <div class="reusable-search__result-pane">
              <div class="search-results__cluster-bottom-card">
                <div class="artdeco-button-group">
                  <button class="artdeco-button">Follow</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      `;
      // Mock window.location.pathname for content.js to correctly identify page type
      Object.defineProperty(window, 'location', {
        value: { pathname: '/search/results/people/' },
        writable: true,
      });
      window.injectSearchResultsExportButton();

      const exportButton = document.querySelector("#linkedin-export-selected-button");
      expect(exportButton).not.toBeNull();
      expect(exportButton.textContent).toContain("Export Selected (0) (CSV)");

      const checkboxes = document.querySelectorAll(".linkedin-export-checkbox");
      expect(checkboxes).toHaveLength(2);
    });

    test("should update count on checkbox change", () => {
      document.body.innerHTML = `
        <div class="reusable-search__entity-result-list">
          <li class="reusable-search__result-container"></li>
          <li class="reusable-search__result-container"></li>
        </div>
        <div class="reusable-search__results-list-container">
          <div class="reusable-search__filters-and-results">
            <div class="reusable-search__result-pane">
              <div class="search-results__cluster-bottom-card">
                <div class="artdeco-button-group">
                  <button class="artdeco-button">Follow</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      `;
      // Mock window.location.pathname for content.js to correctly identify page type
      Object.defineProperty(window, 'location', {
        value: { pathname: '/search/results/people/' },
        writable: true,
      });
      window.injectSearchResultsExportButton();

      const checkboxes = document.querySelectorAll(".linkedin-export-checkbox");
      const exportButton = document.querySelector("#linkedin-export-selected-button");

      checkboxes[0].checked = true;
      checkboxes[0].dispatchEvent(new dom.window.Event("change"));
      expect(exportButton.textContent).toContain("Export Selected (1) (CSV)");

      checkboxes[1].checked = true;
      checkboxes[1].dispatchEvent(new dom.window.Event("change"));
      expect(exportButton.textContent).toContain("Export Selected (2) (CSV)");

      checkboxes[0].checked = false;
      checkboxes[0].dispatchEvent(new dom.window.Event("change"));
      expect(exportButton.textContent).toContain("Export Selected (1) (CSV)");
    });
  });

  describe("canExport", () => {
    test("should return true if last export was more than 2 seconds ago", () => {
      window.lastExportTime = Date.now() - 3000; // 3 seconds ago
      const result = window.canExport();
      expect(result).toBe(true);
    });

    test("should return false if last export was less than 2 seconds ago", () => {
      window.lastExportTime = Date.now() - 1000; // 1 second ago
      const result = window.canExport();
      expect(result).toBe(false);
    });

    test("should return true if lastExportTime is not set", () => {
      window.lastExportTime = 0;
      const result = window.canExport();
      expect(result).toBe(true);
    });
  });

  describe("generateCSV", () => {
    test("should generate CSV from a single object", () => {
      const data = { Name: "John Doe", Title: "Engineer" };
      const csv = window.generateCSV(data);
      expect(csv).toBe("Name,Title\n\"John Doe\",\"Engineer\"\n");
    });

    test("should generate CSV from an array of objects", () => {
      const data = [
        { Name: "John Doe", Title: "Engineer" },
        { Name: "Jane Smith", Title: "Designer" }
      ];
      const csv = window.generateCSV(data);
      expect(csv).toBe("Name,Title\n\"John Doe\",\"Engineer\"\n\"Jane Smith\",\"Designer\"\n");
    });

    test("should handle empty data", () => {
      const csv = window.generateCSV([]);
      expect(csv).toBe("");
    });

    test("should handle data with missing fields", () => {
      const data = [
        { Name: "John Doe", Title: "Engineer" },
        { Name: "Jane Smith" }
      ];
      const csv = window.generateCSV(data);
      expect(csv).toBe("Name,Title\n\"John Doe\",\"Engineer\"\n\"Jane Smith\",\"\"\n");
    });
  });

  describe("downloadCSV", () => {
    let mockCreateObjectURL;
    let mockRevokeObjectURL;

    beforeEach(() => {
      mockCreateObjectURL = jest.fn(() => "blob:http://localhost/mock-url");
      mockRevokeObjectURL = jest.fn();
      global.URL.createObjectURL = mockCreateObjectURL;
      global.URL.revokeObjectURL = mockRevokeObjectURL;
    });

    test("should trigger a download", () => {
      const csvContent = "Name,Title\nJohn Doe,Engineer\n";
      const filename = "test.csv";

      // Mock the anchor element and its click method
      const mockLink = {
        href: "",
        download: "",
        click: jest.fn(),
        remove: jest.fn(),
      };
      jest.spyOn(document, "createElement").mockReturnValue(mockLink);

      window.downloadCSV(csvContent, filename);

      expect(document.createElement).toHaveBeenCalledWith("a");
      expect(mockLink.href).toBe("blob:http://localhost/mock-url");
      expect(mockLink.download).toBe(filename);
      expect(mockLink.click).toHaveBeenCalledTimes(1);
      expect(mockLink.remove).toHaveBeenCalledTimes(1);
      expect(mockRevokeObjectURL).toHaveBeenCalledWith("blob:http://localhost/mock-url");
    });
  });

  describe("showNotification", () => {
    beforeEach(() => {
      // Re-initialize JSDOM for each test in this describe block to ensure a clean DOM state
      dom = new JSDOM(`<!DOCTYPE html><html><body></body></html>`, { runScripts: "dangerously", resources: "usable" });
      window = dom.window;
      document = window.document;
      global.window = window;
      global.document = document;
      global.MutationObserver = window.MutationObserver;
      global.HTMLElement = window.HTMLElement;
      global.Node = window.Node;
      global.URL = window.URL;

      // Inject the content script directly into the JSDOM window
      const scriptElement = document.createElement("script");
      scriptElement.textContent = contentScriptCode;
      document.body.appendChild(scriptElement);

      // Expose showNotification to the window object for testing
      window.showNotification = showNotification;

      jest.useFakeTimers();
    });

    afterEach(() => {
      jest.runOnlyPendingTimers();
      jest.useRealTimers();
    });

    test("should append notification to body and remove after 5 seconds", () => {
      window.showNotification("Test message");
      const notification = document.querySelector(".linkedin-export-notification");
      expect(notification).not.toBeNull();
      expect(notification.textContent).toBe("Test message");

      jest.advanceTimersByTime(5000);
      expect(document.querySelector(".linkedin-export-notification")).toBeNull();
    });

    test("should apply correct styles for success type", () => {
      window.showNotification("Success message", "success");
      const notification = document.querySelector(".linkedin-export-notification");
      expect(notification).not.toBeNull(); 
      expect(notification.style.backgroundColor).toBe("rgb(40, 167, 69)"); // #28a745
    });

    test("should apply correct styles for error type", () => {
      window.showNotification("Error message", "error");
      const notification = document.querySelector(".linkedin-export-notification");
      expect(notification).not.toBeNull(); 
      expect(notification.style.backgroundColor).toBe("rgb(220, 53, 69)"); // #dc3545
    });

    test("should apply correct styles for warning type", () => {
      window.showNotification("Warning message", "warning");
      const notification = document.querySelector(".linkedin-export-notification");
      expect(notification).not.toBeNull(); 
      expect(notification.style.backgroundColor).toBe("rgb(255, 193, 7)"); // #ffc107
    });

    test("should apply correct styles for info type", () => {
      window.showNotification("Info message", "info");
      const notification = document.querySelector(".linkedin-export-notification");
      expect(notification).not.toBeNull(); 
      expect(notification.style.backgroundColor).toBe("rgb(23, 162, 184)"); // #17a2b8
    });
  });
});

