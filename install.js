'use strict';

// This script helps with setting up the extension and downloading required fonts
// Run it using Node.js before packaging the extension

const fs = require('fs');
const path = require('path');
const https = require('https');

// Create directories if they don't exist
const dirs = ['fonts', 'icons'];
dirs.forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir);
    console.log(`Created directory: ${dir}`);
  }
});

// Function to download a file
function downloadFile(url, dest) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(dest);
    https.get(url, response => {
      response.pipe(file);
      file.on('finish', () => {
        file.close();
        console.log(`Downloaded: ${dest}`);
        resolve();
      });
    }).on('error', err => {
      fs.unlink(dest);
      reject(err);
    });
  });
}

// Download Vazirmatn font files
const fontFiles = [
  {
    url: 'https://cdn.jsdelivr.net/gh/rastikerdar/vazirmatn@v33.003/fonts/webfonts/Vazirmatn-Regular.woff2',
    dest: 'fonts/Vazirmatn-Regular.woff2'
  },
  {
    url: 'https://cdn.jsdelivr.net/gh/rastikerdar/vazirmatn@v33.003/fonts/webfonts/Vazirmatn-Bold.woff2',
    dest: 'fonts/Vazirmatn-Bold.woff2'
  }
];

// Create font-face CSS file
const fontFaceCSS = `@font-face {
  font-family: 'Vazirmatn';
  src: url('chrome-extension://__MSG_@@extension_id__/fonts/Vazirmatn-Regular.woff2') format('woff2');
  font-weight: normal;
  font-style: normal;
  font-display: swap;
}

@font-face {
  font-family: 'Vazirmatn';
  src: url('chrome-extension://__MSG_@@extension_id__/fonts/Vazirmatn-Bold.woff2') format('woff2');
  font-weight: bold;
  font-style: normal;
  font-display: swap;
}`;

fs.writeFileSync('fonts/vazirmatn.css', fontFaceCSS);
console.log('Created font CSS file');

// Download all font files
Promise.all(fontFiles.map(file => downloadFile(file.url, file.dest)))
  .then(() => {
    console.log('All font files have been downloaded successfully.');
  })
  .catch(err => {
    console.error('Error downloading font files:', err);
  });

// Create placeholder icons if they don't exist
const iconSizes = [16, 48, 128];
iconSizes.forEach(size => {
  const iconPath = `icons/icon${size}.png`;
  if (!fs.existsSync(iconPath)) {
    console.log(`Icon ${iconPath} doesn't exist. Please add your icon files.`);
  }
});
