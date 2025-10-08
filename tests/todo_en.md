### Phase 1: Test Preparation: Creating a Test Environment and Chrome API Mocks
- [ ] Create `tests/chrome-mock.js` for Chrome API mocks.
- [ ] Create `tests/test-setup.js` for test environment setup.

### Phase 2: Writing and Executing Automated Tests for `background.js`
- [x] Write tests for `resetExportCountIfNewMonth`.
- [x] Write tests for `mapData`.
- [x] Write tests for `chrome.runtime.onMessage` handler (EXPORT_PROFILE, EXPORT_SEARCH_RESULTS, GET_STATUS, UPDATE_FIELD_MAPPING).
- [x] Execute tests and ensure they pass.

### Phase 3: Writing and Executing Automated Tests for `content.js` (DOM Mocks)
- [ ] Write tests for `extractProfileData`.
- [ ] Write tests for `extractSearchResultsData`.
- [ ] Write tests for `injectProfileExportButton` (check button addition).
- [ ] Write tests for `injectSearchResultsExportButton` (check button and checkbox addition).
- [ ] Write tests for `canExport` (rate limiting).
- [ ] Execute tests and ensure they pass.

### Phase 4: Writing and Executing Automated Tests for `popup.js` (DOM and Chrome API Mocks)
- [ ] Write tests for `loadStatus`.
- [ ] Write tests for `loadExportHistory`.
- [ ] Write tests for `loadFieldMapping`.
- [ ] Write tests for `saveFieldMapping`.
- [ ] Write tests for `showPreview` and `hidePreview`.
- [ ] Write tests for `exportToCSV`.
- [ ] Write tests for `upgradeToProPlaceholder`.
- [ ] Execute tests and ensure they pass.

### Phase 5: Visual Code Review of UI/UX (`popup.html`, `popup.css`, `content.js`)
- [ ] Check `popup.html` for semantic correctness and accessibility.
- [ ] Check `popup.css` for design compliance and responsiveness.
- [ ] Check `content.js` for correct element and style injection.
- [ ] Ensure all elements are interactive and visually appealing.

### Phase 6: Creating a Detailed Manual Testing Guide
- [ ] Create `MANUAL_TESTING_GUIDE.md`.
- [ ] Describe step-by-step instructions for testing S1 (profile export).
- [ ] Describe step-by-step instructions for testing S2 (search results export).
- [ ] Describe step-by-step instructions for testing S3 (mapping settings).
- [ ] Describe instructions for testing limits and PRO functionality.
- [ ] Describe instructions for testing export history.
- [ ] Describe instructions for testing notifications and error handling.

### Phase 7: Creating the Final Project Archive with Tests and Guide
- [ ] Create a new project archive with all updated files, including tests and the manual testing guide.
- [ ] Provide the archive to the user.

