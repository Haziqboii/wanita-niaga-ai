import puppeteer from 'puppeteer-core'
import path from 'node:path'

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
const OUTPUT_DIR = 'C:\\SULAM\\wanita-niaga-ai\\screenshots\\fullscreen_landing'

async function testResponsiveLanding() {
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: true,
    args: ['--no-sandbox'],
  })
  const page = await browser.newPage()

  const viewports = [
    { name: 'resp_320px', width: 320, height: 600, isMobile: true },
    { name: 'resp_360px', width: 360, height: 740, isMobile: true },
    { name: 'resp_390px', width: 390, height: 844, isMobile: true },
    { name: 'resp_430px', width: 430, height: 932, isMobile: true },
    { name: 'resp_768px', width: 768, height: 1024, isMobile: false },
    { name: 'resp_1280px', width: 1280, height: 800, isMobile: false },
  ]

  for (const vp of viewports) {
    await page.setViewport({ width: vp.width, height: vp.height, isMobile: vp.isMobile })
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
            background: linear-gradient(180deg, #F8CBDF 0%, #FBE6F0 45%, #FCD1E2 100%);
            display: flex;
            align-items: center;
            justify-content: center;
          }
          .ambient {
            display: none;
            position: absolute;
            inset: 0;
            overflow: hidden;
            opacity: 0.35;
            pointer-events: none;
          }
          .ambient img {
            width: 100%;
            height: 100%;
            object-fit: cover;
            filter: blur(48px);
            transform: scale(1.25);
          }
          .artwork-container {
            position: relative;
            z-index: 10;
            width: 100%;
            height: 100%;
            display: flex;
            align-items: center;
            justify-content: center;
          }
          .main-img {
            width: 100%;
            height: 100%;
            object-fit: cover;
            object-position: 15% center;
            display: block;
          }
          @media (min-width: 640px) {
            .ambient { display: block; }
            .main-img {
              width: auto;
              max-width: 100%;
              max-height: 100vh;
              object-fit: contain;
              object-position: center bottom;
              filter: drop-shadow(0 4px 20px rgba(190, 30, 114, 0.08));
            }
          }
          .indicator {
            position: absolute;
            bottom: 16px;
            left: 50%;
            transform: translateX(-50%);
            z-index: 20;
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 2px;
            color: #9D175B;
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
            font-size: 13px;
            font-weight: 700;
            letter-spacing: 0.02em;
            cursor: pointer;
            background: rgba(255, 255, 255, 0.4);
            backdrop-filter: blur(8px);
            padding: 6px 14px;
            border-radius: 9999px;
            border: 1px solid rgba(255, 255, 255, 0.6);
            box-shadow: 0 2px 8px rgba(190, 30, 114, 0.08);
          }
          .indicator svg {
            width: 15px;
            height: 15px;
            stroke: #9D175B;
            stroke-width: 2.5;
            fill: none;
          }
          @media (min-width: 640px) {
            .indicator {
              bottom: 24px;
              font-size: 14px;
              padding: 8px 18px;
            }
          }
        </style>
      </head>
      <body>
        <div class="landing">
          <div class="ambient">
            <img src="http://localhost:5173/images/landing-hero.png">
          </div>
          <div class="artwork-container">
            <img class="main-img" src="http://localhost:5173/images/landing-hero.png">
          </div>
          <div class="indicator">
            <span>Skrol untuk mula</span>
            <div style="display:flex;flex-direction:column;align-items:center;margin-top:-3px;">
              <svg viewBox="0 0 24 24"><polyline points="6 9 12 15 18 9"/></svg>
              <svg viewBox="0 0 24 24" style="margin-top:-8px;opacity:0.6;"><polyline points="6 9 12 15 18 9"/></svg>
            </div>
          </div>
        </div>
      </body>
      </html>
    `
    await page.setContent(html)
    await page.screenshot({ path: path.join(OUTPUT_DIR, `${vp.name}.png`) })
    console.log(`Rendered ${vp.name}`)
  }

  await browser.close()
}

testResponsiveLanding()
