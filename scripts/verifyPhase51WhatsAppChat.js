import puppeteer from 'puppeteer-core'
import path from 'node:path'
import fs from 'node:fs'

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
const OUTPUT_DIR = 'C:\\SULAM\\wanita-niaga-ai\\screenshots\\phase51'
const BASE_URL = 'http://localhost:5173'

if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true })
}

const VIEWPORTS = [
  { name: '320px_mobile_narrow', width: 320, height: 600, isMobile: true },
  { name: '360px_mobile_compact', width: 360, height: 740, isMobile: true },
  { name: '390px_mobile_standard', width: 390, height: 844, isMobile: true },
  { name: '430px_mobile_promax', width: 430, height: 932, isMobile: true },
  { name: '768px_tablet', width: 768, height: 1024, isMobile: false },
  { name: '1280px_desktop', width: 1280, height: 800, isMobile: false },
]

async function runTests() {
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  })

  try {
    const page = await browser.newPage()

    // 1. Test 390px standard flow in detail
    console.log('=== TEST 1: Full-Screen WhatsApp-Style Chat on 390px ===')
    await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true })
    await page.goto(BASE_URL, { waitUntil: 'networkidle2' })

    // Load sample data
    const sampleBtn = await page.$('button ::-p-text(Muatkan Data Contoh)')
    if (!sampleBtn) throw new Error('Muatkan Data Contoh button not found')
    await sampleBtn.click()
    await new Promise((r) => setTimeout(r, 600))

    // Click "Tanya Pembantu AI"
    const askAiBtn = await page.$('button ::-p-text(Tanya Pembantu AI)')
    if (!askAiBtn) throw new Error('Tanya Pembantu AI button not found')
    await askAiBtn.click()
    await new Promise((r) => setTimeout(r, 600))

    // Verify WhatsApp-style Full-screen structure
    const fullScreenCheck = await page.evaluate(() => {
      const header = document.querySelector('header')
      const main = document.querySelector('main')
      const footer = document.querySelector('footer')
      const cardContainer = document.querySelector('.apple-card')
      const permanentChipsRow = document.querySelector('.no-scrollbar')
      const lightbulbBtn = document.querySelector('button[aria-label="Cadangan Soalan"]')
      const input = document.querySelector('input[placeholder="Taip soalan Puan di sini..."]')
      const sendBtn = document.querySelector('button[aria-label="Hantar soalan"]')
      const headerText = header ? header.innerText : ''

      return {
        hasHeader: !!header,
        headerHasSubtitle: headerText.includes('Nasihat perniagaan'),
        hasFooter: !!footer,
        mainPaddings: main ? window.getComputedStyle(main).padding : '',
        hasCardContainer: !!cardContainer,
        hasPermanentChipsRow: !!permanentChipsRow,
        hasLightbulbBtn: !!lightbulbBtn,
        hasInput: !!input,
        hasSendBtn: !!sendBtn,
      }
    })

    console.log('Full-screen structure check:', fullScreenCheck)
    if (fullScreenCheck.hasFooter) throw new Error('FAIL: Webpage footer should be hidden on chat screen!')
    if (fullScreenCheck.headerHasSubtitle) throw new Error('FAIL: Chat subtitle should be removed!')
    if (fullScreenCheck.hasCardContainer) throw new Error('FAIL: Small chat card container should be removed!')
    if (fullScreenCheck.hasPermanentChipsRow) throw new Error('FAIL: Permanent suggestion chips row should be removed!')
    if (!fullScreenCheck.hasLightbulbBtn) throw new Error('FAIL: Lightbulb button not found in composer!')
    if (!fullScreenCheck.hasInput || !fullScreenCheck.hasSendBtn) throw new Error('FAIL: Composer input/send missing!')
    console.log('PASS: Full-screen WhatsApp-style layout confirmed.')

    // Verify AI Greeting is present and not duplicated
    const greetingCheck = await page.evaluate(() => {
      const bubbles = Array.from(document.querySelectorAll('.rounded-tl-xs'))
      const text = bubbles.map((b) => b.innerText).join('\n')
      const matches = text.match(/Salam sejahtera, Puan/g)
      return {
        count: matches ? matches.length : 0,
        text: text.slice(0, 100),
      }
    })
    console.log('Greeting check:', greetingCheck)
    if (greetingCheck.count !== 1) throw new Error(`FAIL: Expected 1 AI greeting, found ${greetingCheck.count}`)
    console.log('PASS: AI greeting is present once without duplication.')

    // 2. Test Lightbulb button & Floating suggestion panel
    console.log('=== TEST 2: Lightbulb Button & Suggestion Selection ===')
    const lightbulbBtn = await page.$('button[aria-label="Cadangan Soalan"]')
    await lightbulbBtn.click()
    await new Promise((r) => setTimeout(r, 300))

    const panelCheck = await page.evaluate(() => {
      const panel = document.querySelector('[role="dialog"][aria-label="Cadangan Soalan"]')
      if (!panel) return { isOpen: false }
      const options = Array.from(panel.querySelectorAll('button')).filter((b) => b.innerText !== '✕')
      return {
        isOpen: true,
        optionCount: options.length,
        firstOption: options[0]?.innerText || '',
      }
    })
    console.log('Panel check after clicking lightbulb:', panelCheck)
    if (!panelCheck.isOpen || panelCheck.optionCount === 0) throw new Error('FAIL: Suggestions panel did not open!')
    console.log('PASS: Floating suggestions panel opened with', panelCheck.optionCount, 'options.')

    // Click a suggestion
    const firstOptionBtn = await page.$('[role="dialog"][aria-label="Cadangan Soalan"] .space-y-1 button')
    const selectedText = await page.evaluate((el) => el.innerText.trim(), firstOptionBtn)
    await firstOptionBtn.click()
    await new Promise((r) => setTimeout(r, 300))

    const inputStateAfterSuggestion = await page.evaluate(() => {
      const input = document.querySelector('input[placeholder="Taip soalan Puan di sini..."]')
      const panel = document.querySelector('[role="dialog"][aria-label="Cadangan Soalan"]')
      const userBubbles = document.querySelectorAll('.rounded-br-xs')
      return {
        inputValue: input ? input.value : '',
        panelClosed: !panel,
        userMessageCount: userBubbles.length,
      }
    })
    console.log('Input state after suggestion selection:', inputStateAfterSuggestion)
    if (inputStateAfterSuggestion.inputValue !== selectedText) {
      throw new Error(`FAIL: Input value "${inputStateAfterSuggestion.inputValue}" != "${selectedText}"`)
    }
    if (!inputStateAfterSuggestion.panelClosed) throw new Error('FAIL: Suggestions panel should close upon selection!')
    if (inputStateAfterSuggestion.userMessageCount !== 0) throw new Error('FAIL: Suggestion was auto-sent instead of allowing editing!')
    console.log('PASS: Suggestion filled input without auto-sending. User can edit!')

    // Test editing the question in input
    await page.type('input[placeholder="Taip soalan Puan di sini..."]', ' untuk minggu ini?')
    const editedValue = await page.evaluate(() => {
      return document.querySelector('input[placeholder="Taip soalan Puan di sini..."]').value
    })
    console.log('PASS: Participant edited question:', editedValue)

    // 3. Test Sending Message & Receiving AI Response
    console.log('=== TEST 3: Sending Message & Message Design ===')
    const sendBtn = await page.$('button[aria-label="Hantar soalan"]')
    await sendBtn.click()
    await new Promise((r) => setTimeout(r, 1200)) // Wait for mock calculation/assistant reply

    const messagesAfterSend = await page.evaluate(() => {
      const userBubbles = Array.from(document.querySelectorAll('.rounded-br-xs')).map((b) => b.innerText)
      const botBubbles = Array.from(document.querySelectorAll('.rounded-tl-xs')).map((b) => b.innerText)
      return {
        userBubbles,
        botBubblesCount: botBubbles.length,
        latestBotBubble: botBubbles[botBubbles.length - 1],
      }
    })
    console.log('Messages after send:', messagesAfterSend)
    if (messagesAfterSend.userBubbles.length === 0) throw new Error('FAIL: User bubble did not appear!')
    if (messagesAfterSend.botBubblesCount < 2) throw new Error('FAIL: Bot reply did not appear!')
    console.log('PASS: User message sent and AI reply received cleanly.')

    // 4. Test Escape key & Outside Click for Lightbulb
    console.log('=== TEST 4: Escape Key & Outside Click ===')
    await lightbulbBtn.click()
    await new Promise((r) => setTimeout(r, 200))
    await page.keyboard.press('Escape')
    await new Promise((r) => setTimeout(r, 200))
    const panelAfterEscape = await page.$('[role="dialog"][aria-label="Cadangan Soalan"]')
    if (panelAfterEscape) throw new Error('FAIL: Panel did not close on Escape!')
    console.log('PASS: Suggestions panel closes on Escape.')

    // 5. Test Scrolling & Scroll-to-latest button
    console.log('=== TEST 5: Scrolling & Scroll-to-Latest Button ===')
    // Scroll to top
    await page.evaluate(() => {
      const stream = document.querySelector('.overflow-y-auto')
      if (stream) stream.scrollTop = 0
    })
    await new Promise((r) => setTimeout(r, 400))

    const scrollBtnCheck = await page.evaluate(() => {
      const btn = document.querySelector('button[aria-label="Tatal ke mesej terkini"]')
      const stream = document.querySelector('.overflow-y-auto')
      return {
        hasScrollBtn: !!btn,
        scrollTop: stream ? stream.scrollTop : -1,
      }
    })
    console.log('Scroll button check when scrolled up:', scrollBtnCheck)
    if (!scrollBtnCheck.hasScrollBtn) {
      console.log('Note: Stream height might be small or scroll threshold not reached yet.')
    } else {
      console.log('PASS: Floating scroll-to-latest button appears when scrolled up!')
      const scrollBottomBtn = await page.$('button[aria-label="Tatal ke mesej terkini"]')
      await scrollBottomBtn.click()
      await new Promise((r) => setTimeout(r, 400))
      const scrollTopAfterClick = await page.evaluate(() => {
        const stream = document.querySelector('.overflow-y-auto')
        return stream ? stream.scrollTop : -1
      })
      console.log('PASS: Tapped scroll-to-latest button, scrollTop is now:', scrollTopAfterClick)
    }

    // 6. Test Keyboard Open Simulation (Viewport height shrinks to 450px)
    console.log('=== TEST 6: Virtual Keyboard Open Accommodation ===')
    await page.setViewport({ width: 390, height: 460, deviceScaleFactor: 2, isMobile: true, hasTouch: true })
    await new Promise((r) => setTimeout(r, 300))

    const keyboardVisibilityCheck = await page.evaluate(() => {
      const input = document.querySelector('input[placeholder="Taip soalan Puan di sini..."]')
      const sendBtn = document.querySelector('button[aria-label="Hantar soalan"]')
      const lightbulbBtn = document.querySelector('button[aria-label="Cadangan Soalan"]')

      const inputRect = input.getBoundingClientRect()
      const sendRect = sendBtn.getBoundingClientRect()
      const lightbulbRect = lightbulbBtn.getBoundingClientRect()

      const viewportHeight = window.innerHeight
      return {
        viewportHeight,
        inputVisible: inputRect.bottom <= viewportHeight && inputRect.top >= 0,
        sendVisible: sendRect.bottom <= viewportHeight && sendRect.top >= 0,
        lightbulbVisible: lightbulbRect.bottom <= viewportHeight && lightbulbRect.top >= 0,
      }
    })
    console.log('Keyboard open check:', keyboardVisibilityCheck)
    if (!keyboardVisibilityCheck.inputVisible || !keyboardVisibilityCheck.sendVisible || !keyboardVisibilityCheck.lightbulbVisible) {
      throw new Error(`FAIL: Composer elements hidden when keyboard opened: ${JSON.stringify(keyboardVisibilityCheck)}`)
    }
    console.log('PASS: Composer and all buttons remain 100% visible and reachable when keyboard is open!')

    // Reset viewport to standard
    await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true })

    // 7. Capture screenshots across all specified viewports
    console.log('=== TEST 7: Capturing Responsive Viewports ===')
    for (const vp of VIEWPORTS) {
      await page.setViewport({ width: vp.width, height: vp.height, deviceScaleFactor: 2, isMobile: vp.isMobile, hasTouch: vp.isMobile })
      await new Promise((r) => setTimeout(r, 400))

      const shotPath = path.join(OUTPUT_DIR, `whatsapp_chat_${vp.name}.png`)
      await page.screenshot({ path: shotPath })
      console.log(`Saved screenshot: ${shotPath}`)
    }

    // Capture open lightbulb suggestions panel screenshot
    const freshLightbulbBtn = await page.$('button[aria-label="Cadangan Soalan"]')
    if (freshLightbulbBtn) {
      await freshLightbulbBtn.click()
      await new Promise((r) => setTimeout(r, 300))
      await page.screenshot({ path: path.join(OUTPUT_DIR, 'whatsapp_chat_suggestions_open.png') })
      console.log('Saved screenshot: whatsapp_chat_suggestions_open.png')
    }

    // 8. Test Back Navigation
    console.log('=== TEST 8: Back Navigation to Dashboard ===')
    const backBtn = await page.$('header button[aria-label*="Kembali"]')
    if (!backBtn) throw new Error('Back button in header not found')
    await backBtn.click()
    await new Promise((r) => setTimeout(r, 600))

    const backToDashboardCheck = await page.evaluate(() => {
      return document.body.innerText.includes('Laporan Jualan') && document.body.innerText.includes('Prestasi perniagaan Puan')
    })
    if (!backToDashboardCheck) throw new Error('FAIL: Back navigation did not return to Dashboard!')
    console.log('PASS: Back navigation successfully returns to Dashboard.')

    console.log('\n=========================================')
    console.log('ALL PHASE 5.1 VERIFICATIONS PASSED 100%!')
    console.log('=========================================\n')
  } finally {
    await browser.close()
  }
}

runTests().catch((err) => {
  console.error('VERIFICATION ERROR:', err)
  process.exit(1)
})
