import puppeteer from 'puppeteer-core'

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'

async function inspectVisibleCrop() {
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: true,
  })
  const page = await browser.newPage()
  await page.setViewport({ width: 390, height: 844 })

  await page.setContent(`
    <!DOCTYPE html>
    <html>
      <head>
        <style>
          body { margin: 0; padding: 16px; background: #fff; }
          .card {
            width: 358px;
            height: 520px;
            border-radius: 28px;
            border: 1px solid #ccc;
            background: url('file:///C:/SULAM/wanita-niaga-ai/src/assets/hero-banner-mobile.jpg') center top / 100% auto no-repeat;
          }
        </style>
      </head>
      <body>
        <div class="card"></div>
      </body>
    </html>
  `)
  await browser.close()
}

inspectVisibleCrop()
