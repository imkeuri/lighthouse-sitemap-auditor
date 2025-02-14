import { writeFileSync, existsSync, mkdirSync } from 'fs';
import lighthouse from 'lighthouse';
import puppeteer from 'puppeteer-core';
import path from 'path';
import axios from 'axios';
import { parseStringPromise } from 'xml2js';

function normalizeUrl(url) {
    // Remove trailing slashes
    return url.replace(/\/$/, '');
}

function createFullUrl(baseUrl, path) {
    baseUrl = normalizeUrl(baseUrl);
    // If the path is already a full URL, return it
    if (path.startsWith('http')) {
        return path;
    }
    // Ensure path starts with a slash
    path = path.startsWith('/') ? path : `/${path}`;
    return `${baseUrl}${path}`;
}

async function fetchSitemap(siteUrl) {
    try {
        // Ensure the URL ends with sitemap.xml
        const baseUrl = normalizeUrl(siteUrl.replace('/sitemap.xml', ''));
        const sitemapUrl = siteUrl.endsWith('sitemap.xml') ? siteUrl : `${baseUrl}/sitemap.xml`;
        
        console.log(`Fetching sitemap from: ${sitemapUrl}`);
        const { data } = await axios.get(sitemapUrl);
        const result = await parseStringPromise(data);
        
        // Return both the URLs and the base URL
        return {
            urls: result.urlset.url.map(entry => entry.loc[0]),
            baseUrl
        };
    } catch (error) {
        console.error('Error fetching sitemap:', error);
        process.exit(1);
    }
}

async function checkPageStatus(url) {
    try {
        const response = await axios.get(url);
        return response.status === 200;
    } catch (error) {
        console.log(`Skipping ${url} due to status code: ${error.response?.status || 'unknown'}`);
        return false;
    }
}

async function runLighthouse(url) {
    if (!url.startsWith('http')) {
        console.error(`Invalid URL: ${url}`);
        return;
    }

    // Check if page is accessible before running Lighthouse
    const isAccessible = await checkPageStatus(url);
    if (!isAccessible) {
        return;
    }

    const browser = await puppeteer.launch({
        headless: true,
        executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe',
        args: ['--remote-debugging-port=9222'],
    });

    try {
        const options = { logLevel: 'info', output: 'html', port: 9222 };
        const runnerResult = await lighthouse(url, options);

        // Ensure the reports directory exists
        const reportsDir = path.resolve('./reports');
        if (!existsSync(reportsDir)) {
            mkdirSync(reportsDir, { recursive: true });
        }

        // Generate PDF only (skipping HTML)
        const sanitizedFilename = url.replace(/https?:\/\//, '').replace(/[\/:?*"<>|]/g, '_');
        const pdfFilePath = path.join(reportsDir, `${sanitizedFilename}.pdf`);

        // Create a temporary page for PDF generation
        const page = await browser.newPage();
        const htmlContent = runnerResult.report;
        await page.setContent(htmlContent, { waitUntil: 'networkidle0' });
        await page.pdf({ path: pdfFilePath, format: 'A4' });

        console.log(`PDF report generated: ${pdfFilePath}`);
    } catch (error) {
        console.error(`Error generating report for ${url}:`, error);
    } finally {
        await browser.close();
    }
}

async function main() {
    // Get site URL from command line argument
    const siteUrl = process.argv[2];
    if (!siteUrl) {
        console.error('Please provide a site URL as an argument');
        console.log('Usage: node script.js https://example.com');
        process.exit(1);
    }

    const { urls, baseUrl } = await fetchSitemap(siteUrl);
    console.log(`Found ${urls.length} URLs in sitemap`);
    console.log(`Using base URL: ${baseUrl}`);

    for (const url of urls) {
        const fullUrl = createFullUrl(baseUrl, url);
        console.log(`Running Lighthouse for: ${fullUrl}`);
        await runLighthouse(fullUrl);
    }
    
    console.log('Lighthouse audits completed.');
}

main().catch(console.error);