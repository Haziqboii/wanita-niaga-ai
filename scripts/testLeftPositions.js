import puppeteer from 'puppeteer-core'
import path from 'node:path'

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
const OUTPUT_DIR = 'C:\\SULAM\\wanita-niaga-ai\\screenshots\\fullscreen_landing'

async function testLeftPositions() {
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: true,
    args: ['--no-sandbox'],
  })
  const page = await browser.newPage()

  const positions = ['left center', '10% center', '15% center', '20% center']

  for (const pos of positions) {
    const slug = pos.replace(/[% ]/g, '_')
    // test on 390x844 and 430x932
    for (const [w, h] of [[390, 844], [430, 932], [320, 600]]) {
      await page.setViewport({ width: w, height: h, isMobile: true })
      const html = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
            * { box-sizing: border-box; margin: 0; padding: 0; }
            body, html { width: 100%; height: 100%; overflow: hidden; background: #FCD1E2; }
            .landing {
              position: relative;
              width: 100vw;
              height: 100vh;
              overflow: hidden;
            }
            .img {
              width: 100%;
              height: 100%;
              object-fit: cover;
              object-position: ${pos};
              display: block;
            }
            .indicator {
              position: absolute;
              bottom: 16px;
              left: 50%;
              transform: translateX(-50%);
              display: flex;
              flex-direction: column;
              align-items: center;
              color: #9D175B;
              font-family: sans-serif;
              font-size: 13px;
              font-weight: 700;
              text-shadow: 0 1px 2px rgba(255,255,255,0.8);
            }
          </style>
        </head>
        <body>
          <div class="landing">
            <img class="img" src="http://localhost:5173/images/landing-hero.png">
            <div class="indicator">
              <span>Skrol untuk mula</span>
              <span>⌄</span>
            </div>
          </div>
        </body>
        </html>
      `
      await page.setContent(html)
      await page.screenshot({ path: path.join(OUTPUT_DIR, `pos_${slug}_${w}x${h}.png`) })
    }
  }

  await browser.close()
  console.log('Done testing left positions!')
}

testLeftPositions()
