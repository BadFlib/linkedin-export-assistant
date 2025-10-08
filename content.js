
// Helper function to get text from multiple selectors
function getTextFromSelectors(selectors) {
  for (const selector of selectors) {
    const element = document.querySelector(selector);
    if (element && element.textContent && element.textContent.trim() !== ".") {
      return element.textContent.trim().replace(/\s\s+/g, " ");
    }
  }
  return "";
}

// Helper function to get href from multiple selectors
function getHrefFromSelectors(selectors) {
  for (const selector of selectors) {
    const element = document.querySelector(selector);
    if (element && element.href) {
      return element.href.trim();
    }
  }
  return "";
}

// Helper function to get all text content from a list of selectors
function getAllTextFromSelectors(selectors) {
  let allText = [];
  for (const selector of selectors) {
    const elements = document.querySelectorAll(selector);
    elements.forEach(element => {
      if (element && element.textContent && element.textContent.trim() !== ".") {
        allText.push(element.textContent.trim().replace(/\s\s+/g, " "));
      }
    });
  }
  return allText.join(", ");
}

// Function to extract profile data
function extractProfileData() {
  const profileData = {};
  const errors = [];

  const fields = {
    name: [".pv-text-details__left-panel h1", ".text-heading-xlarge"],
    title: [".pv-text-details__left-panel .text-body-medium", ".text-body-medium.break-words"],
    company: [".pv-text-details__left-panel .inline-block.font-size-entitle.v-align-middle.break-words", ".pv-text-details__left-panel .text-body-small.inline.t-black--light.break-words", ".pv-text-details__left-panel .text-body-small.inline.t-black--light.break-words a"],
    location: [".pv-text-details__left-panel .text-body-small.inline.t-black--light.break-words", ".pv-text-details__left-panel .text-body-small.inline.t-black--light.break-words span:first-child"],
    profileUrl: ["a.pv-top-card-v2-section__info-action-item"],
    email: [".pv-contact-info__contact-type.contact-info-form__contact-type-email a"],
    about: [".pv-about-section .pv-shared-text-with-see-more__text", ".pv-about-section .lt-line-clamp__line"],
    education: [".education__item-school-name", "#education-section .pvs-entity__path-node"],
    skills: [".pv-skill-category-entity__name-text", "#skills-section .pvs-entity__path-node"],
    connections: [".pv-top-card--list-bullet .t-black--light", ".pv-top-card--list-bullet .text-body-small"],
    publicProfileUrl: [".pv-top-card-v2-section__info-action-item[data-control-name=\"contact_see_more\"]"],
    phone: [".pv-contact-info__contact-type.contact-info-form__contact-type-phone a"],
    socialLinks: [".pv-contact-info__contact-type.contact-info-form__contact-type-web a"],
    industry: [".pv-top-card__industry-list-item"],
  };

  for (const field in fields) {
    let value;
    if (field === "profileUrl") {
      value = window.location.href;
    } else if (field === "email" || field === "phone" || field === "socialLinks") {
      value = getHrefFromSelectors(fields[field]);
    } else if (field === "skills" || field === "education") {
      value = getAllTextFromSelectors(fields[field]);
    } else {
      value = getTextFromSelectors(fields[field]);
    }

    if (field === "company") {
      // Special handling for company to extract only the company name
      const companyText = getTextFromSelectors(fields[field]);
      const companyMatch = companyText.match(/^(.*?)(?: at | \(.*?\))?$/);
      profileData[field] = companyMatch ? companyMatch[1].trim() : companyText.trim();
    } else {
      profileData[field] = value;
    }

    if (!profileData[field] && field !== "profileUrl") {
      errors.push(field);
    }
  }

  if (errors.length > 0) {
    // If critical fields are missing, return an.error object
    if (errors.includes("name") || errors.includes("title")) {
      return { error: "Failed to extract critical profile data.", errorType: "parsing_error", errorDetails: errors };
    }
  }

  return profileData;
}

// Function to extract search results data
function extractSearchResultsData() {
  const searchResults = [];
  const resultContainers = document.querySelectorAll(".reusable-search__result-container");

  resultContainers.forEach(container => {
    const checkbox = container.querySelector(".linkedin-export-checkbox");
    if (checkbox && !checkbox.checked) {
      return; // Skip if checkbox is not checked
    }

    const name = getTextFromSelectors([".entity-result__title-text span[aria-hidden=\"true\"]", ".actor-name"]);
    const title = getTextFromSelectors([".entity-result__primary-subtitle", ".search-result__truncate.t-14.t-black--light.full-width"]);
    const company = getTextFromSelectors([".entity-result__secondary-subtitle", ".search-result__truncate.t-14.t-black--light.full-width"]);
    const location = getTextFromSelectors([".entity-result__summary .entity-result__location", ".search-result__truncate.t-14.t-black--light.full-width"]);
    const profileUrl = getHrefFromSelectors([".app-aware-link[data-control-name=\"entity_result_profile_view\"]", ".search-result__result-link"]);
    const connectionDegree = getTextFromSelectors([".entity-result__badge-text"]);
    const mutualConnections = getTextFromSelectors([".entity-result__simple-insight-text"]);

    searchResults.push({
      name,
      title,
      company,
      location,
      connectionDegree,
      mutualConnections,
      profileUrl
    });
  });

  return searchResults;
}

// Function to generate CSV content
function generateCSV(data, type) {
  if (!data || data.length === 0) {
    return "";
  }

  let headers;
  if (type === "profile") {
    headers = Object.keys(data);
  } else if (type === "searchResults") {
    headers = Object.keys(data[0]);
  } else {
    return "";
  }

  const csvRows = [];
  csvRows.push(headers.map(header => `"${header.replace(/"/g, "\"\"")}"`).join(","));

  if (type === "profile") {
    const values = headers.map(header => {
      const value = data[header] || "";
      return `"${String(value).replace(/"/g, "\"\"")}"`;
    });
    csvRows.push(values.join(","));
  } else if (type === "searchResults") {
    data.forEach(row => {
      const values = headers.map(header => {
        const value = row[header] || "";
        return `"${String(value).replace(/"/g, "\"\"")}"`;
      });
      csvRows.push(values.join(","));
    });
  }

  return csvRows.join("\n");
}

// Function to download CSV
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
  } else {
    showNotification("Your browser does not support downloading files directly.", "error");
  }
}

// Function to show notifications
function showNotification(message, type = "info") {
  // Remove any existing notifications
  const existingNotification = document.querySelector(".linkedin-export-notification");
  if (existingNotification) {
    existingNotification.remove();
  }

  const notification = document.createElement("div");
  notification.className = `linkedin-export-notification linkedin-export-notification--${type}`;
  notification.textContent = message;

  let icon = "";
  if (type === "success") {
    icon = "✔";
  } else if (type === "error") {
    icon = "✖";
  } else if (type === "warning") {
    icon = "⚠";
  }
  notification.innerHTML = `<span>${icon}</span> ${message}`;

  Object.assign(notification.style, {
    position: "fixed",
    bottom: "20px",
    right: "20px",
    backgroundColor: type === "success" ? "#4CAF50" : type === "error" ? "#f44336" : type === "warning" ? "#ff9800" : "#555",
    color: "white",
    padding: "10px 20px",
    borderRadius: "5px",
    zIndex: "10000",
    opacity: "1", // Set opacity to 1 immediately for testing
    transform: "translateY(0)", // Set transform to 0 immediately for testing
    boxShadow: "0 4px 8px rgba(0, 0, 0, 0.2)",
    display: "flex",
    alignItems: "center",
    gap: "10px",
  });

  // Ensure document.body exists before appending
  if (document.body) {
    console.log("showNotification: document.body is available. Appending notification.");
    document.body.appendChild(notification);
    console.log("showNotification: Notification appended. document.body.innerHTML:", document.body.innerHTML);
  } else {
    console.error("Document body not available to show notification.");
  }
}

// Cooldown mechanism to prevent excessive exports
let exportCooldown = false;
function canExport() {
  if (exportCooldown) {
    return false;
  }
  exportCooldown = true;
  setTimeout(() => {
    exportCooldown = false;
  }, 3000); // 3 seconds cooldown
  return true;
}

// Function to inject export button on profile pages
function injectProfileExportButton() {
  const targetElement = document.querySelector(".pv-top-card-v2-ctas__primary-button");
  if (!targetElement || document.getElementById("linkedin-export-button")) {
    return;
  }

  const exportButton = document.createElement("button");
  exportButton.id = "linkedin-export-button";
  exportButton.className = "artdeco-button artdeco-button--2 artdeco-button--secondary ember-view";
  exportButton.textContent = "Export Profile (CSV)";
  Object.assign(exportButton.style, {
    marginLeft: "8px",
    // Add any other specific styles to match LinkedIn\"s buttons
  });

  exportButton.addEventListener("click", async () => {
    if (!canExport()) {
      showNotification("Please wait a moment before exporting again.", "warning");
      return;
    }

    exportButton.disabled = true;
    const originalText = exportButton.textContent;
    exportButton.textContent = "Extracting...";

    const profileData = extractProfileData();

    if (profileData.error) {
      showNotification(`Export failed: ${profileData.error}. Details: ${profileData.errorDetails.join(", ")}`, "error");
      exportButton.textContent = originalText;
      exportButton.disabled = false;
      return;
    }

    chrome.runtime.sendMessage({ type: "EXPORT_PROFILE", payload: profileData }, response => {
      if (response.success) {
        showNotification("Profile data ready for preview. Check the extension popup!", "success");
      } else {
        showNotification(response.message || "Failed to export profile data.", "error");
      }
      exportButton.textContent = originalText;
      exportButton.disabled = false;
    });
  });

  targetElement.parentNode.insertBefore(exportButton, targetElement.nextSibling);
}

// Function to update the text of the export selected button
function updateExportButtonText() {
  const selectedCheckboxes = document.querySelectorAll(".linkedin-export-checkbox:checked");
  const exportSelectedButton = document.getElementById("linkedin-export-selected-button");
  if (exportSelectedButton) {
    exportSelectedButton.textContent = `Export Selected (${selectedCheckboxes.length})`;
  }
}

// Function to inject export buttons on search results pages
function injectSearchResultsExportButton() {
  const targetElement = document.querySelector(".reusable-search__entity-result-list");
  if (!targetElement || document.getElementById("linkedin-export-selected-button")) {
    return;
  }

  // Create a container for the new buttons
  const buttonContainer = document.createElement("div");
  buttonContainer.id = "linkedin-export-search-buttons";
  Object.assign(buttonContainer.style, {
    display: "flex",
    justifyContent: "flex-end",
    gap: "10px",
    marginBottom: "10px",
    padding: "10px",
    borderBottom: "1px solid #e0e0e0",
    backgroundColor: "#fff",
    position: "sticky",
    top: "0",
    zIndex: "9999",
  });

  // Select All Button
  const selectAllButton = document.createElement("button");
  selectAllButton.id = "linkedin-select-all-button";
  selectAllButton.className = "artdeco-button artdeco-button--2 artdeco-button--secondary ember-view";
  selectAllButton.textContent = "Select All";
  selectAllButton.addEventListener("click", () => {
    document.querySelectorAll(".linkedin-export-checkbox").forEach(checkbox => {
      checkbox.checked = true;
    });
    updateExportButtonText();
  });
  buttonContainer.appendChild(selectAllButton);

  // Deselect All Button
  const deselectAllButton = document.createElement("button");
  deselectAllButton.id = "linkedin-deselect-all-button";
  deselectAllButton.className = "artdeco-button artdeco-button--2 artdeco-button--secondary ember-view";
  deselectAllButton.textContent = "Deselect All";
  deselectAllButton.addEventListener("click", () => {
    document.querySelectorAll(".linkedin-export-checkbox").forEach(checkbox => {
      checkbox.checked = false;
    });
    updateExportButtonText();
  });
  buttonContainer.appendChild(deselectAllButton);

  // Export Selected Button
  const exportSelectedButton = document.createElement("button");
  exportSelectedButton.id = "linkedin-export-selected-button";
  exportSelectedButton.className = "artdeco-button artdeco-button--2 artdeco-button--primary ember-view";
  exportSelectedButton.textContent = "Export Selected (0)";
  exportSelectedButton.addEventListener("click", async () => {
    if (!canExport()) {
      showNotification("Please wait a moment before exporting again.", "warning");
      return;
    }

    const selectedResults = extractSearchResultsData();
    if (selectedResults.length === 0) {
      showNotification("No profiles selected for export.", "warning");
      return;
    }

    exportSelectedButton.disabled = true;
    const originalText = exportSelectedButton.textContent;
    exportSelectedButton.textContent = "Extracting...";

    chrome.runtime.sendMessage({ type: "EXPORT_SEARCH_RESULTS", payload: selectedResults }, response => {
      if (response.success) {
        showNotification(`${selectedResults.length} profiles ready for preview.`, "success");
      } else {
        showNotification(response.message || "Failed to export search results.", "error");
      }
      exportSelectedButton.textContent = originalText;
      exportSelectedButton.disabled = false;
    });
  });
  buttonContainer.appendChild(exportSelectedButton);

  // Insert the button container at the top of the search results list
  targetElement.parentNode.insertBefore(buttonContainer, targetElement);

  // Inject checkboxes into each search result item
  const resultContainers = document.querySelectorAll(".reusable-search__entity-result-container");
  resultContainers.forEach((container, index) => {
    if (!container.querySelector(".linkedin-export-checkbox")) {
      const checkboxContainer = document.createElement("div");
      checkboxContainer.className = "export-checkbox-container";
      Object.assign(checkboxContainer.style, {
        position: "absolute",
        top: "10px",
        left: "10px",
        zIndex: "100",
      });
      const checkbox = document.createElement("input");
      checkbox.type = "checkbox";
      checkbox.className = "linkedin-export-checkbox";
      checkbox.id = `export-checkbox-${index}`;
      checkbox.addEventListener("change", updateExportButtonText);
      checkboxContainer.appendChild(checkbox);
      container.style.position = "relative"; // Ensure position for absolute checkbox
      container.appendChild(checkboxContainer);
    }
  });

  // Initial update of button text
  updateExportButtonText();
}

// Main function to run on page load
function main() {
  // Ensure document.body is available before observing
  if (document.body) {

    const observer = new MutationObserver(mutations => {
      mutations.forEach(mutation => {
        if (mutation.type === "childList" && mutation.addedNodes.length > 0) {
          // Check if we are on a profile page
          if (window.location.pathname.startsWith("/in/")) {
            injectProfileExportButton();
          } else if (window.location.pathname.startsWith("/search/results/people/")) {
            injectSearchResultsExportButton();
          }
        }
      });
    });

    observer.observe(document.body, { childList: true, subtree: true });

    // Initial check in case the elements are already present on page load
    if (window.location.pathname.startsWith("/in/")) {
      injectProfileExportButton();
    } else if (window.location.pathname.startsWith("/search/results/people/")) {
      injectSearchResultsExportButton();
    }
  } else {
    console.error("Document body not available for MutationObserver.");
  }
}

// Export functions for testing purposes
if (typeof module !== "undefined" && module.exports) {
  module.exports = {
    getTextFromSelectors,
    getHrefFromSelectors,
    getAllTextFromSelectors,
    extractProfileData,
    extractSearchResultsData,
    generateCSV,
    downloadCSV,
    showNotification,
    canExport,
    injectProfileExportButton,
    updateExportButtonText,
    injectSearchResultsExportButton,
    main,
  };
}

// Call main function if not in a test environment
// This will be handled by the test setup in JSDOM
if (typeof window !== "undefined" && !window.jest) {
  main();
}

