import puppeteer from 'puppeteer-core'
import path from 'node:path'
import fs from 'node:fs'

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
const BASE_URL = 'http://localhost:5173'
const EXCEL_FILE = 'C:/Users/haxim/.gemini/antigravity/brain/47654856-1cc5-4831-8489-f0d17b9c4395/.user_uploaded/media_1794552149075_f19d66e7.xlsx'

async function run() {
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  })

  try {
    const page = await browser.newPage()
    page.on('dialog', async (d) => {
      console.log('Dialog:', d.message())
      await d.accept()
    })

    await page.goto(BASE_URL, { waitUntil: 'networkidle2' })
    await new Promise(r => setTimeout(r, 500))

    // Click upload
    const uploadBtn = await page.$('button ::-p-text(Muat Naik Excel / CSV)')
    if (!uploadBtn) {
      console.error('Cannot find upload button')
      return
    }
    await uploadBtn.click()
    await new Promise(r => setTimeout(r, 500))

    // Upload file
    const fileInput = await page.$('input[type="file"]')
    await fileInput.uploadFile(EXCEL_FILE)
    await new Promise(r => setTimeout(r, 1500))

    // Check if Maklumat Tambahan exists
    const bodyText = await page.evaluate(() => document.body.innerText)
    console.log('Upload page has "Maklumat Tambahan":', bodyText.includes('Maklumat Tambahan'))
    console.log('Upload page has "Kolum Tambahan Dikesan":', bodyText.includes('Kolum Tambahan Dikesan'))

    // Click Jana Laporan Jualan
    const submitBtn = await page.$('button ::-p-text(Jana Laporan Jualan)')
    await submitBtn.click()
    await new Promise(r => setTimeout(r, 1000))

    // On Dashboard, open Analisis Lanjut
    const advBtn = await page.$('button ::-p-text(Analisis Lanjut)')
    if (advBtn) {
      await advBtn.click()
      await new Promise(r => setTimeout(r, 500))
    }

    const dashText = await page.evaluate(() => document.body.innerText)
    console.log('Dashboard has "Pecahan Jualan Mengikut Kategori":', dashText.includes('Pecahan Jualan Mengikut Kategori'))
    console.log('Dashboard has "Pecahan Jualan Mengikut Kaedah Bayaran":', dashText.includes('Pecahan Jualan Mengikut Kaedah Bayaran'))
    console.log('Dashboard has "Kategori Dikesan":', dashText.includes('Kategori Dikesan'))
    console.log('Dashboard has "Bayaran Dikesan":', dashText.includes('Bayaran Dikesan'))

    await page.screenshot({ path: 'screenshots/debug_dashboard.png', fullPage: true })
    console.log('Screenshot saved to screenshots/debug_dashboard.png')
  } catch (err) {
    console.error('Error:', err)
  } finally {
    await browser.close()
  }
}

run()
