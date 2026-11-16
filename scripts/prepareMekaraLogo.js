import puppeteer from 'puppeteer-core'
import path from 'path'
import fs from 'fs'

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
const LOGO_SRC = 'C:/Users/haxim/.gemini/antigravity/brain/47654856-1cc5-4831-8489-f0d17b9c4395/.user_uploaded/media_1794685504101_de3c2e5b.jpg'
const DEST_DIR = 'C:/SULAM/wanita-niaga-ai/public/images'

async function processLogo() {
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  })

  try {
    const page = await browser.newPage()
    const imgBase64 = fs.readFileSync(LOGO_SRC).toString('base64')
    const imgSrc = `data:image/jpeg;base64,${imgBase64}`

    await page.setContent(`
      <!DOCTYPE html>
      <html>
        <head><style>body { margin: 0; background: transparent; }</style></head>
        <body>
          <img id="raw-img" src="${imgSrc}" />
          <canvas id="c-full"></canvas>
          <canvas id="c-symbol"></canvas>
        </body>
      </html>
    `)

    await page.waitForSelector('#raw-img')

    const result = await page.evaluate(async () => {
      const img = document.getElementById('raw-img')
      await img.decode()

      const w = img.naturalWidth
      const h = img.naturalHeight

      // Create offscreen canvas for analyzing pixels
      const canvas = document.createElement('canvas')
      canvas.width = w
      canvas.height = h
      const ctx = canvas.getContext('2d', { willReadFrequently: true })
      ctx.drawImage(img, 0, 0)

      const imgData = ctx.getImageData(0, 0, w, h)
      const data = imgData.data

      // Sample background color from 4 corners
      const cornerR = (data[0] + data[(w - 1) * 4] + data[(h - 1) * w * 4] + data[(h * w - 1) * 4]) / 4
      const cornerG = (data[1] + data[(w - 1) * 4 + 1] + data[(h - 1) * w * 4 + 1] + data[(h * w - 1) * 4 + 1]) / 4
      const cornerB = (data[2] + data[(w - 1) * 4 + 2] + data[(h - 1) * w * 4 + 2] + data[(h * w - 1) * 4 + 2]) / 4

      console.log('Background sampled:', cornerR, cornerG, cornerB)

      // Find bounding box of foreground (non-background pixels)
      let minX = w, maxX = 0, minY = h, maxY = 0
      let symbolMaxX = 0 // boundary between butterfly symbol and wordmark

      const colorDist = (r, g, b) => {
        return Math.sqrt((r - cornerR) ** 2 + (g - cornerG) ** 2 + (b - cornerB) ** 2)
      }

      for (let y = 0; y < h; y++) {
        for (let x = 0; x < w; x++) {
          const idx = (y * w + x) * 4
          const r = data[idx]
          const g = data[idx + 1]
          const b = data[idx + 2]

          const dist = colorDist(r, g, b)
          if (dist > 25) { // Foreground pixel
            if (x < minX) minX = x
            if (x > maxX) maxX = x
            if (y < minY) minY = y
            if (y > maxY) maxY = y
          }
        }
      }

      console.log('Foreground bounds:', { minX, maxX, minY, maxY })

      // Make background transparent using smooth alpha feathering
      for (let i = 0; i < data.length; i += 4) {
        const r = data[i]
        const g = data[i + 1]
        const b = data[i + 2]
        const dist = colorDist(r, g, b)

        if (dist <= 18) {
          data[i + 3] = 0 // fully transparent
        } else if (dist < 38) {
          // Feather edge
          const alphaFactor = (dist - 18) / (38 - 18)
          data[i + 3] = Math.round(255 * alphaFactor)
        }
      }

      ctx.putImageData(imgData, 0, 0)

      // Crop full logo with generous clean padding
      const pad = 12
      const cropX = Math.max(0, minX - pad)
      const cropY = Math.max(0, minY - pad)
      const cropW = Math.min(w - cropX, (maxX - minX) + pad * 2)
      const cropH = Math.min(h - cropY, (maxY - minY) + pad * 2)

      const fullCanvas = document.getElementById('c-full')
      fullCanvas.width = cropW
      fullCanvas.height = cropH
      const fullCtx = fullCanvas.getContext('2d')
      fullCtx.drawImage(canvas, cropX, cropY, cropW, cropH, 0, 0, cropW, cropH)

      // Find the gap between butterfly symbol and 'M' in Mekara to isolate symbol
      // Scan column density between minX and minX + (maxX - minX)*0.45
      const searchEnd = Math.round(minX + (maxX - minX) * 0.45)
      let minColDensity = Infinity
      let splitCol = Math.round(minX + (maxX - minX) * 0.3)

      for (let x = Math.round(minX + (maxX - minX) * 0.2); x < searchEnd; x++) {
        let count = 0
        for (let y = minY; y <= maxY; y++) {
          const idx = (y * w + x) * 4
          if (data[idx + 3] > 40) count++
        }
        if (count < minColDensity) {
          minColDensity = count
          splitCol = x
        }
      }

      // Crop standalone butterfly symbol (square proportion)
      const symbolW = splitCol - minX
      const symbolH = maxY - minY
      const symbolSize = Math.max(symbolW, symbolH) + pad * 2

      const symbolCanvas = document.getElementById('c-symbol')
      symbolCanvas.width = symbolSize
      symbolCanvas.height = symbolSize
      const symbolCtx = symbolCanvas.getContext('2d')

      const symOffsetX = Math.round((symbolSize - symbolW) / 2)
      const symOffsetY = Math.round((symbolSize - symbolH) / 2)

      symbolCtx.drawImage(
        canvas,
        minX, minY, symbolW, symbolH,
        symOffsetX, symOffsetY, symbolW, symbolH
      )

      return {
        fullDataUrl: fullCanvas.toDataURL('image/png'),
        symbolDataUrl: symbolCanvas.toDataURL('image/png'),
        w: cropW,
        h: cropH,
        symbolSize,
      }
    })

    // Save full logo PNG
    const fullBuffer = Buffer.from(result.fullDataUrl.split(',')[1], 'base64')
    fs.writeFileSync(path.join(DEST_DIR, 'mekara-logo.png'), fullBuffer)
    console.log(`Saved mekara-logo.png: ${result.w}x${result.h}`)

    // Save symbol PNG
    const symbolBuffer = Buffer.from(result.symbolDataUrl.split(',')[1], 'base64')
    fs.writeFileSync(path.join(DEST_DIR, 'mekara-symbol.png'), symbolBuffer)
    fs.writeFileSync('C:/SULAM/wanita-niaga-ai/public/favicon.png', symbolBuffer)
    console.log(`Saved mekara-symbol.png and favicon.png: ${result.symbolSize}x${result.symbolSize}`)

    // Also copy original full logo as mekara-logo-original.jpg
    fs.copyFileSync(LOGO_SRC, path.join(DEST_DIR, 'mekara-logo-original.jpg'))

    console.log('Logo assets processed successfully!')
  } finally {
    await browser.close()
  }
}

processLogo().catch(console.error)
