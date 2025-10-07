# LinkedIn Export Assistant

A powerful Chrome extension that allows you to export LinkedIn profiles and search results to CSV format with just one click.

## 🚀 Features

### Core Functionality
- **Profile Export (S1)**: Export individual LinkedIn profiles with detailed information
- **Search Results Export (S2)**: Export multiple profiles from LinkedIn search results
- **Field Mapping (S3)**: Customize which fields to export and their column names
- **Data Preview**: Preview extracted data before exporting
- **Export History**: Track your recent exports with timestamps

### Data Fields Supported
- Name
- Job Title
- Company
- Location
- About/Summary
- Profile URL
- Email (if visible)
- Links

### Export Options
- **CSV Format**: Download data as CSV files
- **Selective Export**: Choose specific profiles from search results
- **Bulk Operations**: Select all/deselect all functionality
- **Custom Field Mapping**: Configure which fields to include

### Freemium Model
- **Free Tier**: 20 exports per month
- **PRO Tier**: Unlimited exports + advanced features

## 🎯 Use Cases

Perfect for:
- **Recruiters**: Building candidate databases
- **Sales Teams**: Prospecting and lead generation
- **Business Development**: Market research and networking
- **HR Professionals**: Talent acquisition and sourcing

## 📋 Installation

See [INSTALL.md](INSTALL.md) for detailed installation instructions.

## 🔧 Usage

### Exporting Individual Profiles
1. Navigate to any LinkedIn profile page
2. Click the "Export Profile (CSV)" button that appears
3. Preview the data in the extension popup
4. Click "Export CSV" to download

### Exporting Search Results
1. Perform a people search on LinkedIn
2. Use checkboxes to select profiles you want to export
3. Click "Export Selected (N) (CSV)" button
4. CSV file will be automatically downloaded

### Configuring Field Mapping
1. Open the extension popup
2. Go to "Field Mapping Settings"
3. Check/uncheck fields you want to include
4. Click "Save Mapping"

## 🏗️ Architecture

### Files Structure
```
linkedin-export-assistant/
├── manifest.json          # Extension configuration
├── content.js             # DOM parsing and UI injection
├── background.js           # Data processing and storage
├── popup.html             # Extension popup interface
├── popup.js               # Popup functionality
├── popup.css              # Popup styling
├── icons/                 # Extension icons
├── README.md              # This file
└── INSTALL.md             # Installation guide
```

### Technical Implementation
- **Content Script**: Injects export buttons and extracts data from LinkedIn pages
- **Background Script**: Manages export limits, data storage, and field mapping
- **Popup Interface**: Provides settings, preview, and export history
- **Local Storage**: Stores export history and user preferences

## 🔒 Privacy & Security

- **No Data Collection**: All data processing happens locally
- **No External Servers**: Data is not sent to any external services
- **Local Storage Only**: Export history stored in browser's local storage
- **Minimal Permissions**: Only requests necessary LinkedIn access

## 🚧 Limitations & Considerations

### Current Limitations
- Relies on LinkedIn's DOM structure (may break with UI updates)
- Limited to publicly visible profile information
- Rate limiting to prevent abuse (2-second cooldown between exports)
- Email extraction only works if email is visible in DOM

### LinkedIn Compliance
- Only extracts publicly visible information
- Respects LinkedIn's rate limiting
- Does not perform automated actions beyond data extraction
- Users responsible for compliance with LinkedIn's Terms of Service

## 🔮 Roadmap

### Version 1.1 (Planned)
- Google Sheets API integration
- Advanced filtering options
- Bulk export templates
- Custom filename patterns

### Version 2.0 (Future)
- Enhanced anti-blocking measures
- Additional data fields
- Export scheduling
- Team collaboration features

## 🛠️ Development

### Prerequisites
- Chrome browser
- Basic understanding of Chrome extensions
- Text editor

### Local Development
1. Clone/download the project
2. Open Chrome and go to `chrome://extensions/`
3. Enable "Developer mode"
4. Click "Load unpacked" and select the project folder
5. Make changes to the code
6. Click the refresh button in the extension card

### Testing
- Test on various LinkedIn profile types
- Verify export functionality with different search results
- Check field mapping configurations
- Test rate limiting and error handling

## 📞 Support

For issues, feature requests, or questions:
1. Check the troubleshooting section in INSTALL.md
2. Review the browser console for error messages
3. Ensure you're using the latest version of Chrome
4. Verify LinkedIn page structure hasn't changed

## 📄 License

This project is for educational and personal use. Users are responsible for compliance with LinkedIn's Terms of Service and applicable data protection laws.

## 🤝 Contributing

This is a demonstration project. For production use, consider:
- Implementing proper error handling
- Adding comprehensive testing
- Setting up CI/CD pipeline
- Adding user analytics (with consent)
- Implementing proper licensing system

## ⚠️ Disclaimer

This extension is not affiliated with LinkedIn. Use responsibly and in accordance with LinkedIn's Terms of Service. The extension only extracts publicly visible information and does not perform any unauthorized data collection.

