# Dynamic RTL

## Overview
Dynamic RTL is a Chrome extension that automatically detects Persian/Arabic text and applies Right-to-Left (RTL) text direction and appropriate font styling. The extension is designed to work across all websites, with special optimizations for dynamic web applications like Claude.ai.

## Features
- Automatic detection of Persian/Arabic text
- Dynamic application of RTL direction to text elements
- Support for input fields, contenteditable elements, and static text
- Built-in support for the Vazirmatn font
- Special handling for dynamic web apps like Claude.ai
- Site-by-site configuration options
- Low performance impact through optimized observers and debouncing

## Installation

### From Chrome Web Store
1. Visit the Chrome Web Store page for Dynamic RTL (link TBD)
2. Click "Add to Chrome"
3. Confirm the installation

### Developer Installation
1. Clone this repository or download the ZIP archive
2. Run `node install.js` to download fonts and set up the extension
3. Open Chrome and navigate to `chrome://extensions/`
4. Enable "Developer mode" in the top-right corner
5. Click "Load unpacked" and select the extension directory
6. The extension should now be installed and active

## Usage

### Basic Usage
The extension works automatically once installed. When you visit a webpage or type in Persian/Arabic:

1. Text that starts with Persian/Arabic will automatically switch to RTL direction
2. Input fields will dynamically change direction based on the entered text
3. The Vazirmatn font will be applied to Persian/Arabic text for better readability

### Configuration
Click the extension icon in the toolbar to access settings:

- **Current Site Settings**: Enable/disable the extension for the current website
- **Global Settings**: Choose the default behavior (enabled or disabled) for all sites

### Optimized for Claude.ai
This extension includes special handling for Claude.ai to ensure smooth operation:

- Claude's text input areas are correctly detected and handled
- RTL direction is applied without interfering with Claude's functionality
- Performance optimizations to prevent slowdowns during conversations

## Troubleshooting

If you experience issues with the extension:

1. **Performance Problems**: If a website becomes slow, try disabling the extension for that specific site
2. **Text Direction Issues**: For input fields that aren't correctly detected, try typing a few more Persian/Arabic characters
3. **Font Not Loading**: Check if your browser allows loading custom fonts from extensions
4. **Claude.ai Specific Issues**: Try refreshing the page; the extension will reinitialize

## Updates in Version 1.2
- Performance improvements through debouncing and batched processing
- Special handling for dynamic web applications like Claude.ai
- Improved font loading mechanism
- Fixed issues with contenteditable elements
- Added site-specific optimizations
- Reduced CPU usage on complex pages

## For Developers
If you want to contribute to this extension:

1. The main content script (`content.js`) handles the core functionality
2. Special site handling is in the `claude-helper.js` file
3. Settings management is handled through Chrome's storage API in `background.js`
4. The install script helps with downloading and packaging required resources

## License
[MIT License](LICENSE)

## Contact
For support or feature requests, please open an issue on the GitHub repository.
This project is open source and available under the MIT License.

## Credits

- Original script by Sorou-sh
- Vazirmatn font by Saber Rastikerdar

## Language

- [فارسی (Persian)](README.fa.md) 
