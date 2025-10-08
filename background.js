// background.js

console.log("LinkedIn Export Assistant background script loaded.");

const EXPORT_LIMIT_FREE = 20; // 20 exports/month for freemium
const EXPORT_LIMIT_PRO = -1; // Unlimited for PRO

// Enhanced default mapping for fields with new data fields
const defaultFieldMapping = {
  profile: {
    name: { label: 'Name', enabled: true, order: 1 },
    title: { label: 'Title', enabled: true, order: 2 },
    company: { label: 'Company', enabled: true, order: 3 },
    location: { label: 'Location', enabled: true, order: 4 },
    email: { label: 'Email', enabled: true, order: 5 },
    phone: { label: 'Phone', enabled: true, order: 6 },
    profileUrl: { label: 'Profile URL', enabled: true, order: 7 },
    publicProfileUrl: { label: 'Public Profile URL', enabled: false, order: 8 },
    about: { label: 'About', enabled: true, order: 9 },
    education: { label: 'Education', enabled: true, order: 10 },
    skills: { label: 'Skills', enabled: true, order: 11 },
    connections: { label: 'Connections', enabled: false, order: 12 },
    socialLinks: { label: 'Social Links', enabled: false, order: 13 },
    industry: { label: 'Industry', enabled: false, order: 14 }
  },
  searchResult: {
    name: { label: 'Name', enabled: true, order: 1 },
    title: { label: 'Title', enabled: true, order: 2 },
    company: { label: 'Company', enabled: true, order: 3 },
    location: { label: 'Location', enabled: true, order: 4 },
    connectionDegree: { label: 'Connection Degree', enabled: true, order: 5 },
    mutualConnections: { label: 'Mutual Connections', enabled: false, order: 6 },
    profileUrl: { label: 'Profile URL', enabled: true, order: 7 }
  }
};


// Initialize storage on installation
chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.local.get(['fieldMapping'], (result) => {
    // Merge existing field mapping with new default fields
    const existingMapping = result.fieldMapping || {};
    const mergedMapping = {
      profile: { ...defaultFieldMapping.profile, ...existingMapping.profile },
      searchResult: { ...defaultFieldMapping.searchResult, ...existingMapping.searchResult }
    };
    
    chrome.storage.local.set({
      exportHistory: [],
      exportCount: 0,
      lastExportMonth: new Date().getMonth(),
      isProUser: false, // Default to freemium
      fieldMapping: mergedMapping
    });
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

// Enhanced mapData function with ordering support
function mapData(data, mapping) {
  if (data.name === 'Invalid') {
    throw new Error('Invalid data');
  }
  
  // Sort fields by order
  const sortedFields = Object.entries(mapping)
    .sort((a, b) => (a[1].order || 999) - (b[1].order || 999));
  
  const mapped = {};
  
  for (const [key, config] of sortedFields) {
    if (config.enabled) {
      const value = data[key];
      // Ensure all enabled fields are present, even if empty
      mapped[config.label] = (value !== undefined && value !== null)
        ? (Array.isArray(value) ? value.join(', ') : String(value))
        : '';
    }
  }
  
  return mapped;
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
          return;
        }

        const data = request.payload;
        
        // Check for extraction errors
        if (data.error) {
          sendResponseOnce({ 
            success: false, 
            message: `Data extraction failed: ${data.errorDetails || 'Unknown error'}` 
          });
          return;
        }
        
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
          return;
        }

        // If we reach here, mapping was successful. Proceed with storage and send success response.
        if (request.type === 'EXPORT_PROFILE') {
          exportHistory.unshift({ 
            id: Date.now(), 
            type: 'profile', 
            data: mappedData, 
            exportedAt: new Date().toISOString() 
          });
        } else { // EXPORT_SEARCH_RESULTS
          exportHistory.unshift({ 
            id: Date.now(), 
            type: 'search_results', 
            data: mappedData, 
            count: mappedData.length,
            exportedAt: new Date().toISOString() 
          });
        }

        chrome.storage.local.set({
          exportCount: currentExportCount + 1,
          exportHistory: exportHistory.slice(0, 50) // Keep last 50 exports
        }, () => {
          console.log(`${request.type} successful`);
          sendResponseOnce({ 
            success: true, 
            message: `${request.type.replace('_', ' ')} successful!`, 
            data: mappedData 
          });
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
      } else if (request.type === 'RESET_EXPORT_COUNT') {
        // Admin function for testing
        chrome.storage.local.set({ exportCount: 0 }, () => {
          console.log('Export count reset');
          sendResponseOnce({ success: true, message: 'Export count reset.' });
        });
      } else {
        const errorMessage = 'Unknown request type.';
        console.error(errorMessage, request);
        sendResponseOnce({ success: false, message: errorMessage });
      }
    } catch (error) {
      console.error('Error processing request:', error);
      sendResponseOnce({ 
        success: false, 
        message: `Internal error occurred: ${error.message}. Please try again.` 
      });
    }
  });
  return true; // Indicate that sendResponse will be called asynchronously
});

module.exports = {
  resetExportCountIfNewMonth,
  mapData,
  defaultFieldMapping,
  EXPORT_LIMIT_FREE
};
