import puppeteer from 'puppeteer-core'
import path from 'path'
import fs from 'fs'

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
const ARTIFACT_DIR = 'C:\\Users\\haxim\\.gemini\\antigravity\\brain\\47654856-1cc5-4831-8489-f0d17b9c4395'
const DOWNLOAD_DIR = path.join(ARTIFACT_DIR, 'diagnose_mobile')
const FIXTURE_PATH = 'C:\\SULAM\\wanita-niaga-ai\\src\\__tests__\\fixtures\\Wanita_Niaga_AI_600_Rekod_Jualan_Sep_Okt_2026.xlsx'
const BASE_URL = 'http://localhost:5173/'

if (!fs.existsSync(DOWNLOAD_DIR)) {
  fs.mkdirSync(DOWNLOAD_DIR, { recursive: true })
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

async function run() {
  console.log('📱 Starting Mobile Distortion Diagnosis...')
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  })

  try {
    const page = await browser.newPage()
    page.on('dialog', async (d) => {
      console.log('   [Dialog]:', d.message())
      await d.accept()
    })

    const client = await page.target().createCDPSession()
    await client.send('Page.setDownloadBehavior', {
      behavior: 'allow',
      downloadPath: DOWNLOAD_DIR,
    })

    // Clean old files in download dir
    const oldFiles = fs.readdirSync(DOWNLOAD_DIR)
    for (const f of oldFiles) {
      try { fs.unlinkSync(path.join(DOWNLOAD_DIR, f)) } catch {}
    }

    // Step 1: Initial load on desktop to upload fixture cleanly
    console.log('1. Loading application and uploading 600 records fixture...')
    await page.setViewport({ width: 1280, height: 900 })
    await page.goto(BASE_URL, { waitUntil: 'networkidle2' })
    await sleep(500)

    // Clear previous storage
    await page.evaluate(() => {
      indexedDB.deleteDatabase('WanitaNiagaAI_DB')
      localStorage.clear()
      sessionStorage.clear()
    })
    await page.goto(BASE_URL, { waitUntil: 'networkidle2' })
    await sleep(500)

    // Scroll to Section 2
    await page.evaluate(() => {
      window.scrollTo({ top: window.innerHeight, behavior: 'instant' })
    })
    await sleep(500)

    // Click "Pilih Fail"
    const excelCardBtn = await page.$('button ::-p-text(Pilih Fail)')
    if (!excelCardBtn) throw new Error('Could not find "Pilih Fail"')
    await excelCardBtn.click()
    await sleep(600)

    // Upload fixture file
    const fileInput = await page.$('input[type="file"]')
    if (!fileInput) throw new Error('Could not find file input')
    await fileInput.uploadFile(FIXTURE_PATH)
    console.log('   ✓ Uploaded 600-record fixture file')
    await sleep(1000)

    // Click generate report button
    const buttons = await page.$$('button')
    for (const btn of buttons) {
      const text = await page.evaluate((el) => el.innerText, btn)
      if (text.includes('Laporan') || text.includes('Sahkan') || text.includes('Jana')) {
        await btn.click()
        break
      }
    }
    console.log('   ✓ Entered Dashboard')
    await sleep(2500)

    // Step 2: Switch to Mobile Viewport (iPhone 14: 390 x 844, DPR 3, touch)
    console.log('\n2. Switching viewport to Mobile (iPhone 14: 390x844, DPR=3)...')
    await page.setViewport({
      width: 390,
      height: 844,
      deviceScaleFactor: 3,
      isMobile: true,
      hasTouch: true,
    })
    await page.setUserAgent(
      'Mozilla/5.0 (iPhone; CPU iPhone OS 16_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.6 Mobile/15E148 Safari/604.1'
    )
    await sleep(1000)

    // Capture mobile web dashboard screenshots
    console.log('3. Capturing Mobile Web Dashboard screenshots...')
    await page.screenshot({
      path: path.join(DOWNLOAD_DIR, '01_mobile_dashboard_top.png'),
    })

    // Find and capture product bar chart
    const barChart = await page.$('#chart-product-bar')
    if (barChart) {
      await barChart.scrollIntoView()
      await sleep(600)
      await barChart.screenshot({
        path: path.join(DOWNLOAD_DIR, '02_mobile_web_bar_chart.png'),
      })
      console.log('   ✓ Captured 02_mobile_web_bar_chart.png')
    }

    // Find and capture doughnut chart (Sumbangan Produk)
    const doughnutChart = await page.$('#chart-product-doughnut')
    if (doughnutChart) {
      await doughnutChart.scrollIntoView()
      await sleep(600)
      await doughnutChart.screenshot({
        path: path.join(DOWNLOAD_DIR, '03_mobile_web_doughnut_chart.png'),
      })
      console.log('   ✓ Captured 03_mobile_web_doughnut_chart.png')
    }

    // Capture trend line chart & channel doughnut chart
    await page.evaluate(() => window.scrollBy(0, 500))
    await sleep(600)
    await page.screenshot({
      path: path.join(DOWNLOAD_DIR, '04_mobile_web_trend_and_channels.png'),
    })

    await page.evaluate(() => window.scrollBy(0, 600))
    await sleep(600)
    await page.screenshot({
      path: path.join(DOWNLOAD_DIR, '05_mobile_web_channel_bottom.png'),
    })

    // Step 3: Click "Simpan Laporan PDF" on mobile viewport
    console.log('\n4. Triggering PDF Export directly on Mobile Viewport...')
    let exportBtn = await page.$('button ::-p-text(Simpan Laporan PDF)')
    if (!exportBtn) {
      const allButtons = await page.$$('button')
      for (const b of allButtons) {
        const txt = await page.evaluate(el => el.innerText, b)
        if (txt.includes('Laporan PDF') || txt.includes('Muat Turun')) {
          exportBtn = b
          break
        }
      }
    }

    if (exportBtn) {
      await exportBtn.scrollIntoView()
      await sleep(500)
      await exportBtn.click()
      console.log('   Clicked PDF export button, waiting for generation...')

      let downloadedFile = null
      for (let i = 0; i < 40; i++) {
        await sleep(500)
        const files = fs.readdirSync(DOWNLOAD_DIR).filter(f => f.endsWith('.pdf'))
        if (files.length > 0) {
          downloadedFile = path.join(DOWNLOAD_DIR, files[0])
          const stats = fs.statSync(downloadedFile)
          if (stats.size > 10000) {
            console.log(`   ✓ Mobile-exported PDF: ${files[0]} (${(stats.size / 1024).toFixed(1)} KB)`)
            break
          }
        }
      }

      if (downloadedFile) {
        console.log('5. Rendering Mobile-exported PDF pages to images...')
        const pdfBytes = fs.readFileSync(downloadedFile)
        const pdfBase64 = pdfBytes.toString('base64')

        const renderHtml = `
          <!DOCTYPE html>
          <html>
          <head>
            <script src="https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js"></script>
            <style>
              body { margin: 0; background: #555; }
              canvas { display: block; margin: 10px auto; box-shadow: 0 4px 10px rgba(0,0,0,0.3); }
            </style>
          </head>
          <body>
            <div id="container"></div>
            <script>
              pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
              window.rendered = false;
              window.renderAll = async (base64Data) => {
                const raw = atob(base64Data);
                const uint8Array = new Uint8Array(raw.length);
                for (let i = 0; i < raw.length; i++) {
                  uint8Array[i] = raw.charCodeAt(i);
                }
                const pdf = await pdfjsLib.getDocument({ data: uint8Array }).promise;
                window.numPages = pdf.numPages;
                const container = document.getElementById('container');
                for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
                  const page = await pdf.getPage(pageNum);
                  const scale = 2.0;
                  const viewport = page.getViewport({ scale });
                  
                  const canvas = document.createElement('canvas');
                  canvas.id = 'page-' + pageNum;
                  canvas.width = viewport.width;
                  canvas.height = viewport.height;
                  container.appendChild(canvas);
                  
                  const context = canvas.getContext('2d');
                  await page.render({ canvasContext: context, viewport: viewport }).promise;
                }
                window.rendered = true;
              }
            </script>
          </body>
          </html>
        `

        const renderPage = await browser.newPage()
        await renderPage.setViewport({ width: 1200, height: 1600 })
        await renderPage.setContent(renderHtml, { waitUntil: 'networkidle2' })
        await renderPage.evaluate(async (b64) => {
          await window.renderAll(b64)
        }, pdfBase64)

        await renderPage.waitForFunction(() => window.rendered === true, { timeout: 15000 })
        const numPages = await renderPage.evaluate(() => window.numPages)
        console.log(`   ✓ Exported PDF contains ${numPages} pages`)

        for (let p = 1; p <= numPages; p++) {
          const canvasHandle = await renderPage.$(`#page-${p}`)
          if (canvasHandle) {
            const outPath = path.join(DOWNLOAD_DIR, `06_mobile_exported_pdf_page_${p}.png`)
            await canvasHandle.screenshot({ path: outPath })
            console.log(`   ✓ Saved Mobile-Exported PDF Page ${p} screenshot: 06_mobile_exported_pdf_page_${p}.png`)
          }
        }
        await renderPage.close()
      }
    } else {
      console.log('   ❌ Could not find "Simpan Laporan PDF" button!')
    }

  } catch (err) {
    console.error('Diagnosis error:', err)
  } finally {
    await browser.close()
    console.log('Diagnosis finished.')
  }
}

run()
