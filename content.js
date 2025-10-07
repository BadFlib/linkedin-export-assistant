// content.js

if (typeof window !== 'undefined') {
    console.log("LinkedIn Export Assistant content script loaded in browser.");
}

// Function to extract profile data with performance optimization
function extractProfileData() {
  const data = {};

  try {
    // Use more efficient selectors and add fallbacks
    const nameSelectors = [
      "h1.text-heading-xlarge",
      "h1[data-anonymize='person-name']",
      ".pv-text-details__left-panel h1"
    ];
    data.name = getTextFromSelectors(nameSelectors);

    const titleSelectors = [
      ".text-body-medium.break-words",
      ".pv-text-details__right-panel .text-body-medium",
      ".pv-top-card--list-bullet .pv-entity__summary-info h2"
    ];
    data.title = getTextFromSelectors(titleSelectors);

    const experienceSelectors = [
      ".pv-text-details__right-panel-item-text.hoverable-link-text.break-words.text-body-small",
      ".pv-entity__summary-info .pv-entity__summary-info-v2",
      ".experience-section .pv-entity__summary-info h3"
    ];
    data.company = getTextFromSelectors(experienceSelectors);

    const locationSelectors = [
      ".text-body-small.inline.t-black--light.break-words",
      ".pv-text-details__left-panel .text-body-small",
      ".pv-top-card--list-bullet .pv-top-card__list-bullet-item"
    ];
    data.location = getTextFromSelectors(locationSelectors);

    const aboutSelectors = [
      ".pv-about-section .pv-shared-text-with-see-more__text",
      ".pv-about__summary-text .lt-line-clamp__raw-line",
      ".summary-section .pv-about__summary-text"
    ];
    data.about = getTextFromSelectors(aboutSelectors);

    // Profile URL
    data.profileUrl = window.location.href;

    // Links (basic implementation)
    data.links = [window.location.href];

    // Email (if visible in DOM)
    const emailElement = document.querySelector("a[href^='mailto:']");
    data.email = emailElement ? emailElement.href.replace("mailto:", "") : "";

    console.log("Profile data extracted successfully:", data);
    return data;
  } catch (error) {
    console.error("Error extracting profile data:", error);
    return { error: "Failed to extract profile data" };
  }
}

// Helper function to get text from multiple selectors (fallback mechanism)
function getTextFromSelectors(selectors) {
  for (const selector of selectors) {
    try {
      const element = document.querySelector(selector);
      if (element && element.innerText && element.innerText.trim()) {
        return element.innerText.trim();
      }
    } catch (e) {
      // console.warn(`Selector failed: ${selector}`, e); // Commented out to reduce noise during testing
    }
  }
  return "";
}

// Function to inject export button on profile page
function injectProfileExportButton() {
  const targetElement = document.querySelector(".pv-top-card-v2-ctas"); // Adjust selector if needed

  if (targetElement && !document.getElementById("linkedin-export-button")) {
    const exportButton = document.createElement("button");
    exportButton.id = "linkedin-export-button";
    exportButton.innerText = "Export Profile (CSV)";
    exportButton.style.cssText = `
      background-color: #0073b1;
      color: white;
      border: none;
      padding: 8px 16px;
      border-radius: 20px;
      font-size: 16px;
      cursor: pointer;
      margin-left: 10px;
    `;
    exportButton.addEventListener("click", () => {
      if (!canExport()) return;
      
      const profileData = extractProfileData();
      console.log("Extracted Profile Data:", profileData);
      // Send data to background script for export
      chrome.runtime.sendMessage({ type: "EXPORT_PROFILE", payload: profileData }, (response) => {
        if (response && response.success) {
          // Show preview in popup first
          chrome.runtime.sendMessage({ type: "SHOW_PREVIEW", payload: response.data });
          showNotification("Profile data ready for preview. Check the extension popup!", "info");
        } else {
          const errorMsg = response ? response.message : "Export failed";
          console.error("Export error:", errorMsg);
          showNotification(errorMsg, "error");
        }
      });
    });
    targetElement.appendChild(exportButton);
  }
}

// Function to extract data from search results (People search)
function extractSearchResultsData() {
  const results = [];
  const searchResultItems = document.querySelectorAll(".reusable-search__result-container"); // Adjust selector

  searchResultItems.forEach((item, index) => {
    const data = {};
    // Name
    const nameElement = item.querySelector("span.entity-result__title-text a span[aria-hidden='true']");
    data.name = nameElement ? nameElement.innerText.trim() : "";

    // Title
    const titleElement = item.querySelector(".entity-result__primary-subtitle");
    data.title = titleElement ? titleElement.innerText.trim() : "";

    // Company
    const companyElement = item.querySelector(".entity-result__secondary-subtitle");
    data.company = companyElement ? companyElement.innerText.trim() : "";

    // Location (often part of the primary subtitle or a separate element)
    const locationElement = item.querySelector(".entity-result__summary"); // Placeholder, needs refinement
    data.location = locationElement ? locationElement.innerText.trim() : "";

    // Profile URL
    const profileLinkElement = item.querySelector("span.entity-result__title-text a");
    data.profileUrl = profileLinkElement ? profileLinkElement.href : "";

    // Add checkbox for selection
    if (!item.querySelector(".linkedin-export-checkbox")) {
      const checkbox = document.createElement("input");
      checkbox.type = "checkbox";
      checkbox.className = "linkedin-export-checkbox";
      checkbox.id = `export-checkbox-${index}`;
      checkbox.style.cssText = `
        margin-right: 8px;
        transform: scale(1.2);
      `;
      
      const label = document.createElement("label");
      label.htmlFor = `export-checkbox-${index}`;
      label.textContent = "Select for export";
      label.style.cssText = `
        font-size: 12px;
        color: #666;
        margin-left: 4px;
      `;

      const checkboxContainer = document.createElement("div");
      checkboxContainer.className = "export-checkbox-container";
      checkboxContainer.style.cssText = `
        margin-top: 8px;
        display: flex;
        align-items: center;
      `;
      checkboxContainer.appendChild(checkbox);
      checkboxContainer.appendChild(label);
      
      item.appendChild(checkboxContainer);
    }

    // Check if this item is selected
    const checkbox = item.querySelector(".linkedin-export-checkbox");
    if (checkbox && checkbox.checked) {
      results.push(data);
    }
  });
  
  return results;
}

// Function to get all search results (for "select all" functionality)
function getAllSearchResultsData() {
  const results = [];
  const searchResultItems = document.querySelectorAll(".reusable-search__result-container");

  searchResultItems.forEach(item => {
    const data = {};
    // Name
    const nameElement = item.querySelector("span.entity-result__title-text a span[aria-hidden='true']");
    data.name = nameElement ? nameElement.innerText.trim() : "";

    // Title
    const titleElement = item.querySelector(".entity-result__primary-subtitle");
    data.title = titleElement ? titleElement.innerText.trim() : "";

    // Company
    const companyElement = item.querySelector(".entity-result__secondary-subtitle");
    data.company = companyElement ? companyElement.innerText.trim() : "";

    // Location
    const locationElement = item.querySelector(".entity-result__summary");
    data.location = locationElement ? locationElement.innerText.trim() : "";

    // Profile URL
    const profileLinkElement = item.querySelector("span.entity-result__title-text a");
    data.profileUrl = profileLinkElement ? profileLinkElement.href : "";

    results.push(data);
  });
  return results;
}

// Function to inject export button on search results page
function injectSearchResultsExportButton() {
  const targetElement = document.querySelector(".reusable-search__entity-result-list"); // Adjust selector

  if (targetElement && !document.getElementById("linkedin-export-selected-button")) {
    // Create container for buttons
    const buttonContainer = document.createElement("div");
    buttonContainer.style.cssText = `
      margin-bottom: 15px;
      padding: 10px;
      background: #f3f6f8;
      border-radius: 8px;
      display: flex;
      gap: 10px;
      align-items: center;
      flex-wrap: wrap;
    `;

    // Select All button
    const selectAllButton = document.createElement("button");
    selectAllButton.id = "linkedin-select-all-button";
    selectAllButton.innerText = "Select All";
    selectAllButton.style.cssText = `
      background-color: #666;
      color: white;
      border: none;
      padding: 6px 12px;
      border-radius: 16px;
      font-size: 14px;
      cursor: pointer;
    `;
    selectAllButton.addEventListener("click", () => {
      const checkboxes = document.querySelectorAll(".linkedin-export-checkbox");
      checkboxes.forEach(cb => cb.checked = true);
      updateExportButtonText();
    });

    // Deselect All button
    const deselectAllButton = document.createElement("button");
    deselectAllButton.id = "linkedin-deselect-all-button";
    deselectAllButton.innerText = "Deselect All";
    deselectAllButton.style.cssText = `
      background-color: #666;
      color: white;
      border: none;
      padding: 6px 12px;
      border-radius: 16px;
      font-size: 14px;
      cursor: pointer;
    `;
    deselectAllButton.addEventListener("click", () => {
      const checkboxes = document.querySelectorAll(".linkedin-export-checkbox");
      checkboxes.forEach(cb => cb.checked = false);
      updateExportButtonText();
    });

    // Export Selected button
    const exportButton = document.createElement("button");
    exportButton.id = "linkedin-export-selected-button";
    exportButton.innerText = "Export Selected (0) (CSV)";
    exportButton.style.cssText = `
      background-color: #0073b1;
      color: white;
      border: none;
      padding: 8px 16px;
      border-radius: 20px;
      font-size: 16px;
      cursor: pointer;
    `;
    exportButton.addEventListener("click", () => {
      if (!canExport()) return;
      
      const selectedProfiles = extractSearchResultsData();
      if (selectedProfiles.length === 0) {
        showNotification("Please select at least one profile to export", "warning");
        return;
      }
      console.log("Extracted Search Results Data:", selectedProfiles);
      chrome.runtime.sendMessage({ type: "EXPORT_SEARCH_RESULTS", payload: selectedProfiles }, (response) => {
        if (response && response.success) {
          // Generate and download CSV directly
          const csvContent = generateCSV(response.data);
          downloadCSV(csvContent, "linkedin_search_results_" + new Date().toISOString().split("T")[0] + ".csv");
          showNotification(`${response.data.length} profiles exported successfully!`, "success");
        } else {
          const errorMsg = response ? response.message : "Export failed";
          console.error("Export error:", errorMsg);
          showNotification(errorMsg, "error");
        }
      });
    });

    buttonContainer.appendChild(selectAllButton);
    buttonContainer.appendChild(deselectAllButton);
    buttonContainer.appendChild(exportButton);
    
    // Prepend to the list or insert at a suitable place
    targetElement.prepend(buttonContainer);

    // Add event listeners to checkboxes to update button text
    const observer = new MutationObserver(() => {
      updateExportButtonText();
    });
    observer.observe(targetElement, { childList: true, subtree: true });

    // Initial update
    setTimeout(updateExportButtonText, 1000);
  }
}

// Function to update export button text with selected count
function updateExportButtonText() {
  const exportButton = document.getElementById("linkedin-export-selected-button");
  if (exportButton) {
    const selectedCount = document.querySelectorAll(".linkedin-export-checkbox:checked").length;
    exportButton.innerText = `Export Selected (${selectedCount}) (CSV)`;
  }
}

// Rate limiting for exports (basic anti-blocking measure)
let lastExportTime = 0;
const EXPORT_COOLDOWN = 2000; // 2 seconds between exports

function canExport() {
  const now = Date.now();
  if (now - lastExportTime < EXPORT_COOLDOWN) {
    const remainingTime = Math.ceil((EXPORT_COOLDOWN - (now - lastExportTime)) / 1000);
    showNotification(`Please wait ${remainingTime} seconds before next export`, "warning");
    return false;
  }
  lastExportTime = now;
  return true;
}




// CSV generation function
function generateCSV(data) {
  if (!Array.isArray(data)) {
    data = [data];
  }

  if (data.length === 0) {
    return "";
  }

  // Get headers from all objects to handle missing fields
  const headers = Array.from(data.reduce((acc, obj) => {
    Object.keys(obj).forEach(key => acc.add(key));
    return acc;
  }, new Set()));

  let csv = headers.join(",") + "\n";

  // Add data rows
  data.forEach(row => {
    const values = headers.map(header => {
      const value = row[header] || "";
      // Escape commas and quotes in CSV
      return '"' + String(value).replace(/"/g, '""') + '"';
    });
    csv += values.join(",") + "\n";
  });

  return csv;
}

// CSV download function
function downloadCSV(csvContent, filename) {
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  
  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", filename);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }
}

// Notification function
function showNotification(message, type = "success") {
  const notification = document.createElement("div");
  notification.className = "linkedin-export-notification";
  notification.textContent = message;
  
  let backgroundColor = "#28a745"; // success
  if (type === "error") backgroundColor = "#dc3545";
  if (type === "warning") backgroundColor = "#ffc107";
  if (type === "info") backgroundColor = "#17a2b8";
  
  notification.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    background: ${backgroundColor};
    color: white;
    padding: 12px 16px;
    border-radius: 6px;
    font-size: 14px;
    font-weight: 600;
    z-index: 10000;
    box-shadow: 0 4px 12px rgba(0,0,0,0.3);
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    max-width: 300px;
    word-wrap: break-word;
  `;
  
  document.body.appendChild(notification);
  
  setTimeout(() => {
    if (document.body.contains(notification)) {
      document.body.removeChild(notification);
    }
  }, 5000);
}

// Conditional export for testing
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    extractProfileData,
    getTextFromSelectors,
    injectProfileExportButton,
    extractSearchResultsData,
    getAllSearchResultsData,
    injectSearchResultsExportButton,
    updateExportButtonText,
    canExport,
    generateCSV,
    downloadCSV,
    showNotification
  };
}

if (typeof window !== 'undefined') {
    window.extractProfileData = extractProfileData;
    window.getTextFromSelectors = getTextFromSelectors;
    window.injectProfileExportButton = injectProfileExportButton;
    window.extractSearchResultsData = extractSearchResultsData;
    window.getAllSearchResultsData = getAllSearchResultsData;
    window.injectSearchResultsExportButton = injectSearchResultsExportButton;
    window.updateExportButtonText = updateExportButtonText;
    window.canExport = canExport;
    window.generateCSV = generateCSV;
    window.downloadCSV = downloadCSV;
    window.showNotification = showNotification;
}
