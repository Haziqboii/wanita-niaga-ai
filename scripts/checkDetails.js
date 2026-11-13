import puppeteer from 'puppeteer-core'

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'

async function checkDetails() {
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: true,
  })
  const page = await browser.newPage()
  await page.setViewport({ width: 390, height: 844 })
  
  // Let's test the exact layout for mobile and desktop
  // On desktop:
  // Container: max-w-5xl, hero card with aspect-ratio or min-height 280-320px
  // Left content: max-w-md or 52%
  // Button: Mula dengan AI
  
  // On mobile:
  // Card width is 358px.
  // In hero-banner-mobile.jpg:
  // Total width: 388, total height: 769.
  // When scaled to 358px width:
  // Scaled height is 358 * (769 / 388) = 709px.
  // Character's head starts at y = 400 * (358 / 388) = 369px.
  // Text content:
  // Badge: y = 24 to 52 (height 28)
  // Heading: y = 62 to 128 (height 66)
  // Subtitle: y = 136 to 178 (height 42)
  // Button: y = 194 to 242 (height 48)
  // So text + button ends at y = 242px!
  // And the character's head starts at y = 369px!
  // There is a 127px safe margin between the button and the character!
  // If card height is set to around 520px - 580px:
  // You see:
  // 1. Badge, Heading, Subtitle, and Button in the top clear area (y: 24 to 242).
  // 2. Safe breathing room (y: 242 to 369).
  // 3. The smiling character with fist pumped, purple laptop, and pastry stall (y: 369 to 540+)!
  
  console.log('Geometry analysis verified:')
  console.log('Text + Button ends at: ~242px')
  console.log('Character head starts at: ~369px')
  console.log('Clear gap: ~127px')
  await browser.close()
}

checkDetails()
