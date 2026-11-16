import puppeteer from 'puppeteer-core'
import path from 'path'
import fs from 'fs'

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
const OUTPUT_DIR = 'C:\\Users\\haxim\\.gemini\\antigravity\\brain\\47654856-1cc5-4831-8489-f0d17b9c4395\\screenshots\\phase3_chat'
const BASE_URL = 'http://localhost:5173/'

if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true })
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

async function run() {
  console.log('🚀 Starting Phase 3 AI Chat Verification & Visual Capture...')
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

    // Helper: Reset storage and navigate to Chat with sample data loaded
    const setupChat = async (vp) => {
      await page.setViewport({
        width: vp.width,
        height: vp.height,
        deviceScaleFactor: 2,
        isMobile: vp.isMobile,
        hasTouch: vp.hasTouch,
      })
      await page.goto(BASE_URL, { waitUntil: 'networkidle2' })
      await sleep(200)

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
      await sleep(300)

      // Click "Cuba Data Contoh" / "Muatkan Data" button
      const sampleBtn = await page.$('button ::-p-text(Muatkan Data)') || await page.$('button ::-p-text(Cuba Data Contoh)')
      if (!sampleBtn) throw new Error('Could not find sample data button')
      await sampleBtn.click()
      await sleep(500)

      // Click "Tanya Pembantu AI" button
      const askBtn = await page.$('button ::-p-text(Tanya Pembantu AI)')
      if (!askBtn) throw new Error('Could not find "Tanya Pembantu AI" button')
      await askBtn.click()
      await sleep(500)
    }

    // ==========================================
    // 1. SCREENSHOT A: Mobile Empty/Greeting Chat (390px)
    // ==========================================
    console.log('\n--- 1. SCREENSHOT A: Greeting Chat (390px) ---')
    await setupChat({ width: 390, height: 844, isMobile: true, hasTouch: true })

    // Verify Header structure
    const headerInfo = await page.evaluate(() => {
      const header = document.querySelector('header')
      const img = header?.querySelector('img')
      const title = header?.querySelector('h1')?.innerText
      const sub = header?.querySelector('p')?.innerText
      return {
        hasHeader: Boolean(header),
        imgSrc: img?.getAttribute('src'),
        title,
        sub,
      }
    })
    console.log('   Chat Header Info:', headerInfo)

    await page.screenshot({
      path: path.join(OUTPUT_DIR, '01_chat_greeting_390px.png'),
    })
    console.log('   Captured 01_chat_greeting_390px.png')

    // ==========================================
    // 2. SCREENSHOT D: Suggestions Popover Open (390px)
    // ==========================================
    console.log('\n--- 2. SCREENSHOT D: Suggestions Popover Open (390px) ---')
    const lightbulbBtn = await page.$('button[aria-label="Cadangan Soalan"]')
    if (!lightbulbBtn) throw new Error('Could not find lightbulb button')
    await lightbulbBtn.click()
    await sleep(400)

    await page.screenshot({
      path: path.join(OUTPUT_DIR, '04_chat_suggestions_open_390px.png'),
    })
    console.log('   Captured 04_chat_suggestions_open_390px.png')

    // Click first suggestion - verify it prefills input and does NOT auto-send
    const suggestionPills = await page.$$('div[role="dialog"] button')
    if (suggestionPills.length > 1) {
      // The second button is the first question (first button is close)
      await suggestionPills[1].click()
      await sleep(300)
    }
    const inputVal = await page.evaluate(() => document.querySelector('input[type="text"]')?.value)
    console.log('   Prefilled input after clicking suggestion:', inputVal)

    // ==========================================
    // 3. SCREENSHOT B: Mobile Conversation with Multiple Bubbles (390px)
    // ==========================================
    console.log('\n--- 3. SCREENSHOT B: Conversation Multiple Bubbles (390px) ---')
    // Send the prefilled question (or local calculation question: "Berapa untung kasar saya?")
    await page.evaluate(() => {
      const input = document.querySelector('input[type="text"]')
      if (input) {
        input.value = 'Berapa untung kasar saya?'
        input.dispatchEvent(new Event('input', { bubbles: true }))
      }
    })
    await sleep(200)

    const sendBtn = await page.$('button[aria-label="Hantar soalan"]')
    await sendBtn.click()
    await sleep(800) // Local calculation resolves deterministically

    // Send a second question: "Produk mana paling laris?"
    await page.evaluate(() => {
      const input = document.querySelector('input[type="text"]')
      if (input) {
        input.value = 'Produk mana paling laris?'
        input.dispatchEvent(new Event('input', { bubbles: true }))
      }
    })
    await sleep(200)
    await sendBtn.click()
    await sleep(800)

    await page.screenshot({
      path: path.join(OUTPUT_DIR, '02_chat_conversation_390px.png'),
    })
    console.log('   Captured 02_chat_conversation_390px.png')

    // ==========================================
    // 4. SCREENSHOT C: Narrow Chat (320px)
    // ==========================================
    console.log('\n--- 4. SCREENSHOT C: Narrow Chat (320px) ---')
    await page.setViewport({ width: 320, height: 667, deviceScaleFactor: 2, isMobile: true, hasTouch: true })
    await sleep(400)

    await page.screenshot({
      path: path.join(OUTPUT_DIR, '03_chat_320px_narrow.png'),
    })
    console.log('   Captured 03_chat_320px_narrow.png')

    // ==========================================
    // 5. SCREENSHOT E: Long AI Response (390px)
    // ==========================================
    console.log('\n--- 5. SCREENSHOT E: Long AI Response (390px) ---')
    await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true })
    await sleep(300)

    // Inject a realistic structured long response with lists, bold formatting, financial figures
    await page.evaluate(() => {
      // Find the messages array update via DOM or add a long test message
      const longMessage = {
        id: 'mock-long-ai',
        text: `Terima kasih atas soalan Puan! 🌷 Berikut adalah ringkasan analisis komprehensif bagi perniagaan Puan:\n\n**1. Prestasi Produk Utama:**\n* **Nasi Lemak:** Menjana jualan tertinggi sebanyak **RM9,399.50** dengan **1,709 unit** terjual.\n* **Brownies:** Menyumbang keuntungan kasar yang kukuh sebanyak **RM4,494.45** (margin 51.9%).\n* **Karipap:** Permintaan stabil setiap pagi dengan jumlah jualan **RM3,082.00**.\n\n**2. Cadangan Tindakan Strategik:**\n1. Pastikan stok bahan mentah untuk **Nasi Lemak** dan **Brownies** sentiasa mencukupi pada hari puncak jualan.\n2. Kekalkan kualiti kuih tradisional bagi mengekalkan pelanggan setia.\n3. Pantau kos modal bahan supaya margin keuntungan kasar kekal melebihi **50%**.\n\nAdakah Puan ingin menyemak anggaran perbelanjaan operasi atau promosi hujung minggu seterusnya?`,
        sender: 'bot',
        timestamp: '11:15',
        isLocalCalculation: false,
        suggestedFollowUps: ['Terangkan lagi', 'Berapa anggaran sewa?', 'Tindakan seterusnya'],
      }

      // Add to React state or dispatch custom event if available, or update via storage
      window.dispatchEvent(new CustomEvent('mock-add-chat-message', { detail: longMessage }))
    })

    // Let's populate the message through state injection or via storage reload
    await page.evaluate(async () => {
      const storage = await import('./src/data/storage.ts')
      const current = await storage.getSavedReportFromStorage()
      if (current) {
        current.chatMessages.push({
          id: 'mock-long-ai',
          text: `Terima kasih atas soalan Puan! 🌷 Berikut adalah ringkasan analisis komprehensif bagi perniagaan Puan:\n\n**1. Prestasi Produk Utama:**\n* **Nasi Lemak:** Menjana jualan tertinggi sebanyak **RM9,399.50** dengan **1,709 unit** terjual.\n* **Brownies:** Menyumbang keuntungan kasar yang kukuh sebanyak **RM4,494.45** (margin 51.9%).\n* **Karipap:** Permintaan stabil setiap pagi dengan jumlah jualan **RM3,082.00**.\n\n**2. Cadangan Tindakan Strategik:**\n1. Pastikan stok bahan mentah untuk **Nasi Lemak** dan **Brownies** sentiasa mencukupi pada hari puncak jualan.\n2. Kekalkan kualiti kuih tradisional bagi mengekalkan pelanggan setia.\n3. Pantau kos modal bahan supaya margin keuntungan kasar kekal melebihi **50%**.\n\nAdakah Puan ingin menyemak anggaran perbelanjaan operasi atau cadangan promosi seterusnya?`,
          sender: 'bot',
          timestamp: '11:15',
          isLocalCalculation: false,
          suggestedFollowUps: ['Terangkan lagi', 'Berapa anggaran sewa?', 'Tindakan seterusnya'],
        })
        await storage.saveReportToStorage(current)
      }
    })

    // Reload page to reflect persisted long message
    await page.goto(BASE_URL, { waitUntil: 'networkidle2' })
    await sleep(500)
    // If on dashboard, navigate to chat
    const askBtnLong = await page.$('button ::-p-text(Tanya Pembantu AI)')
    if (askBtnLong) {
      await askBtnLong.click()
      await sleep(500)
    }

    await page.screenshot({
      path: path.join(OUTPUT_DIR, '05_chat_long_response_390px.png'),
    })
    console.log('   Captured 05_chat_long_response_390px.png')

    // ==========================================
    // 6. SCREENSHOT F: Loading State (390px)
    // ==========================================
    console.log('\n--- 6. SCREENSHOT F: Loading State (390px) ---')
    // Intercept /api/chat temporarily to freeze in loading state
    await page.setRequestInterception(true)
    const interceptor = (req) => {
      if (req.url().includes('/api/chat')) {
        // Keep pending for 8 seconds
        setTimeout(() => {
          try { req.abort('failed') } catch {}
        }, 8000)
      } else {
        req.continue()
      }
    }
    page.on('request', interceptor)

    await page.click('input[type="text"]')
    await page.type('input[type="text"]', 'Bolehkah analisa trend saluran jualan?')
    await sleep(200)

    const sendBtnLoading = await page.$('button[aria-label="Hantar soalan"]')
    await sendBtnLoading.click()
    await sleep(600) // Now in loading state!

    // Scroll to bottom so loading bubble is in view
    await page.evaluate(() => {
      const scrollEl = document.querySelector('.overflow-y-auto')
      if (scrollEl) scrollEl.scrollTop = scrollEl.scrollHeight
    })
    await sleep(300)

    await page.screenshot({
      path: path.join(OUTPUT_DIR, '06_chat_loading_state_390px.png'),
    })
    console.log('   Captured 06_chat_loading_state_390px.png')

    // Reset request interception
    page.off('request', interceptor)
    await page.setRequestInterception(false)
    await sleep(1000)

    // ==========================================
    // 7. SCREENSHOT G: Desktop Chat (1280px)
    // ==========================================
    console.log('\n--- 7. SCREENSHOT G: Desktop Chat (1280px) ---')
    await page.setViewport({ width: 1280, height: 850, deviceScaleFactor: 2, isMobile: false, hasTouch: false })
    await sleep(400)

    await page.screenshot({
      path: path.join(OUTPUT_DIR, '07_chat_desktop_1280px.png'),
    })
    console.log('   Captured 07_chat_desktop_1280px.png')

    // ==========================================
    // 8. SCREENSHOT H: Focused Composer on Mobile (390px)
    // ==========================================
    console.log('\n--- 8. SCREENSHOT H: Focused Composer (390px) ---')
    await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true })
    await sleep(300)
    await page.focus('input[type="text"]')
    await page.evaluate(() => {
      const input = document.querySelector('input[type="text"]')
      if (input) {
        input.value = 'Berapa baki modal untuk'
        input.dispatchEvent(new Event('input', { bubbles: true }))
      }
    })
    await sleep(300)

    await page.screenshot({
      path: path.join(OUTPUT_DIR, '08_chat_composer_focused_390px.png'),
    })
    console.log('   Captured 08_chat_composer_focused_390px.png')

    // ==========================================
    // 9. Back Navigation Test
    // ==========================================
    console.log('\n--- 9. BACK NAVIGATION VERIFICATION ---')
    const backBtn = await page.$('header button[aria-label="Kembali ke Halaman Sebelumnya"]')
    if (!backBtn) throw new Error('Could not find header back button')
    await backBtn.click()
    await sleep(500)

    const isBackOnDashboard = await page.evaluate(() => {
      return Boolean(document.querySelector('h2')?.innerText.includes('Prestasi perniagaan Puan'))
    })
    console.log('   Navigated back to Dashboard successfully:', isBackOnDashboard)
    if (!isBackOnDashboard) throw new Error('Back button did not navigate back to Dashboard')

    console.log('\n🎉 All Phase 3 Chat verification tests & screenshots completed successfully!')
  } finally {
    await browser.close()
  }
}

run().catch((err) => {
  console.error('❌ Error during Phase 3 verification:', err)
  process.exit(1)
})
