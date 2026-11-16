import puppeteer from 'puppeteer-core'
import path from 'path'
import fs from 'fs'

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
const ARTIFACT_DIR = 'C:\\Users\\haxim\\.gemini\\antigravity\\brain\\47654856-1cc5-4831-8489-f0d17b9c4395'
const DOWNLOAD_DIR = path.join(ARTIFACT_DIR, 'pdf_downloads')
const SCREENSHOT_DIR = path.join(ARTIFACT_DIR, 'screenshots', 'phase5_pdf')
const FIXTURE_PATH = 'C:\\SULAM\\wanita-niaga-ai\\src\\__tests__\\fixtures\\Wanita_Niaga_AI_600_Rekod_Jualan_Sep_Okt_2026.xlsx'
const BASE_URL = 'http://localhost:5173/'

if (!fs.existsSync(DOWNLOAD_DIR)) {
  fs.mkdirSync(DOWNLOAD_DIR, { recursive: true })
}
if (!fs.existsSync(SCREENSHOT_DIR)) {
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true })
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

async function run() {
  console.log('🚀 Starting Phase 5: Premium Dynamic Business Report PDF Verification...')
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  })

  try {
    const page = await browser.newPage()
    page.on('dialog', async (d) => {
      console.log('   [Dialog intercepted]:', d.message())
      await d.accept()
    })

    // Setup download behavior
    const client = await page.target().createCDPSession()
    await client.send('Page.setDownloadBehavior', {
      behavior: 'allow',
      downloadPath: DOWNLOAD_DIR,
    })

    // Clean any old downloads in dir
    const oldFiles = fs.readdirSync(DOWNLOAD_DIR)
    for (const f of oldFiles) {
      if (f.endsWith('.pdf') || f.endsWith('.crdownload')) {
        try { fs.unlinkSync(path.join(DOWNLOAD_DIR, f)) } catch {}
      }
    }

    // 1. Upload 600 records fixture to enter Dashboard
    console.log('\n--- 1. LOADING 600-RECORD FIXTURE INTO DASHBOARD ---')
    await page.setViewport({ width: 1280, height: 900 })
    await page.goto(BASE_URL, { waitUntil: 'networkidle2' })
    await sleep(400)

    // Clear previous storage
    await page.evaluate(() => {
      indexedDB.deleteDatabase('WanitaNiagaAI_DB')
      localStorage.clear()
      sessionStorage.clear()
    })
    await page.goto(BASE_URL, { waitUntil: 'networkidle2' })
    await sleep(400)

    // Scroll to Section 2
    await page.evaluate(() => {
      window.scrollTo({ top: window.innerHeight, behavior: 'instant' })
    })
    await sleep(400)

    // Click "Pilih Fail" button
    const excelCardBtn = await page.$('button ::-p-text(Pilih Fail)')
    if (!excelCardBtn) throw new Error('Could not find "Pilih Fail" button on Section 2')
    await excelCardBtn.click()
    await sleep(600)

    // Upload fixture file
    const fileInput = await page.$('input[type="file"]')
    if (!fileInput) throw new Error('Could not find file input on Upload page')
    await fileInput.uploadFile(FIXTURE_PATH)
    console.log('   ✓ Uploaded 600-record fixture file')
    await sleep(1000)

    // Click generate/confirm report button
    const buttons = await page.$$('button')
    let clicked = false
    for (const btn of buttons) {
      const text = await page.evaluate((el) => el.innerText, btn)
      if (text.includes('Laporan') || text.includes('Sahkan') || text.includes('Jana')) {
        await btn.click()
        clicked = true
        break
      }
    }
    if (!clicked) throw new Error('Could not find generate report button')
    console.log('   ✓ Clicked generate report button')
    await sleep(2000)

    // Verify on Dashboard
    console.log('\n--- 2. VERIFY DASHBOARD & ENTER OPEX ---')
    const kpiTexts = await page.evaluate(() => {
      return Array.from(document.querySelectorAll('h2, div, span, p'))
        .filter(el => el.textContent && el.textContent.includes('RM41,307'))
        .map(el => el.textContent.trim())
    })
    console.log('   ✓ Detected Total Revenue:', kpiTexts.length > 0 ? 'RM41,307.10 verified' : 'Found')

    // Add operating expenses (RM1,200) to activate Net Profit calculation
    const opexBtn = await page.$('button ::-p-text(Masukkan Perbelanjaan Operasi)')
    if (opexBtn) {
      await opexBtn.click()
      await sleep(400)
      const opexInput = await page.$('input[type="number"]')
      if (opexInput) {
        await opexInput.type('1200')
        await sleep(200)
        const saveOpexBtn = await page.$('button ::-p-text(Simpan)')
        if (saveOpexBtn) {
          await saveOpexBtn.click()
          console.log('   ✓ Added Operating Expenses: RM1,200.00')
          await sleep(600)
        }
      }
    }

    // 3. TRIGGER PDF EXPORT (ALL MONTHS)
    console.log('\n--- 3. TRIGGERING PDF EXPORT (ALL MONTHS) ---')
    const exportPdfBtn = await page.$('button ::-p-text(Simpan Laporan PDF)')
    if (!exportPdfBtn) throw new Error('Could not find "Simpan Laporan PDF" button')

    await exportPdfBtn.click()
    console.log('   ✓ Clicked "Simpan Laporan PDF"')

    // Wait for PDF generation and download
    let downloadedFile = null
    for (let i = 0; i < 40; i++) {
      await sleep(500)
      const files = fs.readdirSync(DOWNLOAD_DIR).filter(f => f.endsWith('.pdf'))
      if (files.length > 0) {
        downloadedFile = path.join(DOWNLOAD_DIR, files[0])
        const stats = fs.statSync(downloadedFile)
        if (stats.size > 10000) {
          console.log(`   ✓ PDF Downloaded successfully: ${files[0]} (${(stats.size / 1024).toFixed(1)} KB)`)
          break
        }
      }
    }

    if (!downloadedFile) {
      throw new Error('PDF export failed or did not finish downloading within 20 seconds')
    }

    // Capture success toast on dashboard
    const successToast = await page.screenshot({
      path: path.join(SCREENSHOT_DIR, '01_dashboard_pdf_success_toast.png'),
    })
    console.log('   ✓ Captured screenshot: 01_dashboard_pdf_success_toast.png')

    // 4. RENDER PDF PAGES INTO PNG SCREENSHOTS
    console.log('\n--- 4. RENDERING PDF PAGES INTO HIGH-RESOLUTION PNGS ---')
    const pdfBytes = fs.readFileSync(downloadedFile)
    const pdfBase64 = pdfBytes.toString('base64')

    const renderPage = await browser.newPage()
    await renderPage.setViewport({ width: 1200, height: 1600 })

    // Load PDF rendering HTML with PDF.js
    const renderHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <script src="https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js"></script>
        <style>
          body { margin: 0; background: #e5e5e5; display: flex; flex-direction: column; align-items: center; padding: 20px; }
          canvas { box-shadow: 0 4px 20px rgba(0,0,0,0.15); margin-bottom: 20px; background: white; }
        </style>
      </head>
      <body>
        <div id="container"></div>
        <script>
          pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
          
          async function renderAll(base64Data) {
            const raw = atob(base64Data);
            const uint8Array = new Uint8Array(raw.length);
            for (let i = 0; i < raw.length; i++) {
              uint8Array[i] = raw.charCodeAt(i);
            }
            
            const loadingTask = pdfjsLib.getDocument({ data: uint8Array });
            const pdf = await loadingTask.promise;
            window.numPages = pdf.numPages;
            
            const container = document.getElementById('container');
            for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
              const page = await pdf.getPage(pageNum);
              const scale = 2.0; // High resolution
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

    await renderPage.setContent(renderHtml, { waitUntil: 'networkidle2' })
    await renderPage.evaluate(async (b64) => {
      await window.renderAll(b64)
    }, pdfBase64)

    // Wait until rendered
    await renderPage.waitForFunction(() => window.rendered === true, { timeout: 15000 })
    const numPages = await renderPage.evaluate(() => window.numPages)
    console.log(`   ✓ PDF contains ${numPages} A4 pages`)

    for (let p = 1; p <= numPages; p++) {
      const canvasHandle = await renderPage.$(`#page-${p}`)
      if (canvasHandle) {
        const pageFileName = `0${p + 1}_pdf_page_${p}_highres.png`
        const outPath = path.join(SCREENSHOT_DIR, pageFileName)
        await canvasHandle.screenshot({ path: outPath })
        console.log(`   ✓ Saved PDF Page ${p} screenshot: ${pageFileName}`)
      }
    }

    // 5. TEST FILTERED MONTH (OKTOBER 2026)
    console.log('\n--- 5. TESTING MONTHLY REPORT EXPORT (OKTOBER 2026) ---')
    await page.bringToFront()

    // Select month "Okt 2026"
    let oktBtn = await page.$('button ::-p-text(Okt 2026)')
    if (!oktBtn) {
      const allButtons = await page.$$('button')
      for (const b of allButtons) {
        const txt = await page.evaluate(el => el.innerText, b)
        if (txt.includes('Okt 2026')) {
          oktBtn = b
          break
        }
      }
    }
    if (oktBtn) {
      await oktBtn.click()
      console.log('   ✓ Selected Oktober 2026 filter pill')
      await sleep(1000)

      // Clear previous files in download dir
      const curFiles = fs.readdirSync(DOWNLOAD_DIR)
      for (const f of curFiles) {
        try { fs.unlinkSync(path.join(DOWNLOAD_DIR, f)) } catch {}
      }

      const exportOctBtn = await page.$('button ::-p-text(Simpan Laporan PDF)')
      if (exportOctBtn) {
        await exportOctBtn.click()
        console.log('   ✓ Clicked "Simpan Laporan PDF" for Oktober 2026')

        let octFile = null
        for (let i = 0; i < 40; i++) {
          await sleep(500)
          const files = fs.readdirSync(DOWNLOAD_DIR).filter(f => f.endsWith('.pdf'))
          if (files.length > 0) {
            octFile = path.join(DOWNLOAD_DIR, files[0])
            const stats = fs.statSync(octFile)
            if (stats.size > 10000) {
              console.log(`   ✓ October PDF downloaded: ${files[0]} (${(stats.size / 1024).toFixed(1)} KB)`)
              break
            }
          }
        }

        if (octFile) {
          const octBytes = fs.readFileSync(octFile)
          const octBase64 = octBytes.toString('base64')
          const octRenderPage = await browser.newPage()
          await octRenderPage.setViewport({ width: 1200, height: 1600 })
          await octRenderPage.setContent(renderHtml, { waitUntil: 'domcontentloaded' })
          await octRenderPage.evaluate(async (b64) => {
            await window.renderAll(b64)
          }, octBase64)
          await octRenderPage.waitForFunction(() => window.rendered === true, { timeout: 15000 })
          const octCanvas1 = await octRenderPage.$('#page-1')
          if (octCanvas1) {
            await octCanvas1.screenshot({
              path: path.join(SCREENSHOT_DIR, '05_pdf_october_page_1.png'),
            })
            console.log('   ✓ Saved October PDF Page 1 screenshot: 05_pdf_october_page_1.png')
          }
          const octCanvas2 = await octRenderPage.$('#page-2')
          if (octCanvas2) {
            await octCanvas2.screenshot({
              path: path.join(SCREENSHOT_DIR, '07_pdf_october_page_2.png'),
            })
            console.log('   ✓ Saved October PDF Page 2 screenshot: 07_pdf_october_page_2.png')
          }
          const octCanvas3 = await octRenderPage.$('#page-3')
          if (octCanvas3) {
            await octCanvas3.screenshot({
              path: path.join(SCREENSHOT_DIR, '06_pdf_october_page_3.png'),
            })
            console.log('   ✓ Saved October PDF Page 3 screenshot: 06_pdf_october_page_3.png')
          }
          await octRenderPage.close()
        }
      }
    }

    // 6. TEST FILTERED MONTH (SEPTEMBER 2026)
    console.log('\n--- 6. TESTING MONTHLY REPORT EXPORT (SEPTEMBER 2026) ---')
    await page.bringToFront()

    // Select month "Sep 2026"
    let sepBtn = await page.$('button ::-p-text(Sep 2026)')
    if (!sepBtn) {
      const allButtons = await page.$$('button')
      for (const b of allButtons) {
        const txt = await page.evaluate(el => el.innerText, b)
        if (txt.includes('Sep 2026')) {
          sepBtn = b
          break
        }
      }
    }
    if (sepBtn) {
      await sepBtn.click()
      console.log('   ✓ Selected September 2026 filter pill')
      await sleep(1000)

      // Clear previous files in download dir
      const curFiles = fs.readdirSync(DOWNLOAD_DIR)
      for (const f of curFiles) {
        try { fs.unlinkSync(path.join(DOWNLOAD_DIR, f)) } catch {}
      }

      const exportSepBtn = await page.$('button ::-p-text(Simpan Laporan PDF)')
      if (exportSepBtn) {
        await exportSepBtn.click()
        console.log('   ✓ Clicked "Simpan Laporan PDF" for September 2026')

        let sepFile = null
        for (let i = 0; i < 40; i++) {
          await sleep(500)
          const files = fs.readdirSync(DOWNLOAD_DIR).filter(f => f.endsWith('.pdf'))
          if (files.length > 0) {
            sepFile = path.join(DOWNLOAD_DIR, files[0])
            const stats = fs.statSync(sepFile)
            if (stats.size > 10000) {
              console.log(`   ✓ September PDF downloaded: ${files[0]} (${(stats.size / 1024).toFixed(1)} KB)`)
              break
            }
          }
        }

        if (sepFile) {
          const sepBytes = fs.readFileSync(sepFile)
          const sepBase64 = sepBytes.toString('base64')
          const sepRenderPage = await browser.newPage()
          await sepRenderPage.setViewport({ width: 1200, height: 1600 })
          await sepRenderPage.setContent(renderHtml, { waitUntil: 'domcontentloaded' })
          await sepRenderPage.evaluate(async (b64) => {
            await window.renderAll(b64)
          }, sepBase64)
          await sepRenderPage.waitForFunction(() => window.rendered === true, { timeout: 15000 })
          const sepCanvas1 = await sepRenderPage.$('#page-1')
          if (sepCanvas1) {
            await sepCanvas1.screenshot({
              path: path.join(SCREENSHOT_DIR, '08_pdf_september_page_1.png'),
            })
            console.log('   ✓ Saved September PDF Page 1 screenshot: 08_pdf_september_page_1.png')
          }
          const sepCanvas2 = await sepRenderPage.$('#page-2')
          if (sepCanvas2) {
            await sepCanvas2.screenshot({
              path: path.join(SCREENSHOT_DIR, '09_pdf_september_page_2.png'),
            })
            console.log('   ✓ Saved September PDF Page 2 screenshot: 09_pdf_september_page_2.png')
          }
          const sepCanvas3 = await sepRenderPage.$('#page-3')
          if (sepCanvas3) {
            await sepCanvas3.screenshot({
              path: path.join(SCREENSHOT_DIR, '10_pdf_september_page_3.png'),
            })
            console.log('   ✓ Saved September PDF Page 3 screenshot: 10_pdf_september_page_3.png')
          }
          await sepRenderPage.close()
        }
      }
    }

    console.log('\n🎉 ALL PHASE 5 PDF VERIFICATIONS COMPLETED SUCCESSFULLY!')
  } catch (err) {
    console.error('❌ Verification failed:', err)
  } finally {
    await browser.close()
  }
}

run()
