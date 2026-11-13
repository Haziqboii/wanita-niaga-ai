import puppeteer from 'puppeteer-core'
import path from 'node:path'
import fs from 'node:fs'

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
const OUTPUT_DIR = 'C:\\SULAM\\wanita-niaga-ai\\screenshots'
const BASE_URL = 'http://localhost:5173'

async function run() {
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  })

  const page = await browser.newPage()
  await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true })
  await page.goto(BASE_URL, { waitUntil: 'networkidle2' })

  // Let's test different CSS variations by injecting styles on the live page
  const variations = [
    {
      id: 'var1_bottom_h520',
      desc: 'bg-bottom, height 520px',
      css: `
        .sm\\:hidden.absolute {
          background-position: center bottom !important;
          background-size: 100% auto !important;
        }
        .relative.z-10.flex.flex-col {
          height: 520px !important;
        }
      `
    },
    {
      id: 'var2_bottom_h580',
      desc: 'bg-bottom, height 580px',
      css: `
        .sm\\:hidden.absolute {
          background-position: center bottom !important;
          background-size: 100% auto !important;
        }
        .relative.z-10.flex.flex-col {
          height: 580px !important;
        }
      `
    },
    {
      id: 'var3_bottom_h640',
      desc: 'bg-bottom, height 640px',
      css: `
        .sm\\:hidden.absolute {
          background-position: center bottom !important;
          background-size: 100% auto !important;
        }
        .relative.z-10.flex.flex-col {
          height: 640px !important;
        }
      `
    },
    {
      id: 'var4_bottom_right_scale',
      desc: 'bg-bottom, scale 85%, height 490px',
      css: `
        .sm\\:hidden.absolute {
          background-position: right -15px bottom 0px !important;
          background-size: 85% auto !important;
        }
        .relative.z-10.flex.flex-col {
          height: 490px !important;
        }
      `
    },
    {
      id: 'var5_bottom_contain',
      desc: 'bg-contain bg-bottom, height 520px',
      css: `
        .sm\\:hidden.absolute {
          background-position: center bottom !important;
          background-size: contain !important;
        }
        .relative.z-10.flex.flex-col {
          height: 520px !important;
        }
      `
    },
    {
      id: 'var6_clean_pro',
      desc: 'Clean Pro: text compact + bg-bottom 100% + height 560px',
      css: `
        .sm\\:hidden.absolute {
          background-position: center bottom !important;
          background-size: 100% auto !important;
        }
        .relative.z-10.flex.flex-col {
          height: 560px !important;
          padding: 20px 18px !important;
        }
      `
    }
  ]

  for (const v of variations) {
    await page.reload({ waitUntil: 'networkidle2' })
    await page.addStyleTag({ content: v.css })
    await new Promise(r => setTimeout(r, 400))
    const outPath = path.join(OUTPUT_DIR, `live_${v.id}.png`)
    await page.screenshot({ path: outPath, fullPage: false })
    console.log(`Saved ${outPath}`)
  }

  await browser.close()
  console.log('All variations captured successfully!')
}

run().catch(console.error)
