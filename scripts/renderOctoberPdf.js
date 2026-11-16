import puppeteer from 'puppeteer-core'
import path from 'path'
import fs from 'fs'

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
const ARTIFACT_DIR = 'C:\\Users\\haxim\\.gemini\\antigravity\\brain\\47654856-1cc5-4831-8489-f0d17b9c4395'
const DOWNLOAD_DIR = path.join(ARTIFACT_DIR, 'pdf_downloads')
const SCREENSHOT_DIR = path.join(ARTIFACT_DIR, 'screenshots', 'phase5_pdf')
const PDF_PATH = path.join(DOWNLOAD_DIR, 'Mekara_Laporan_Jualan_Okt_2026.pdf')

async function run() {
  console.log('Rendering October PDF Page 1...')
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  })

  try {
    const page = await browser.newPage()
    await page.setViewport({ width: 1200, height: 1600 })

    const pdfBytes = fs.readFileSync(PDF_PATH)
    const pdfBase64 = pdfBytes.toString('base64')

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <script src="https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js"></script>
        <style>body { margin: 0; background: white; }</style>
      </head>
      <body>
        <canvas id="canvas"></canvas>
        <script>
          pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
          async function render() {
            const raw = atob("${pdfBase64}");
            const uint8 = new Uint8Array(raw.length);
            for (let i = 0; i < raw.length; i++) uint8[i] = raw.charCodeAt(i);
            const pdf = await pdfjsLib.getDocument({ data: uint8 }).promise;
            const p = await pdf.getPage(1);
            const viewport = p.getViewport({ scale: 2.0 });
            const canvas = document.getElementById('canvas');
            canvas.width = viewport.width;
            canvas.height = viewport.height;
            const ctx = canvas.getContext('2d');
            await p.render({ canvasContext: ctx, viewport: viewport }).promise;
            window.done = true;
          }
          render();
        </script>
      </body>
      </html>
    `

    await page.setContent(html, { waitUntil: 'domcontentloaded' })
    await page.waitForFunction(() => window.done === true, { timeout: 20000 })

    const canvas = await page.$('#canvas')
    if (canvas) {
      await canvas.screenshot({ path: path.join(SCREENSHOT_DIR, '05_pdf_october_page_1.png') })
      console.log('✓ Successfully rendered 05_pdf_october_page_1.png')
    }
  } catch (e) {
    console.error('Error:', e)
  } finally {
    await browser.close()
  }
}

run()
