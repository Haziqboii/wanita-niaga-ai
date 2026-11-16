const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');
const pdfjsLib = require('pdfjs-dist/legacy/build/pdf.js');
const { createCanvas } = require('canvas');

const ARTIFACT_DIR = 'C:/Users/haxim/.gemini/antigravity/brain/47654856-1cc5-4831-8489-f0d17b9c4395';
const DIAG_DIR = path.join(ARTIFACT_DIR, 'diagnose_mobile');

if (!fs.existsSync(DIAG_DIR)) {
  fs.mkdirSync(DIAG_DIR, { recursive: true });
}

async function convertPdfToImages(pdfPath, prefix) {
  const data = new Uint8Array(fs.readFileSync(pdfPath));
  const doc = await pdfjsLib.getDocument({ data }).promise;
  const numPages = doc.numPages;
  const imagePaths = [];

  for (let i = 1; i <= numPages; i++) {
    const page = await doc.getPage(i);
    const viewport = page.getViewport({ scale: 2.0 }); // High-res render
    const canvas = createCanvas(viewport.width, viewport.height);
    const context = canvas.getContext('2d');

    await page.render({
      canvasContext: context,
      viewport: viewport,
    }).promise;

    const outPath = path.join(DIAG_DIR, `${prefix}_page_${i}.png`);
    fs.writeFileSync(outPath, canvas.toBuffer('image/png'));
    imagePaths.push(outPath);
  }
  return imagePaths;
}

async function runDiagnosis() {
  console.log('--- Starting Mobile Diagnosis ---');
  const browser = await puppeteer.launch({
    headless: 'new',
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();

  // Emulate iPhone 14 Pro
  await page.setViewport({
    width: 393,
    height: 852,
    deviceScaleFactor: 3,
    isMobile: true,
    hasTouch: true,
  });
  await page.setUserAgent('Mozilla/5.0 (iPhone; CPU iPhone OS 16_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.6 Mobile/15E148 Safari/604.1');

  // Configure download behavior
  const client = await page.target().createCDPSession();
  await client.send('Page.setDownloadBehavior', {
    behavior: 'allow',
    downloadPath: DIAG_DIR,
  });

  console.log('Navigating to http://localhost:5173/');
  await page.goto('http://localhost:5173/', { waitUntil: 'networkidle0' });

  // 1. Check if mock data is loaded. Let's load the 600 records if not present
  await page.evaluate(() => {
    // Clear any previous data and insert mock data if necessary
    const hasData = localStorage.getItem('mekara_sales_records');
    console.log('Existing sales records count:', hasData ? JSON.parse(hasData).length : 0);
  });

  // Check if we need to load sample data
  const loadBtn = await page.$('button[data-testid="load-sample-data"], button:has-text("Muat Data Sampel")');
  if (loadBtn) {
    await loadBtn.click();
    await new Promise(r => setTimeout(r, 1000));
  }

  // Navigate to Dashboard tab
  const tabs = await page.$$('nav button, button');
  for (const tab of tabs) {
    const text = await page.evaluate(el => el.textContent, tab);
    if (text && (text.includes('Laporan') || text.includes('Jualan') || text.includes('Dashboard'))) {
      console.log('Clicking tab:', text.trim());
      await tab.click();
      break;
    }
  }

  await new Promise(r => setTimeout(r, 1500));

  // 2. Capture mobile web dashboard charts
  console.log('Capturing mobile web dashboard...');
  await page.screenshot({ path: path.join(DIAG_DIR, '01_mobile_web_top.png') });

  // Scroll down to charts
  const productBarChartEl = await page.$('#chart-product-bar');
  if (productBarChartEl) {
    await productBarChartEl.scrollIntoView();
    await new Promise(r => setTimeout(r, 500));
    await productBarChartEl.screenshot({ path: path.join(DIAG_DIR, '02_mobile_web_product_bar.png') });
    console.log('Captured Product Bar Chart in mobile web');
  } else {
    console.log('Could not find #chart-product-bar');
  }

  const doughnutChartEl = await page.$('#chart-product-doughnut');
  if (doughnutChartEl) {
    await doughnutChartEl.scrollIntoView();
    await new Promise(r => setTimeout(r, 500));
    await doughnutChartEl.screenshot({ path: path.join(DIAG_DIR, '03_mobile_web_doughnut.png') });
    console.log('Captured Product Doughnut Chart in mobile web');
  } else {
    console.log('Could not find #chart-product-doughnut');
  }

  // Scroll further down for remaining charts (trend and channels)
  await page.evaluate(() => window.scrollBy(0, 600));
  await new Promise(r => setTimeout(r, 500));
  await page.screenshot({ path: path.join(DIAG_DIR, '04_mobile_web_advanced_charts.png') });

  // 3. Now trigger PDF Export in Mobile Viewport
  console.log('Looking for PDF Export button in mobile...');
  const pdfBtn = await page.$('button:has-text("Muat Turun"), button:has-text("PDF")');
  let pdfDownloaded = false;
  
  // Find all buttons containing PDF or Muat Turun
  const allButtons = await page.$$('button');
  for (const b of allButtons) {
    const bText = await page.evaluate(el => el.textContent, b);
    if (bText && (bText.includes('PDF') || bText.includes('Muat Turun'))) {
      console.log('Found PDF button:', bText.trim());
      await b.scrollIntoView();
      await new Promise(r => setTimeout(r, 500));
      await b.click();
      console.log('Clicked PDF button, waiting for export...');
      pdfDownloaded = true;
      break;
    }
  }

  if (pdfDownloaded) {
    // Wait for PDF file to appear in DIAG_DIR
    let downloadedFile = null;
    for (let wait = 0; wait < 20; wait++) {
      await new Promise(r => setTimeout(r, 500));
      const files = fs.readdirSync(DIAG_DIR).filter(f => f.endsWith('.pdf'));
      if (files.length > 0) {
        downloadedFile = path.join(DIAG_DIR, files[0]);
        console.log('PDF exported successfully on mobile:', files[0]);
        break;
      }
    }

    if (downloadedFile) {
      console.log('Converting exported mobile PDF to PNG images...');
      const images = await convertPdfToImages(downloadedFile, 'mobile_pdf');
      console.log('Converted pages:', images);
    } else {
      console.log('No PDF file detected in download directory after 10s');
    }
  }

  await browser.close();
  console.log('Diagnosis capture finished!');
}

runDiagnosis().catch(err => {
  console.error('Diagnosis failed:', err);
  process.exit(1);
});
