const { resetExportCountIfNewMonth, mapData, defaultFieldMapping, EXPORT_LIMIT_FREE } = require("../background.js");

// Mock the chrome.runtime.onInstalled.addListener to prevent errors during module load
// This needs to be done before background.js is loaded
if (!global.chrome.runtime.onInstalled) {
  global.chrome.runtime.onInstalled = { addListener: jest.fn() };
}

// Load background.js once to register its listeners
const background = require("../background.js");

describe("Background Script Tests", () => {
  let listener;

  beforeAll(() => {
    // Get the actual listener from background.js after it has been loaded
    listener = chrome.runtime.onMessage.listeners[0];
    if (!listener) {
      throw new Error("chrome.runtime.onMessage listener not found. Ensure background.js adds it.");
    }
  });

  beforeEach(() => {
    // Reset chrome.storage.local.data before each test
    chrome.storage.local.data = {};
    // Mock chrome.runtime.sendMessage for tests that trigger it
    chrome.runtime.sendMessage = jest.fn();
    // Clear mock for onInstalled listener if it was called
    chrome.runtime.onInstalled.addListener.mockClear();
    // Restore all mocks before each test to ensure isolation
    jest.restoreAllMocks(); // Restore mocks from previous tests
  });

  describe("resetExportCountIfNewMonth", () => {
    test("should reset exportCount if month has changed", async () => {
      // Set initial state for previous month
      await new Promise(resolve => chrome.storage.local.set({ lastExportMonth: 0, exportCount: 10 }, resolve));

      // Simulate current month as 1 (February)
      resetExportCountIfNewMonth(1);

      await new Promise(resolve => chrome.storage.local.get(["lastExportMonth", "exportCount"], result => {
        expect(result.lastExportMonth).toBe(1);
        expect(result.exportCount).toBe(0);
        resolve();
      }));
    });

    test("should not reset exportCount if month has not changed", async () => {
      // Set initial state for current month
      await new Promise(resolve => chrome.storage.local.set({ lastExportMonth: 1, exportCount: 10 }, resolve));

      // Simulate current month as 1 (February)
      resetExportCountIfNewMonth(1);

      await new Promise(resolve => chrome.storage.local.get(["lastExportMonth", "exportCount"], result => {
        expect(result.lastExportMonth).toBe(1);
        expect(result.exportCount).toBe(10);
        resolve();
      }));
    });

    test("should initialize lastExportMonth and exportCount if not set", async () => {
      resetExportCountIfNewMonth(2);

      await new Promise(resolve => chrome.storage.local.get(["lastExportMonth", "exportCount"], result => {
        expect(result.lastExportMonth).toBe(2);
        expect(result.exportCount).toBe(0);
        resolve();
      }));
    });
  });

  describe("mapData", () => {
    const rawProfileData = {
      name: "John Doe",
      title: "Software Engineer at Example Corp",
      company: "Example Corp",
      location: "New York, NY",
      profileUrl: "https://linkedin.com/in/johndoe",
      email: "john.doe@example.com",
      about: "Experienced engineer",
      links: ["https://linkedin.com/in/johndoe", "https://johndoe.com"]
    };

    test("should map data according to provided mapping", () => {
      const mapping = {
        name: { label: "Full Name", enabled: true },
        title: { label: "Job Title", enabled: true },
        company: { label: "Current Company", enabled: true },
        email: { label: "Email Address", enabled: true },
        nonExistentField: { label: "Should Not Appear", enabled: true }
      };
      const mapped = mapData(rawProfileData, mapping);
      expect(mapped).toEqual({
        "Full Name": "John Doe",
        "Job Title": "Software Engineer at Example Corp",
        "Current Company": "Example Corp",
        "Email Address": "john.doe@example.com",
        "Should Not Appear": ""
      });
    });

    test("should only include enabled fields", () => {
      const mapping = {
        name: { label: "Full Name", enabled: true },
        title: { label: "Job Title", enabled: false },
        company: { label: "Current Company", enabled: true }
      };
      const mapped = mapData(rawProfileData, mapping);
      expect(mapped).toEqual({
        "Full Name": "John Doe",
        "Current Company": "Example Corp"
      });
    });

    test("should handle empty raw data gracefully", () => {
      const mapping = {
        name: { label: "Full Name", enabled: true },
        title: { label: "Job Title", enabled: true }
      };
      const mapped = mapData({}, mapping);
      expect(mapped).toEqual({
        "Full Name": "",
        "Job Title": ""
      });
    });

    test("should use defaultFieldMapping if no mapping is provided", () => {
      const mapped = mapData(rawProfileData, defaultFieldMapping.profile);
      expect(mapped).toEqual({
        "Name": "John Doe",
        "Title": "Software Engineer at Example Corp",
        "Company": "Example Corp",
        "Location": "New York, NY",
        "Profile URL": "https://linkedin.com/in/johndoe",
        "Email": "john.doe@example.com",
        "About": "Experienced engineer",
        "Links": "https://linkedin.com/in/johndoe, https://johndoe.com"
      });
    });
  });

  describe("chrome.runtime.onMessage listener", () => {
    const EXPORT_LIMIT_PRO = 999999; // Essentially unlimited

    test("should handle EXPORT_PROFILE successfully for free user within limit", async () => {
      await new Promise(resolve => chrome.storage.local.set({ exportCount: 0, isProUser: false, lastExportMonth: new Date().getMonth() }, resolve));

      const profileData = { name: "Test User", title: "Engineer" };
      const request = { type: "EXPORT_PROFILE", payload: profileData };
      const sendResponse = jest.fn();

      listener(request, {}, sendResponse);

      await new Promise(resolve => setTimeout(resolve, 0)); // Wait for async storage operations

      expect(sendResponse).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
      await new Promise(resolve => chrome.storage.local.get(["exportCount", "exportHistory"], result => {
        expect(result.exportCount).toBe(1);
        expect(result.exportHistory).toHaveLength(1);
        expect(result.exportHistory[0].data.Name).toBe("Test User");
        resolve();
      }));
    });

    test("should prevent EXPORT_PROFILE for free user exceeding limit", async () => {
      await new Promise(resolve => chrome.storage.local.set({ exportCount: EXPORT_LIMIT_FREE, isProUser: false, lastExportMonth: new Date().getMonth() }, resolve));

      const profileData = { name: "Test User", title: "Engineer" };
      const request = { type: "EXPORT_PROFILE", payload: profileData };
      const sendResponse = jest.fn();

      listener(request, {}, sendResponse);

      await new Promise(resolve => setTimeout(resolve, 0));

      expect(sendResponse).toHaveBeenCalledWith(expect.objectContaining({ success: false, message: expect.stringContaining("Export limit reached") }));
      await new Promise(resolve => chrome.storage.local.get(["exportCount"], result => {
        expect(result.exportCount).toBe(EXPORT_LIMIT_FREE);
        resolve();
      }));
    });

    test("should allow EXPORT_PROFILE for PRO user", async () => {
      await new Promise(resolve => chrome.storage.local.set({ exportCount: EXPORT_LIMIT_FREE, isProUser: true, lastExportMonth: new Date().getMonth() }, resolve));

      const profileData = { name: "PRO User", title: "Manager" };
      const request = { type: "EXPORT_PROFILE", payload: profileData };
      const sendResponse = jest.fn();

      listener(request, {}, sendResponse);

      await new Promise(resolve => setTimeout(resolve, 0));

      expect(sendResponse).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
      await new Promise(resolve => chrome.storage.local.get(["exportCount", "exportHistory"], result => {
        expect(result.exportCount).toBe(EXPORT_LIMIT_FREE + 1);
        expect(result.exportHistory).toHaveLength(1);
        expect(result.exportHistory[0].data.Name).toBe("PRO User");
        resolve();
      }));
    });

    test("should handle EXPORT_SEARCH_RESULTS successfully for free user within limit", async () => {
      await new Promise(resolve => chrome.storage.local.set({ exportCount: 0, isProUser: false, lastExportMonth: new Date().getMonth() }, resolve));

      const searchResultsData = [{ name: "User 1" }, { name: "User 2" }];
      const request = { type: "EXPORT_SEARCH_RESULTS", payload: searchResultsData };
      const sendResponse = jest.fn();

      listener(request, {}, sendResponse);

      await new Promise(resolve => setTimeout(resolve, 0));

      expect(sendResponse).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
      await new Promise(resolve => chrome.storage.local.get(["exportCount", "exportHistory"], result => {
        expect(result.exportCount).toBe(1);
        expect(result.exportHistory).toHaveLength(1);
        expect(result.exportHistory[0].data).toHaveLength(2);
        expect(result.exportHistory[0].data[0].Name).toBe("User 1");
        resolve();
      }));
    });

    test("should return status correctly", async () => {
      await new Promise(resolve => chrome.storage.local.set({ exportCount: 5, isProUser: false, exportHistory: [{ id: 1 }], fieldMapping: { profile: { name: { label: "Name", enabled: true } } }, lastExportMonth: new Date().getMonth() }, resolve));

      const request = { type: "GET_STATUS" };
      const sendResponse = jest.fn();

      listener(request, {}, sendResponse);

      await new Promise(resolve => setTimeout(resolve, 0));

      expect(sendResponse).toHaveBeenCalledWith({
        exportCount: 5,
        exportLimit: EXPORT_LIMIT_FREE,
        isProUser: false,
        exportHistory: [{ id: 1 }],
        fieldMapping: { profile: { name: { label: "Name", enabled: true } } }
      });
    });

    test("should update field mapping", async () => {
      const newMapping = { profile: { name: { label: "Full Name", enabled: true } } };
      const request = { type: "UPDATE_FIELD_MAPPING", payload: newMapping };
      const sendResponse = jest.fn();

      listener(request, {}, sendResponse);

      await new Promise(resolve => setTimeout(resolve, 0));

      expect(sendResponse).toHaveBeenCalledWith({ success: true, message: "Field mapping updated." });
      await new Promise(resolve => chrome.storage.local.get(["fieldMapping"], result => {
        expect(result.fieldMapping).toEqual(newMapping);
        resolve();
      }));
    });

    test("should handle unknown request type", async () => {
      const request = { type: "UNKNOWN_TYPE" };
      const sendResponse = jest.fn();

      listener(request, {}, sendResponse);

      await new Promise(resolve => setTimeout(resolve, 0));

      expect(sendResponse).toHaveBeenCalledWith(expect.objectContaining({ success: false, message: "Unknown request type." }));
    });

    test("should handle errors during request processing", async () => {
      const invalidProfileData = { name: "Invalid" };
      const request = { type: "EXPORT_PROFILE", payload: invalidProfileData };
      const sendResponse = jest.fn();

      // Mock console.error to prevent it from polluting test output
      jest.spyOn(console, "error").mockImplementation(() => {});

      // Temporarily mock mapData to throw an error
      jest.spyOn(background, "mapData").mockImplementation((data, mapping) => { 
        if (data.name === "Invalid") {
          throw new Error("Mapping error"); 
        }
        // For valid data, call the original mapData implementation
        // This requires accessing the original mapData, which is exported from background.js
        // and can be accessed via `background.mapData` (the original, not the mock)
        return jest.requireActual("../background.js").mapData(data, mapping);
      });

      listener(request, {}, sendResponse);

      await new Promise(resolve => setTimeout(resolve, 0));

      expect(sendResponse).toHaveBeenCalledWith(expect.objectContaining({ success: false, message: "Error mapping data. Please check your field settings." }));
      expect(console.error).toHaveBeenCalledWith("Error mapping data:", expect.any(Error));

      // Restore all mocks
      jest.restoreAllMocks();
    });
  });
});

