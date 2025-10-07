// popup.js

console.log("LinkedIn Export Assistant popup script loaded.");

document.addEventListener("DOMContentLoaded", function() {
  loadStatus();
  loadExportHistory();
  loadFieldMapping(); // Load mapping on startup
  
  // Event listeners
  document.getElementById("save-mapping").addEventListener("click", saveFieldMapping);
  document.getElementById("export-csv").addEventListener("click", exportToCSV);
  document.getElementById("cancel-preview").addEventListener("click", hidePreview);
  document.getElementById("upgrade-btn").addEventListener("click", upgradeToProPlaceholder);
  document.getElementById("export-google-sheets").addEventListener("click", exportToGoogleSheetsPlaceholder);
  document.getElementById("bulk-export").addEventListener("click", bulkExportPlaceholder);
});

function loadStatus() {
  chrome.runtime.sendMessage({ type: "GET_STATUS" }, (response) => {
    if (response) {
      updateStatusDisplay(response);
    }
  });
}

function updateStatusDisplay(status) {
  const exportCountEl = document.getElementById("export-count");
  const exportLimitEl = document.getElementById("export-limit");
  const progressFillEl = document.getElementById("progress-fill");
  const proStatusEl = document.getElementById("pro-status");
  const upgradeSection = document.getElementById("upgrade-section");
  const proFeaturesSection = document.getElementById("pro-features-section");

  exportCountEl.textContent = status.exportCount;
  
  if (status.isProUser) {
    exportLimitEl.textContent = "∞";
    progressFillEl.style.width = "100%";
    progressFillEl.style.backgroundColor = "#28a745";
    proStatusEl.classList.remove("hidden");
    upgradeSection.classList.add("hidden");
    proFeaturesSection.classList.add("hidden");
    
    // Enable PRO features
    document.getElementById("export-google-sheets").disabled = false;
    document.getElementById("bulk-export").disabled = false;
    document.getElementById("export-google-sheets").innerText = "Export to Google Sheets";
    document.getElementById("bulk-export").innerText = "Bulk Export Templates";
  } else {
    exportLimitEl.textContent = status.exportLimit;
    const progressPercent = (status.exportCount / status.exportLimit) * 100;
    progressFillEl.style.width = progressPercent + "%";
    proFeaturesSection.classList.remove("hidden");
    
    if (progressPercent >= 100) {
      progressFillEl.style.backgroundColor = "#dc3545";
      upgradeSection.classList.remove("hidden");
    } else if (progressPercent >= 80) {
      progressFillEl.style.backgroundColor = "#ffc107";
    } else {
      progressFillEl.style.backgroundColor = "#28a745";
    }
  }
}

function loadExportHistory() {
  chrome.runtime.sendMessage({ type: "GET_STATUS" }, (response) => {
    if (response && response.exportHistory) {
      displayExportHistory(response.exportHistory);
    }
  });
}

function displayExportHistory(history) {
  const historyContainer = document.getElementById("export-history");
  historyContainer.innerHTML = "";

  if (history.length === 0) {
    historyContainer.innerHTML = "<p class=\"no-history\">No exports yet.</p>";
    return;
  }

  history.slice(0, 10).forEach(item => {
    const historyItem = document.createElement("div");
    historyItem.className = "history-item";
    
    const date = new Date(item.exportedAt).toLocaleDateString();
    const time = new Date(item.exportedAt).toLocaleTimeString();
    const type = item.type === "profile" ? "Profile" : "Search Results";
    const count = Array.isArray(item.data) ? item.data.length : 1;
    
    historyItem.innerHTML = `
      <div class=\"history-info\">
        <span class=\"history-type\">${type}</span>
        <span class=\"history-count\">${count} record(s)</span>
      </div>
      <div class=\"history-date\">${date} ${time}</div>
    `;
    
    historyContainer.appendChild(historyItem);
  });
}

function loadFieldMapping() {
  chrome.runtime.sendMessage({ type: "GET_STATUS" }, (response) => {
    if (response && response.fieldMapping) {
      const mapping = response.fieldMapping;
      // Set checkbox states based on loaded mapping
      const fields = ["name", "title", "company", "location", "profile-url", "links", "about", "email"];
      fields.forEach(field => {
        const checkbox = document.getElementById(`map-${field}`);
        if (checkbox) {
          const key = field.replace("-", "");
          checkbox.checked = !!(mapping.profile[key] || mapping.searchResult[key]);
        }
      });
    }
  });
}

function saveFieldMapping() {
  const mapping = {
    profile: {},
    searchResult: {}
  };

  // Get checkbox states and build mapping
  const fields = ["name", "title", "company", "location", "profile-url", "links", "about", "email"];
  fields.forEach(field => {
    const checkbox = document.getElementById(`map-${field}`);
    if (checkbox && checkbox.checked) {
      const key = field.replace("-", "");
      let displayName = field.charAt(0).toUpperCase() + field.slice(1).replace("-", " ");
      if (key === "profileurl") displayName = "Profile URL";
      if (key === "about") displayName = "About";
      if (key === "email") displayName = "Email";

      mapping.profile[key] = displayName;
      mapping.searchResult[key] = displayName;
    }
  });

  chrome.runtime.sendMessage({ 
    type: "UPDATE_FIELD_MAPPING", 
    payload: mapping 
  }, (response) => {
    if (response && response.success) {
      showNotification("Field mapping saved successfully!");
      loadStatus(); // Refresh status to show updated mapping if needed
    }
  });
}

function showPreview(data) {
  const previewSection = document.getElementById("preview-section");
  const previewData = document.getElementById("preview-data");
  
  previewSection.classList.remove("hidden");
  
  // Display detailed preview data
  if (Array.isArray(data)) {
    let previewHTML = `<h4>Ready to export ${data.length} records:</h4>`;
    data.slice(0, 3).forEach((item, index) => {
      previewHTML += `<div class="preview-item">
        <strong>Record ${index + 1}:</strong><br>
        ${Object.entries(item).map(([key, value]) => `<span class="preview-field">${key}: ${value || 'N/A'}</span>`).join('<br>')}
      </div>`;
    });
    if (data.length > 3) {
      previewHTML += `<p>... and ${data.length - 3} more records</p>`;
    }
    previewData.innerHTML = previewHTML;
  } else {
    let previewHTML = `<h4>Profile Data Preview:</h4>`;
    previewHTML += `<div class="preview-item">
      ${Object.entries(data).map(([key, value]) => `<span class="preview-field"><strong>${key}:</strong> ${value || 'N/A'}</span>`).join('<br>')}
    </div>`;
    previewData.innerHTML = previewHTML;
  }
  
  // Store data for export
  window.previewData = data;
}

function hidePreview() {
  document.getElementById("preview-section").classList.add("hidden");
  window.previewData = null;
}

function exportToCSV() {
  if (!window.previewData) {
    showNotification("No data to export");
    return;
  }

  const csvContent = generateCSV(window.previewData);
  downloadCSV(csvContent, "linkedin_export_" + new Date().toISOString().split("T")[0] + ".csv");
  
  hidePreview();
  showNotification("CSV exported successfully!");
  loadStatus(); // Refresh status after export
}

function generateCSV(data) {
  if (!Array.isArray(data)) {
    data = [data];
  }

  if (data.length === 0) {
    return "";
  }

  // Get headers from first object
  const headers = Object.keys(data[0]);
  let csv = headers.join(",") + "\n";

  // Add data rows
  data.forEach(row => {
    const values = headers.map(header => {
      const value = row[header] || "";
      // Escape commas and quotes in CSV
      return "\"" + String(value).replace(/"/g, """") + "\"";
    });
    csv += values.join(",") + "\n";
  });

  return csv;
}

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

function upgradeToProPlaceholder() {
  // Placeholder for PRO upgrade functionality
  const upgradeMessage = `
Upgrade to LinkedIn Export Assistant PRO

🚀 Unlimited Exports
📊 Google Sheets Integration  
🎯 Advanced Filtering
📋 Export Templates
⚡ Priority Support

Price: $9.99/month

In a real implementation, this would redirect to:
- Stripe payment page
- License key activation
- Account management portal

Click OK to simulate successful upgrade (for demo purposes).
  `;
  
  if (confirm(upgradeMessage)) {
    // Simulate upgrade for demo
    chrome.storage.local.set({ isProUser: true }, () => {
      showNotification("Successfully upgraded to PRO! Refresh the popup to see new features.");
      loadStatus(); // Refresh status
    });
  }
}

function showNotification(message) {
  // Simple notification - could be enhanced with better UI
  const notification = document.createElement("div");
  notification.className = "notification";
  notification.textContent = message;
  notification.style.cssText = `
    position: fixed;
    top: 10px;
    right: 10px;
    background: #28a745;
    color: white;
    padding: 10px;
    border-radius: 4px;
    z-index: 1000;
  `;
  
  document.body.appendChild(notification);
  
  setTimeout(() => {
    if (document.body.contains(notification)) {
      document.body.removeChild(notification);
    }
  }, 3000);
}

// Listen for messages from content script (for preview functionality)
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.type === "SHOW_PREVIEW") {
    showPreview(request.payload);
  }
});



function exportToGoogleSheetsPlaceholder() {
  // Placeholder for Google Sheets export functionality
  alert("Google Sheets Export (PRO Feature)\n\nThis feature allows you to export LinkedIn data directly to Google Sheets.\n\nIn the full version, this would:\n- Authenticate with Google Sheets API\n- Create or update spreadsheets\n- Apply custom formatting\n- Set up automatic syncing\n\nUpgrade to PRO to unlock this feature!");
}

function bulkExportPlaceholder() {
  // Placeholder for bulk export templates functionality
  alert("Bulk Export Templates (PRO Feature)\n\nThis feature allows you to save and reuse export templates for different scenarios.\n\nIn the full version, this would:\n- Save custom field mappings as templates\n- Create templates for different industries/roles\n- Batch export multiple search results\n- Schedule automatic exports\n\nUpgrade to PRO to unlock this feature!");
}

function upgradeToProPlaceholder() {
  // Placeholder for PRO upgrade functionality
  const upgradeMessage = `
Upgrade to LinkedIn Export Assistant PRO

🚀 Unlimited Exports
📊 Google Sheets Integration  
🎯 Advanced Filtering
📋 Export Templates
⚡ Priority Support

Price: $9.99/month

In a real implementation, this would redirect to:
- Stripe payment page
- License key activation
- Account management portal

Click OK to simulate successful upgrade (for demo purposes).
  `;
  
  if (confirm(upgradeMessage)) {
    // Simulate upgrade for demo
    chrome.storage.local.set({ isProUser: true }, () => {
      showNotification("Successfully upgraded to PRO! Refresh the popup to see new features.");
      loadStatus(); // Refresh status
    });
  }
}

