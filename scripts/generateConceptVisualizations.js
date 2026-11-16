import puppeteer from 'puppeteer-core'
import path from 'node:path'
import fs from 'node:fs'

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
const OUTPUT_DIR = 'C:\\Users\\haxim\\.gemini\\antigravity\\brain\\47654856-1cc5-4831-8489-f0d17b9c4395\\screenshots\\redesign_concepts'

if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true })
}

// Concept A HTML: Apple Bento Grid (Hero Bento + Duo Companion Cards)
const htmlConceptA = `
<!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@500;600;700;800&family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
      background: #F8F7F9;
      color: #1C151F;
      padding: 16px;
      display: flex;
      justify-content: center;
    }
    .container {
      width: 100%;
      max-width: 410px;
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    /* Concept Header Badge */
    .concept-tag {
      background: #BE1E72;
      color: #fff;
      font-size: 11px;
      font-weight: 800;
      letter-spacing: 0.05em;
      text-transform: uppercase;
      padding: 6px 14px;
      border-radius: 99px;
      display: inline-block;
      margin-bottom: 4px;
      align-self: flex-start;
      box-shadow: 0 2px 8px rgba(190, 30, 114, 0.25);
    }
    .concept-title {
      font-family: 'Plus Jakarta Sans', sans-serif;
      font-size: 20px;
      font-weight: 800;
      color: #1C151F;
      line-height: 1.2;
    }
    .concept-sub {
      font-size: 12px;
      color: #786C7C;
      margin-top: 2px;
      margin-bottom: 12px;
    }

    /* 1. Apple iOS Smart Widget (Returning User) */
    .widget-returning {
      background: linear-gradient(135deg, #FFF6FA 0%, #FFFFFF 65%, #FFF0F6 100%);
      border: 1px solid rgba(243, 182, 216, 0.7);
      border-radius: 22px;
      padding: 14px 16px;
      box-shadow: 0 4px 16px -2px rgba(190, 30, 114, 0.06), 0 1px 3px rgba(28, 21, 31, 0.02);
      display: flex;
      flex-direction: column;
      gap: 12px;
    }
    .widget-top {
      display: flex;
      align-items: center;
      justify-content: space-between;
    }
    .user-info {
      display: flex;
      align-items: center;
      gap: 10px;
    }
    .avatar-icon {
      width: 36px;
      height: 36px;
      border-radius: 12px;
      background: #FFE8F2;
      border: 1px solid #FBCFE8;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 18px;
    }
    .user-name {
      font-family: 'Plus Jakarta Sans', sans-serif;
      font-size: 14px;
      font-weight: 800;
      color: #1C151F;
    }
    .user-count {
      font-size: 11px;
      color: #786C7C;
      margin-top: 1px;
    }
    .status-pill {
      background: #FDF2F7;
      color: #9B155B;
      border: 1px solid #FBCFE8;
      font-size: 10px;
      font-weight: 700;
      padding: 3px 8px;
      border-radius: 99px;
      display: flex;
      align-items: center;
      gap: 4px;
    }
    .status-dot {
      width: 5px;
      height: 5px;
      border-radius: 99px;
      background: #BE1E72;
    }
    .widget-actions {
      display: flex;
      gap: 8px;
    }
    .btn-resume {
      flex: 1.3;
      background: #BE1E72;
      color: #FFFFFF;
      font-size: 12px;
      font-weight: 700;
      border: none;
      padding: 9px 14px;
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 6px;
      box-shadow: 0 2px 8px rgba(190, 30, 114, 0.25);
    }
    .btn-reset {
      flex: 0.9;
      background: #FFFFFF;
      border: 1px solid #E5DEE4;
      color: #786C7C;
      font-size: 11px;
      font-weight: 600;
      padding: 9px 12px;
      border-radius: 12px;
    }

    /* Section Heading */
    .section-head {
      display: flex;
      align-items: baseline;
      justify-content: space-between;
      padding: 0 4px;
      margin-top: 4px;
    }
    .section-head h2 {
      font-family: 'Plus Jakarta Sans', sans-serif;
      font-size: 16px;
      font-weight: 800;
      color: #1C151F;
    }
    .section-head span {
      font-size: 11px;
      color: #786C7C;
      font-weight: 600;
    }

    /* 2. Hero Bento Card (Method 1: AI Chat) */
    .hero-bento {
      background: linear-gradient(180deg, #FFFFFF 0%, #FFF8FB 100%);
      border: 1.5px solid #F5C6DF;
      border-radius: 26px;
      padding: 18px;
      box-shadow: 0 8px 28px -4px rgba(190, 30, 114, 0.10), 0 2px 6px rgba(28, 21, 31, 0.03);
      display: flex;
      flex-direction: column;
      gap: 14px;
      position: relative;
      overflow: hidden;
    }
    .hero-bento::before {
      content: '';
      position: absolute;
      top: -30px;
      right: -30px;
      width: 120px;
      height: 120px;
      border-radius: 99px;
      background: radial-gradient(circle, rgba(244, 114, 182, 0.15) 0%, rgba(255, 255, 255, 0) 70%);
      pointer-events: none;
    }
    .card-badge-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
    }
    .icon-box-berry {
      width: 42px;
      height: 42px;
      border-radius: 14px;
      background: #FFF0F6;
      border: 1px solid #FBCFE8;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #BE1E72;
      font-size: 20px;
      box-shadow: 0 2px 6px rgba(190, 30, 114, 0.08);
    }
    .pill-highlight {
      background: linear-gradient(135deg, #BE1E72 0%, #9B155B 100%);
      color: #FFFFFF;
      font-size: 10px;
      font-weight: 800;
      letter-spacing: 0.03em;
      padding: 4px 10px;
      border-radius: 99px;
      box-shadow: 0 2px 6px rgba(190, 30, 114, 0.25);
    }
    .hero-title {
      font-family: 'Plus Jakarta Sans', sans-serif;
      font-size: 17px;
      font-weight: 800;
      color: #1C151F;
    }
    .hero-desc {
      font-size: 12px;
      color: #4A3E4E;
      line-height: 1.45;
      margin-top: 2px;
    }

    /* Simulated Interactive Speech Bubble in Hero */
    .chat-preview {
      background: #FFFFFF;
      border: 1px solid #F2DEEB;
      border-radius: 16px;
      padding: 12px 14px;
      box-shadow: 0 2px 8px rgba(28, 21, 31, 0.03);
      display: flex;
      flex-direction: column;
      gap: 8px;
    }
    .chat-msg {
      display: flex;
      align-items: flex-start;
      gap: 8px;
      font-size: 11.5px;
      color: #332637;
      font-style: italic;
      line-height: 1.4;
    }
    .chat-ai-pill {
      align-self: flex-start;
      background: #FDF2F7;
      border: 1px solid #FBCFE8;
      color: #9B155B;
      font-size: 10px;
      font-weight: 700;
      padding: 3px 8px;
      border-radius: 8px;
      display: flex;
      align-items: center;
      gap: 4px;
    }
    .btn-hero {
      width: 100%;
      background: #BE1E72;
      color: #FFFFFF;
      font-family: 'Plus Jakarta Sans', sans-serif;
      font-size: 13px;
      font-weight: 800;
      border: none;
      padding: 12px;
      border-radius: 14px;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 6px;
      box-shadow: 0 4px 14px rgba(190, 30, 114, 0.3);
      cursor: pointer;
    }

    /* 3. The 2-Column Bento Duo (Method 2 & Method 3) */
    .bento-duo-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 12px;
    }
    .duo-card {
      background: #FFFFFF;
      border-radius: 22px;
      padding: 14px;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      gap: 10px;
      box-shadow: 0 3px 12px rgba(28, 21, 31, 0.04);
      min-height: 195px;
    }

    /* Excel Duo Card */
    .card-excel {
      background: linear-gradient(180deg, #FFFFFF 0%, #F5FBF8 100%);
      border: 1.5px solid #D1FAE5;
    }
    .icon-box-emerald {
      width: 36px;
      height: 36px;
      border-radius: 12px;
      background: #ECFDF5;
      border: 1px solid #A7F3D0;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #059669;
      font-size: 18px;
    }
    .tag-emerald {
      background: #ECFDF5;
      color: #065F46;
      border: 1px solid #A7F3D0;
      font-size: 9.5px;
      font-weight: 700;
      padding: 2px 6px;
      border-radius: 6px;
      align-self: flex-start;
    }
    .duo-title {
      font-family: 'Plus Jakarta Sans', sans-serif;
      font-size: 13.5px;
      font-weight: 800;
      color: #1C151F;
      line-height: 1.25;
    }
    .duo-desc {
      font-size: 11px;
      color: #5D5260;
      line-height: 1.35;
      margin-top: 2px;
    }
    .micro-sheet {
      background: #FFFFFF;
      border: 1px solid #D1FAE5;
      border-radius: 8px;
      padding: 6px;
      font-size: 9.5px;
      color: #065F46;
      font-weight: 600;
      display: flex;
      align-items: center;
      gap: 4px;
    }
    .btn-emerald-pill {
      width: 100%;
      background: #ECFDF5;
      border: 1px solid #A7F3D0;
      color: #065F46;
      font-size: 11.5px;
      font-weight: 700;
      padding: 8px;
      border-radius: 10px;
      text-align: center;
    }

    /* Manual Duo Card */
    .card-manual {
      background: linear-gradient(180deg, #FFFFFF 0%, #FAF7FE 100%);
      border: 1.5px solid #EDE9FE;
    }
    .icon-box-purple {
      width: 36px;
      height: 36px;
      border-radius: 12px;
      background: #F5F3FF;
      border: 1px solid #DDD6FE;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #7C3AED;
      font-size: 18px;
    }
    .tag-purple {
      background: #F5F3FF;
      color: #5B21B6;
      border: 1px solid #DDD6FE;
      font-size: 9.5px;
      font-weight: 700;
      padding: 2px 6px;
      border-radius: 6px;
      align-self: flex-start;
    }
    .micro-tally {
      background: #FFFFFF;
      border: 1px solid #EDE9FE;
      border-radius: 8px;
      padding: 6px;
      font-size: 9.5px;
      color: #5B21B6;
      font-weight: 600;
      display: flex;
      align-items: center;
      gap: 4px;
    }
    .btn-purple-pill {
      width: 100%;
      background: #F5F3FF;
      border: 1px solid #DDD6FE;
      color: #5B21B6;
      font-size: 11.5px;
      font-weight: 700;
      padding: 8px;
      border-radius: 10px;
      text-align: center;
    }

    /* 4. Compact Demo Simulation Widget */
    .card-demo {
      background: #FFFFFF;
      border: 1px solid #E5DEE4;
      border-radius: 18px;
      padding: 12px 14px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 10px;
      box-shadow: 0 2px 6px rgba(28, 21, 31, 0.02);
    }
    .demo-left {
      display: flex;
      align-items: center;
      gap: 10px;
    }
    .demo-title {
      font-size: 12px;
      font-weight: 700;
      color: #1C151F;
    }
    .demo-sub {
      font-size: 10.5px;
      color: #786C7C;
    }
    .btn-demo-pill {
      background: #F8F6F8;
      border: 1px solid #E5DEE4;
      color: #4A3E4E;
      font-size: 11px;
      font-weight: 700;
      padding: 6px 12px;
      border-radius: 10px;
      white-space: nowrap;
    }
  </style>
</head>
<body>
  <div class="container">
    <div>
      <span class="concept-tag">Option A • Apple Bento Grid</span>
      <h1 class="concept-title">Hero Bento + Paired Duo</h1>
      <p class="concept-sub">Visual hierarchy, rich micro-previews, zero empty holes</p>
    </div>

    <!-- Returning User iOS Smart Widget -->
    <div class="widget-returning">
      <div class="widget-top">
        <div class="user-info">
          <div class="avatar-icon">👋</div>
          <div>
            <div class="user-name">Selamat kembali, Puan!</div>
            <div class="user-count">600 transaksi tersimpan di peranti</div>
          </div>
        </div>
        <div class="status-pill">
          <span class="status-dot"></span>
          <span>Aktif</span>
        </div>
      </div>
      <div class="widget-actions">
        <button class="btn-resume">Sambung Laporan →</button>
        <button class="btn-reset">Mula Rekod Baharu</button>
      </div>
    </div>

    <!-- Section Heading -->
    <div class="section-head">
      <h2>Pilih Cara Memasukkan Jualan</h2>
      <span>3 Kaedah Mudah</span>
    </div>

    <!-- Method 1: Hero Bento Card -->
    <div class="hero-bento">
      <div class="card-badge-row">
        <div class="icon-box-berry">💬</div>
        <span class="pill-highlight">⭐ Paling Popular • Perbualan Santai</span>
      </div>
      <div>
        <h3 class="hero-title">1. Cerita Jualan kepada AI</h3>
        <p class="hero-desc">Taip atau sebut ayat macam mesej WhatsApp biasa. AI menyusun semula rekod automatik.</p>
      </div>
      <div class="chat-preview">
        <div class="chat-msg">
          <span>🗣️</span>
          <span>"Pagi tadi laku 50 biji karipap RM2.00 dan 20 botol air sirap..."</span>
        </div>
        <div class="chat-ai-pill">
          <span>⚡</span>
          <span>Auto-Kira: 2 Produk • RM140 Jualan • Untung RM65</span>
        </div>
      </div>
      <button class="btn-hero">Mula Cerita Jualan →</button>
    </div>

    <!-- Methods 2 & 3: Apple Duo Companion Cards -->
    <div class="bento-duo-grid">
      <!-- Method 2: Excel -->
      <div class="duo-card card-excel">
        <div>
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">
            <div class="icon-box-emerald">📊</div>
            <span class="tag-emerald">.xlsx / .csv</span>
          </div>
          <h4 class="duo-title">2. Muat Naik Excel</h4>
          <p class="duo-desc">Gunakan fail sedia ada dari telefon atau komputer.</p>
        </div>
        <div class="micro-sheet">
          <span>📄</span>
          <span>Jualan_Mei.xlsx (3 lajur)</span>
        </div>
        <div class="btn-emerald-pill">Pilih Fail ↑</div>
      </div>

      <!-- Method 3: Manual Entry -->
      <div class="duo-card card-manual">
        <div>
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">
            <div class="icon-box-purple">✍️</div>
            <span class="tag-purple">Borang Mudah</span>
          </div>
          <h4 class="duo-title">3. Isi Sendiri</h4>
          <p class="duo-desc">Masukkan nama kuih, kuantiti dan kos berasingan.</p>
        </div>
        <div class="micro-tally">
          <span>📝</span>
          <span>Kuih Lapis x 40 = RM80</span>
        </div>
        <div class="btn-purple-pill">Buka Borang +</div>
      </div>
    </div>

    <!-- Demo Simulation Card -->
    <div class="card-demo">
      <div class="demo-left">
        <span style="font-size:18px;">✨</span>
        <div>
          <div class="demo-title">Cuba Data Contoh?</div>
          <div class="demo-sub">Demonstrasi gerai makanan percuma</div>
        </div>
      </div>
      <div class="btn-demo-pill">Muatkan Data →</div>
    </div>
  </div>
</body>
</html>
`

// Concept B HTML: Apple iOS 18 Rich Stack (Full-width Tinted Cards with Micro-Graphic Containers)
const htmlConceptB = `
<!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@500;600;700;800&family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
      background: #F5F4F7;
      color: #1C151F;
      padding: 16px;
      display: flex;
      justify-content: center;
    }
    .container {
      width: 100%;
      max-width: 410px;
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    /* Concept Header Badge */
    .concept-tag {
      background: #4A3E4E;
      color: #fff;
      font-size: 11px;
      font-weight: 800;
      letter-spacing: 0.05em;
      text-transform: uppercase;
      padding: 6px 14px;
      border-radius: 99px;
      display: inline-block;
      margin-bottom: 4px;
      align-self: flex-start;
      box-shadow: 0 2px 8px rgba(74, 62, 78, 0.25);
    }
    .concept-title {
      font-family: 'Plus Jakarta Sans', sans-serif;
      font-size: 20px;
      font-weight: 800;
      color: #1C151F;
      line-height: 1.2;
    }
    .concept-sub {
      font-size: 12px;
      color: #786C7C;
      margin-top: 2px;
      margin-bottom: 12px;
    }

    /* 1. iOS Settings Pass (Returning User) */
    .pass-card {
      background: #FFFFFF;
      border: 1px solid #E8E2E7;
      border-radius: 20px;
      padding: 14px 16px;
      box-shadow: 0 3px 12px rgba(28, 21, 31, 0.04);
      display: flex;
      flex-direction: column;
      gap: 12px;
    }
    .pass-header {
      display: flex;
      align-items: center;
      gap: 10px;
    }
    .pass-icon {
      width: 38px;
      height: 38px;
      border-radius: 12px;
      background: #FDF2F7;
      border: 1px solid #FBCFE8;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 18px;
    }
    .pass-title {
      font-family: 'Plus Jakarta Sans', sans-serif;
      font-size: 14px;
      font-weight: 800;
      color: #1C151F;
    }
    .pass-meta {
      font-size: 11px;
      color: #786C7C;
    }
    .pass-buttons {
      display: flex;
      gap: 8px;
    }
    .pass-btn-main {
      flex: 1.2;
      background: #BE1E72;
      color: #FFFFFF;
      font-size: 12px;
      font-weight: 700;
      padding: 9px;
      border-radius: 11px;
      border: none;
      text-align: center;
    }
    .pass-btn-sec {
      flex: 0.9;
      background: #F8F6F8;
      border: 1px solid #E5DEE4;
      color: #4A3E4E;
      font-size: 11px;
      font-weight: 600;
      padding: 9px;
      border-radius: 11px;
      border: none;
      text-align: center;
    }

    /* Section Head */
    .section-head {
      display: flex;
      align-items: baseline;
      justify-content: space-between;
      padding: 0 4px;
      margin-top: 4px;
    }
    .section-head h2 {
      font-family: 'Plus Jakarta Sans', sans-serif;
      font-size: 16px;
      font-weight: 800;
    }
    .section-head span {
      font-size: 11px;
      color: #786C7C;
      font-weight: 600;
    }

    /* Rich Card Base */
    .rich-card {
      border-radius: 24px;
      padding: 16px;
      display: flex;
      flex-direction: column;
      gap: 12px;
      box-shadow: 0 4px 18px rgba(28, 21, 31, 0.05);
    }

    /* Card 1: AI Story (Berry Tint) */
    .rich-card-berry {
      background: linear-gradient(180deg, #FFFFFF 0%, #FFF5FA 100%);
      border: 1.5px solid #F3B6D8;
    }
    .rich-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .icon-wrap-berry {
      width: 40px;
      height: 40px;
      border-radius: 13px;
      background: #FFF0F6;
      border: 1px solid #FBCFE8;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 18px;
    }
    .badge-berry {
      background: #FDF2F7;
      color: #9B155B;
      border: 1px solid #FBCFE8;
      font-size: 10px;
      font-weight: 700;
      padding: 3px 8px;
      border-radius: 99px;
    }
    .rich-title {
      font-family: 'Plus Jakarta Sans', sans-serif;
      font-size: 16px;
      font-weight: 800;
      color: #1C151F;
    }
    .rich-desc {
      font-size: 12px;
      color: #4A3E4E;
      line-height: 1.4;
      margin-top: 2px;
    }
    .graphic-strip-berry {
      background: #FFFFFF;
      border: 1px solid #F2DEEB;
      border-radius: 12px;
      padding: 10px 12px;
      font-size: 11px;
      color: #3B2E3E;
      font-style: italic;
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .btn-berry-solid {
      width: 100%;
      background: #BE1E72;
      color: #fff;
      font-size: 12.5px;
      font-weight: 700;
      padding: 11px;
      border-radius: 12px;
      border: none;
      text-align: center;
      box-shadow: 0 3px 10px rgba(190, 30, 114, 0.25);
    }

    /* Card 2: Excel (Mint Tint) */
    .rich-card-mint {
      background: linear-gradient(180deg, #FFFFFF 0%, #F3FBF7 100%);
      border: 1.5px solid #BBF7D0;
    }
    .icon-wrap-mint {
      width: 40px;
      height: 40px;
      border-radius: 13px;
      background: #ECFDF5;
      border: 1px solid #A7F3D0;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 18px;
    }
    .badge-mint {
      background: #ECFDF5;
      color: #065F46;
      border: 1px solid #A7F3D0;
      font-size: 10px;
      font-weight: 700;
      padding: 3px 8px;
      border-radius: 99px;
    }
    .graphic-strip-mint {
      background: #FFFFFF;
      border: 1px solid #D1FAE5;
      border-radius: 12px;
      padding: 8px 12px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      font-size: 11px;
      color: #065F46;
      font-weight: 600;
    }
    .btn-mint-tint {
      width: 100%;
      background: #ECFDF5;
      border: 1px solid #A7F3D0;
      color: #065F46;
      font-size: 12px;
      font-weight: 700;
      padding: 10px;
      border-radius: 12px;
      text-align: center;
    }

    /* Card 3: Manual (Lavender Tint) */
    .rich-card-lavender {
      background: linear-gradient(180deg, #FFFFFF 0%, #FAF5FF 100%);
      border: 1.5px solid #DDD6FE;
    }
    .icon-wrap-lavender {
      width: 40px;
      height: 40px;
      border-radius: 13px;
      background: #F5F3FF;
      border: 1px solid #DDD6FE;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 18px;
    }
    .badge-lavender {
      background: #F5F3FF;
      color: #5B21B6;
      border: 1px solid #DDD6FE;
      font-size: 10px;
      font-weight: 700;
      padding: 3px 8px;
      border-radius: 99px;
    }
    .graphic-strip-lavender {
      background: #FFFFFF;
      border: 1px solid #EDE9FE;
      border-radius: 12px;
      padding: 8px 12px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      font-size: 11px;
      color: #5B21B6;
      font-weight: 600;
    }
    .btn-lavender-tint {
      width: 100%;
      background: #F5F3FF;
      border: 1px solid #DDD6FE;
      color: #5B21B6;
      font-size: 12px;
      font-weight: 700;
      padding: 10px;
      border-radius: 12px;
      text-align: center;
    }
  </style>
</head>
<body>
  <div class="container">
    <div>
      <span class="concept-tag">Option B • Apple iOS 18 Stack</span>
      <h1 class="concept-title">Color-Coded Tinted Cards</h1>
      <p class="concept-sub">Full-width cards, surface tints, tactile pill buttons</p>
    </div>

    <!-- Returning User Pass -->
    <div class="pass-card">
      <div class="pass-header">
        <div class="pass-icon">👋</div>
        <div>
          <div class="pass-title">Selamat kembali, Puan!</div>
          <div class="pass-meta">600 transaksi jualan tersimpan</div>
        </div>
      </div>
      <div class="pass-buttons">
        <div class="pass-btn-main">Sambung Laporan →</div>
        <div class="pass-btn-sec">Mula Baharu</div>
      </div>
    </div>

    <!-- Section Head -->
    <div class="section-head">
      <h2>Pilih Cara Memasukkan Jualan</h2>
      <span>3 Kaedah Berbeza</span>
    </div>

    <!-- Card 1: AI Story -->
    <div class="rich-card rich-card-berry">
      <div class="rich-header">
        <div class="icon-wrap-berry">💬</div>
        <span class="badge-berry">Perbualan Santai AI</span>
      </div>
      <div>
        <h3 class="rich-title">1. Cerita Jualan kepada AI</h3>
        <p class="rich-desc">Sebut atau taip ayat biasa macam di WhatsApp. Sistem kira keuntungan serta-merta.</p>
      </div>
      <div class="graphic-strip-berry">
        <span>🗣️</span>
        <span>"Pagi tadi laku 50 karipap RM2.00 dan 20 air sirap..."</span>
      </div>
      <div class="btn-berry-solid">Mula Cerita Jualan →</div>
    </div>

    <!-- Card 2: Excel Upload -->
    <div class="rich-card rich-card-mint">
      <div class="rich-header">
        <div class="icon-wrap-mint">📊</div>
        <span class="badge-mint">Fail .xlsx / .csv</span>
      </div>
      <div>
        <h3 class="rich-title">2. Muat Naik Fail Excel</h3>
        <p class="rich-desc">Gunakan fail sedia ada. Susunan lajur produk dan kuantiti dibuat secara automatik.</p>
      </div>
      <div class="graphic-strip-mint">
        <span>📄 Jualan_Harian.xlsx</span>
        <span>✓ 3 Lajur Sedia</span>
      </div>
      <div class="btn-mint-tint">Pilih Fail Excel ↑</div>
    </div>

    <!-- Card 3: Manual Entry -->
    <div class="rich-card rich-card-lavender">
      <div class="rich-header">
        <div class="icon-wrap-lavender">✍️</div>
        <span class="badge-lavender">Borang Satu-Persatu</span>
      </div>
      <div>
        <h3 class="rich-title">3. Isi Jualan Sendiri</h3>
        <p class="rich-desc">Masukkan nama produk, harga jualan dan kos modal satu persatu secara tersusun.</p>
      </div>
      <div class="graphic-strip-lavender">
        <span>📝 1. Karipap x 50 biji</span>
        <span>RM100.00</span>
      </div>
      <div class="btn-lavender-tint">Buka Borang Jualan +</div>
    </div>
  </div>
</body>
</html>
`

async function generateVisualizations() {
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  })

  const page = await browser.newPage()
  await page.setViewport({ width: 390, height: 860, isMobile: true, deviceScaleFactor: 2 })

  // 1. Capture Concept A (Apple Bento Grid)
  await page.setContent(htmlConceptA)
  await new Promise((r) => setTimeout(r, 600))
  const pathConceptA = path.join(OUTPUT_DIR, 'concept_a_apple_bento_grid.png')
  await page.screenshot({ path: pathConceptA, fullPage: true })
  console.log('Saved Concept A visualization:', pathConceptA)

  // 2. Capture Concept B (Apple iOS 18 Stack)
  await page.setContent(htmlConceptB)
  await new Promise((r) => setTimeout(r, 600))
  const pathConceptB = path.join(OUTPUT_DIR, 'concept_b_apple_ios_stack.png')
  await page.screenshot({ path: pathConceptB, fullPage: true })
  console.log('Saved Concept B visualization:', pathConceptB)

  await browser.close()
  console.log('All visualizations rendered and saved successfully!')
}

generateVisualizations().catch(console.error)
