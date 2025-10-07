# LinkedIn Export Assistant - Manual Testing Guide

This guide outlines the manual testing procedures for the LinkedIn Export Assistant Chrome extension. The goal is to ensure all functionalities are working as expected, the UI/UX is intuitive, and the extension is ready for real-world deployment.

## 1. Installation and Basic Setup

1.  **Install the Extension:**
    *   Open Chrome and navigate to `chrome://extensions`.
    *   Enable "Developer mode" (top right corner).
    *   Click "Load unpacked" and select the `/home/ubuntu/linkedin-export-assistant` directory.
    *   Verify the extension icon appears in the Chrome toolbar.

2.  **Initial Storage Check:**
    *   Right-click the extension icon and select "Inspect popup" (or similar).
    *   Go to the "Application" tab, then "Local Storage" or "IndexedDB" (depending on implementation).
    *   Verify that `exportHistory`, `exportCount`, `lastExportMonth`, `isProUser`, and `fieldMapping` are initialized correctly.

## 2. Profile Export Functionality

**Objective:** Test the ability to extract and export data from individual LinkedIn profile pages.

1.  **Navigate to a LinkedIn Profile:**
    *   Open a new tab and go to any public LinkedIn profile page (e.g., your own or a public figure).
    *   **UI/UX Check:** Observe if the "Export Profile (CSV)" button appears on the profile page. It should be clearly visible and not obstruct other elements.

2.  **Perform a Profile Export (Freemium):**
    *   Click the "Export Profile (CSV)" button.
    *   **Expected Result:** A notification should appear (e.g., "Profile data ready for preview. Check the extension popup!"). The extension popup should open automatically or be accessible, displaying a preview of the extracted data.
    *   **Data Verification:** In the popup preview, verify that `Name`, `Title`, `Company`, `Location`, `Profile URL`, `Links`, `Email`, and `About` fields are correctly extracted and displayed.
    *   Click "Export to CSV" in the popup.
    *   **Expected Result:** A CSV file named `linkedin_export_YYYY-MM-DD.csv` should be downloaded. Open the CSV and verify its content matches the preview.
    *   **Freemium Limit Check:** Open the extension popup again. Verify that the `Export Count` has increased by 1.

3.  **Test Export Cooldown:**
    *   Immediately attempt another profile export.
    *   **Expected Result:** A warning notification should appear (e.g., "Please wait X seconds before next export"). The export should be blocked until the cooldown period (2 seconds) has passed.

4.  **Test Missing Data:**
    *   Find a profile with incomplete information (e.g., no 'About' section, no email).
    *   Perform an export.
    *   **Expected Result:** The CSV should contain empty fields for missing data, not errors.

## 3. Search Results Export Functionality

**Objective:** Test the ability to extract and export data from LinkedIn search results pages.

1.  **Navigate to LinkedIn People Search Results:**
    *   Perform a search for people on LinkedIn (e.g., "Software Engineer").
    *   **UI/UX Check:** Observe if "Select All", "Deselect All", and "Export Selected (0) (CSV)" buttons appear at the top of the search results list. Checkboxes should be present next to each search result item.

2.  **Select and Export Specific Results:**
    *   Manually check a few checkboxes next to different search results.
    *   **Expected Result:** The "Export Selected (X) (CSV)" button text should update to reflect the number of selected items.
    *   Click the "Export Selected (X) (CSV)" button.
    *   **Expected Result:** A CSV file named `linkedin_search_results_YYYY-MM-DD.csv` should be downloaded. Open the CSV and verify its content matches the selected profiles, including `Name`, `Title`, `Company`, `Location`, and `Profile URL`.
    *   **Freemium Limit Check:** Open the extension popup. Verify that the `Export Count` has increased by the number of exported items.

3.  **Test "Select All" and "Deselect All":**
    *   Click "Select All".
    *   **Expected Result:** All checkboxes should be checked, and the export button text should update to reflect the total number of results.
    *   Click "Deselect All".
    *   **Expected Result:** All checkboxes should be unchecked, and the export button text should revert to "Export Selected (0) (CSV)".

4.  **Attempt Export with No Selection:**
    *   Ensure no checkboxes are selected.
    *   Click the "Export Selected (0) (CSV)" button.
    *   **Expected Result:** A warning notification should appear (e.g., "Please select at least one profile to export"). No CSV should be downloaded.

## 4. Freemium Limitations and PRO Features

**Objective:** Verify the freemium export limit and the placeholders for PRO features.

1.  **Reach Export Limit:**
    *   Perform exports (profile or search results) until the `Export Count` in the popup reaches `20` (the `EXPORT_LIMIT_FREE`).
    *   **Expected Result:** The progress bar in the popup should show 100% and turn red. The "Upgrade to PRO" section should be visible.
    *   Attempt one more export.
    *   **Expected Result:** An error notification should appear (e.g., "Export limit reached (20/20). Upgrade to PRO for unlimited exports."). The export should be blocked.

2.  **Test PRO Feature Placeholders:**
    *   In the extension popup, click "Upgrade to PRO".
    *   **Expected Result:** A confirmation dialog with a detailed message about PRO features and pricing should appear. Click "OK".
    *   **Expected Result:** A notification "Successfully upgraded to PRO! Refresh the popup to see new features." should appear. The popup should refresh, `isProUser` should be `true`, `Export Limit` should show `∞`, and PRO feature buttons ("Export to Google Sheets", "Bulk Export Templates") should be enabled.
    *   Click "Export to Google Sheets" and "Bulk Export Templates".
    *   **Expected Result:** Placeholder alert messages should appear for each, describing the PRO functionality.

## 5. UI/UX Verification

**Objective:** Assess the overall user experience and visual design of the extension.

1.  **Responsiveness:**
    *   Resize the Chrome window and the extension popup.
    *   **Expected Result:** UI elements should adapt gracefully without breaking layout or becoming unusable.

2.  **Clarity and Readability:**
    *   Check all text, labels, and notifications for clarity, grammar, and spelling.
    *   **Expected Result:** All text should be easy to understand and free of errors.

3.  **Consistency:**
    *   Verify consistent styling (colors, fonts, button styles) across all UI elements (buttons, notifications, popup).
    *   **Expected Result:** The extension should have a cohesive visual identity.

4.  **Feedback:**
    *   Perform various actions (successful export, failed export, cooldown).
    *   **Expected Result:** Notifications should be timely, informative, and visually distinct (e.g., green for success, red for error, yellow for warning).

5.  **Accessibility (Basic):**
    *   Ensure interactive elements (buttons, checkboxes) are clickable and have appropriate hover states.
    *   **Expected Result:** Basic accessibility principles are followed.

## 6. Field Mapping Functionality

**Objective:** Verify that users can customize which fields are exported.

1.  **Access Field Mapping:**
    *   Open the extension popup.
    *   Navigate to the "Field Mapping" section.
    *   **UI/UX Check:** Verify that checkboxes are present for each field (Name, Title, Company, Location, Profile URL, Links, About, Email).

2.  **Modify and Save Mapping:**
    *   Uncheck a few fields (e.g., "Links", "Email").
    *   Click "Save Mapping".
    *   **Expected Result:** A notification "Field mapping saved successfully!" should appear.

3.  **Verify New Mapping (Profile Export):**
    *   Perform a profile export.
    *   **Expected Result:** The downloaded CSV should *only* contain the fields that were checked in the field mapping settings. The unchecked fields should be absent.

4.  **Verify New Mapping (Search Results Export):**
    *   Perform a search results export.
    *   **Expected Result:** The downloaded CSV should *only* contain the fields that were checked in the field mapping settings. The unchecked fields should be absent.

5.  **Re-enable Fields:**
    *   Go back to Field Mapping, check all fields again, and save.
    *   Perform an export.
    *   **Expected Result:** All fields should now be present in the exported CSV.

## 7. Error Handling

**Objective:** Verify how the extension handles various error conditions.

1.  **Network Issues (Simulated):**
    *   Temporarily disable your internet connection.
    *   Attempt an export.
    *   **Expected Result:** The extension should ideally show an error notification indicating a network issue or failure to communicate with the background script/API.

2.  **LinkedIn Page Structure Changes (Hypothetical):**
    *   (This is harder to simulate manually, but consider if selectors fail)
    *   If the extension fails to find elements, it should ideally log errors to the console and provide a generic "Failed to extract data" notification to the user.

## Conclusion

Upon successful completion of all tests outlined in this guide, the LinkedIn Export Assistant extension can be considered ready for deployment. Any discrepancies or bugs found should be reported and addressed before release.
