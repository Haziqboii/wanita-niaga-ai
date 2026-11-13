import puppeteer from 'puppeteer-core'

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
const BASE_URL = 'http://localhost:5173'

async function debugEdit() {
  const browser = await puppeteer.launch({ executablePath: CHROME_PATH, headless: true })
  const page = await browser.newPage()
  await page.setViewport({ width: 390, height: 844 })
  await page.setRequestInterception(true)
  page.on('request', (r) => {
    if (r.url().includes('/api/extract')) {
      r.respond({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          hasSufficientData: true,
          clarificationMessage: '',
          operatingExpenses: null,
          records: [
            { produk: 'Karipap', kuantiti: 50, harga: 2.0, kos: 0.8, tarikh: null, saluran: 'Booth' },
            { produk: 'Brownies', kuantiti: 20, harga: 8.0, kos: 4.0, tarikh: null, saluran: 'Booth' },
          ],
        }),
      })
    } else r.continue()
  })

  await page.goto(BASE_URL)
  const startBtn = await page.$('button ::-p-text(Mula dengan AI)')
  await startBtn.click()
  await new Promise(r => setTimeout(r, 400))
  const exBtn = await page.$('button ::-p-text(Cuba ayat contoh)')
  await exBtn.click()
  await new Promise(r => setTimeout(r, 300))
  const extractBtn = await page.$('button ::-p-text(Susun Jualan dengan AI)')
  await extractBtn.click()
  await new Promise(r => setTimeout(r, 600))
  await page.waitForSelector('button ::-p-text(Sahkan & Jana Laporan)')

  // Click edit on first record
  const editBtn = await page.$('button[aria-label="Edit Karipap"]')
  await editBtn.click()
  await new Promise(r => setTimeout(r, 400))

  const qtyInputs = await page.$$('input[type="number"]')
  
  // Select all using Control+A
  await qtyInputs[0].click()
  await page.keyboard.down('Control')
  await page.keyboard.press('KeyA')
  await page.keyboard.up('Control')
  await page.keyboard.press('Backspace')
  await page.keyboard.type('60')
  await new Promise(r => setTimeout(r, 200))

  const valAfter = await page.evaluate(el => el.value, qtyInputs[0])
  console.log('valAfter:', valAfter)

  const saveEditBtn = await page.$('button ::-p-text(Simpan Pembetulan)')
  await saveEditBtn.click()
  await new Promise(r => setTimeout(r, 400))

  const text = await page.evaluate(() => document.body.innerText)
  console.log('Includes RM280.00 (60*2 + 20*8)?', text.includes('RM280.00'))

  await browser.close()
}

debugEdit()
