// background.js

console.log("LinkedIn Export Assistant background script loaded.");

const EXPORT_LIMIT_FREE = 20; // 20 exports/month for freemium
const EXPORT_LIMIT_PRO = -1; // Unlimited for PRO

// Default mapping for fields
const defaultFieldMapping = {
  profile: {
    name: { label: 'Name', enabled: true },
    title: { label: 'Title', enabled: true },
    company: { label: 'Company', enabled: true },
    location: { label: 'Location', enabled: true },
    profileUrl: { label: 'Profile URL', enabled: true },
    links: { label: 'Links', enabled: true },
    email: { label: 'Email', enabled: true },
    about: { label: 'About', enabled: true }
  },
  searchResult: {
    name: { label: 'Name', enabled: true },
    title: { label: 'Title', enabled: true },
    company: { label: 'Company', enabled: true },
    location: { label: 'Location', enabled: true },
    profileUrl: { label: 'Profile URL', enabled: true }
  }
};


// Initialize storage on installation
chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.local.set({
    exportHistory: [],
    exportCount: 0,
    lastExportMonth: new Date().getMonth(),
    isProUser: false, // Default to freemium
    fieldMapping: defaultFieldMapping
  });
});

// Reset export count monthly
function resetExportCountIfNewMonth(currentMonth) {
  chrome.storage.local.get(["lastExportMonth", "exportCount"], (result) => {
    if (result.lastExportMonth !== currentMonth) {
      chrome.storage.local.set({
        exportCount: 0,
        lastExportMonth: currentMonth
      });
    }
  });
}

// Handle messages from content scripts
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  const currentMonth = new Date().getMonth();
  resetExportCountIfNewMonth(currentMonth);

  chrome.storage.local.get(["exportCount", "isProUser", "exportHistory", "fieldMapping"], (result) => {
    const currentExportCount = result.exportCount || 0;
    const isProUser = result.isProUser || false;
    const exportHistory = result.exportHistory || [];
    const fieldMapping = result.fieldMapping || defaultFieldMapping;

    let exportAllowed = false;
    if (isProUser) {
      exportAllowed = true;
    } else if (currentExportCount < EXPORT_LIMIT_FREE) {
      exportAllowed = true;
    }

    // Use a flag to track if sendResponse has been called
    let responseSent = false;
    const sendResponseOnce = (response) => {
      if (!responseSent) {
        sendResponse(response);
        responseSent = true;
      }
    };

    try {
      if (request.type === 'EXPORT_PROFILE' || request.type === 'EXPORT_SEARCH_RESULTS') {
        if (!exportAllowed) {
          const limitMessage = `Export limit reached (${currentExportCount}/${EXPORT_LIMIT_FREE}). Upgrade to PRO for unlimited exports.`;
          console.warn(limitMessage);
          sendResponseOnce({ success: false, message: limitMessage });
          return; // Exit here if not allowed to export
        }

        const data = request.payload;
        let mappedData;
        try {
          if (request.type === 'EXPORT_PROFILE') {
            mappedData = mapData(data, fieldMapping.profile);
          } else { // EXPORT_SEARCH_RESULTS
            mappedData = data.map(item => mapData(item, fieldMapping.searchResult));
          }
        } catch (mapError) {
          console.error('Error mapping data:', mapError);
          sendResponseOnce({ success: false, message: 'Error mapping data. Please check your field settings.' });
          return; // Exit here if mapping fails
        }

        // If we reach here, mapping was successful. Proceed with storage and send success response.
        if (request.type === 'EXPORT_PROFILE') {
          exportHistory.unshift({ id: Date.now(), type: 'profile', data: mappedData, exportedAt: new Date().toISOString() });
        } else { // EXPORT_SEARCH_RESULTS
          exportHistory.unshift({ id: Date.now(), type: 'search_results', data: mappedData, exportedAt: new Date().toISOString() });
        }

        chrome.storage.local.set({
          exportCount: currentExportCount + 1,
          exportHistory: exportHistory.slice(0, 50) // Keep last 50 exports
        }, () => {
          console.log(`${request.type} successful`);
          sendResponseOnce({ success: true, message: `${request.type.replace('_', ' ')} successful!`, data: mappedData });
        });
      } else if (request.type === 'GET_STATUS') {
        sendResponseOnce({ 
          exportCount: currentExportCount,
          exportLimit: isProUser ? EXPORT_LIMIT_PRO : EXPORT_LIMIT_FREE,
          isProUser: isProUser,
          exportHistory: exportHistory,
          fieldMapping: fieldMapping
        });
      } else if (request.type === 'UPDATE_FIELD_MAPPING') {
        chrome.storage.local.set({ fieldMapping: request.payload }, () => {
          console.log('Field mapping updated');
          sendResponseOnce({ success: true, message: 'Field mapping updated.' });
        });
      } else {
        const errorMessage = 'Unknown request type.';
        console.error(errorMessage, request);
        sendResponseOnce({ success: false, message: errorMessage });
      }
    } catch (error) {
      console.error('Error processing request:', error);
      sendResponseOnce({ success: false, message: 'Internal error occurred. Please try again.' });
    }
  });
  return true; // Indicate that sendResponse will be called asynchronously
});

function mapData(data, mapping) {
  if (data.name === 'Invalid') {
    throw new Error('Invalid data');
  }
  const mapped = {};
  for (const key in mapping) {
    if (mapping[key].enabled) { // Check if field is enabled
      const value = data[key];
      // Ensure all enabled fields are present, even if empty
      mapped[mapping[key].label] = (value !== undefined && value !== null) ? (Array.isArray(value) ? value.join(', ') : String(value)) : '';
    }
  }
  return mapped;
}

module.exports = {
  resetExportCountIfNewMonth,
  mapData,
  defaultFieldMapping,
  EXPORT_LIMIT_FREE
};

