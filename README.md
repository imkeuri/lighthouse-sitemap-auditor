# lighthouse-sitemap-auditor

Automated Lighthouse performance analysis tool that crawls your sitemap.xml to generate comprehensive PDF reports for every accessible page on your website. Built with Node.js, it combines sitemap parsing with Lighthouse auditing to provide batch performance insights across your entire site.

## Prerequisites

- Node.js (v14 or higher)
- Google Chrome browser
- NPM or Yarn

## Installation

```bash
git clone [your-repo-url]
cd lighthouse-sitemap-auditor
npm install lighthouse puppeteer-core axios xml2js
```

## Usage

```bash
node lighthouse-analyzer.js https://example.com/sitemap.xml
```

The script will:
- Fetch and parse the sitemap.xml
- Skip error pages (404, 403, etc.)
- Generate PDF reports in the `./reports` directory

## Chrome Path Configuration

Update the Chrome path in `lighthouse-analyzer.js` according to your system:

```javascript
executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe' // Windows
// executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome' // macOS
// executablePath: '/usr/bin/google-chrome' // Linux
```

## Features

- Automatic sitemap crawling
- Error page skipping
- PDF report generation
- Relative/absolute URL support
- Detailed console logging

## Contributing

Pull requests are welcome. For major changes, please open an issue first to discuss what you would like to change.

## License

[Apache License 2.0](http://www.apache.org/licenses/LICENSE-2.0)
