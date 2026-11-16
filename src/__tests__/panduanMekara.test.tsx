import { describe, it, expect, vi } from 'vitest'
import { renderToString } from 'react-dom/server'
import { UserGuide } from '../components/UserGuide'

describe('MEKARA — Phase 4: Panduan Mekara Quick-Help Centre Suite', () => {
  it('1. Renders Panduan Mekara landing with 4 main topics and Gemini setup shortcut', () => {
    const handleClose = vi.fn()
    const html = renderToString(<UserGuide onClose={handleClose} />)

    // Landing title, logo, and subtitle
    expect(html).toContain('Panduan')
    expect(html).toContain('Mekara')
    expect(html).toContain('/images/mekara-symbol.png')
    expect(html).toContain('font-brand')
    expect(html).toContain('Pilih topik yang Puan perlukan.')
    expect(html).not.toContain('Pusat Bantuan Pantas')

    // Prominent Gemini onboarding shortcut
    expect(html).toContain('Baru menggunakan Mekara?')
    expect(html).toContain('Sediakan Gemini dengan bantuan fasilitator.')
    expect(html).toContain('Lihat Cara Sambung Gemini')

    // 4 Main Topic Cards
    expect(html).toContain('Catat Jualan')
    expect(html).toContain('AI, Excel &amp; Manual')

    expect(html).toContain('Faham Laporan')
    expect(html).toContain('Jualan, untung &amp; PDF')

    expect(html).toContain('Tanya')
    expect(html).toContain('Pembantu pintar')

    expect(html).toContain('Bantuan Lain')
    expect(html).toContain('Gemini &amp; simpanan')

    // SULAM Training Module Notice (No dummy PDF buttons)
    expect(html).toContain('Modul Latihan SULAM')
    expect(html).toContain('Panduan pembelajaran lengkap akan disediakan secara berasingan.')
    expect(html).not.toContain('.pdf')
  })

  it('2. Topic A (Catat Jualan) provides 3 methods, real example and working CTAs', () => {
    const html = renderToString(
      <UserGuide onClose={vi.fn()} initialTopic="catat" />
    )

    // Verified sub-methods exist
    expect(html).toContain('Cerita Jualan AI')
    expect(html).toContain('Muat Naik Excel / CSV')
    expect(html).toContain('Urus Rekod Jualan')

    // AI method shows real example
    expect(html).toContain(
      'Hari ini saya jual 20 karipap, RM2 sebiji. Modal bahan mentah RM0.80 sebiji.'
    )

    // AI method CTA
    expect(html).toContain('Cuba Catat Jualan')
  })

  it('3. Topic B (Faham Laporan) clarifies gross profit vs net profit accurately', () => {
    const html = renderToString(
      <UserGuide onClose={vi.fn()} initialTopic="laporan" hasExistingData={true} />
    )

    expect(html).toContain('2. Faham Laporan &amp; Untung')

    // Exact gross profit formula & text
    expect(html).toContain('Untung Kasar = Jumlah Jualan − Kos Modal Bahan Mentah')
    expect(html).toContain(
      'Untung Kasar ialah jumlah jualan selepas ditolak kos modal produk yang direkodkan.'
    )

    // Exact net profit formula & text
    expect(html).toContain('Untung Bersih = Untung Kasar − Perbelanjaan Operasi')
    expect(html).toContain('Untung Bersih mengambil kira perbelanjaan operasi yang dimasukkan')

    // Direct CTA navigates to dashboard
    expect(html).toContain('Buka Papan Pemuka')
  })

  it('4. Topic C (Tanya Mekara) accurately states suggested questions do NOT auto-send', () => {
    const html = renderToString(
      <UserGuide onClose={vi.fn()} initialTopic="tanya" hasExistingData={true} />
    )

    expect(html).toContain('3. Tanya Mekara (Pembantu Pintar)')

    // Accurate behavior specification: selecting suggestion only fills input
    expect(html).toContain('Memilih soalan cadangan')
    expect(html).toContain('hanya mengisi ruangan teks')
    expect(html).toContain('TIDAK')

    // Example questions
    expect(html).toContain('Produk mana paling laris?')
    expect(html).toContain('Berapa untung kasar saya?')
    expect(html).toContain('Bagaimana prestasi jualan bulan ini?')

    // Direct CTA navigates to chat
    expect(html).toContain('Buka Pembantu Mekara')
  })

  it('5. Topic D (Bantuan Lain) covers Gemini setup, caution, local storage and record resumption', () => {
    const html = renderToString(
      <UserGuide onClose={vi.fn()} initialTopic="bantuan" />
    )

    expect(html).toContain('4. Bantuan Lain')

    // Gemini tab content
    expect(html).toContain('Cara Menyambung Kunci Gemini AI')
    expect(html).toContain('Jangan kongsi kunci Gemini Puan dengan orang lain.')
    expect(html).toContain('Buka Tetapan Gemini')

    // Navigation and sub-tabs are present
    expect(html).toContain('Sambungkan Gemini')
    expect(html).toContain('Simpanan Automatik')
    expect(html).toContain('Sambung Rekod Lama')
  })

  it('6. Back navigation link is rendered whenever inside a walkthrough topic', () => {
    const htmlCatat = renderToString(
      <UserGuide onClose={vi.fn()} initialTopic="catat" />
    )
    expect(htmlCatat).toContain('Kembali ke Panduan')

    const htmlMain = renderToString(<UserGuide onClose={vi.fn()} />)
    expect(htmlMain).not.toContain('Kembali ke Panduan')
    expect(htmlMain).not.toContain('Kembali ke Aplikasi')
  })
})
