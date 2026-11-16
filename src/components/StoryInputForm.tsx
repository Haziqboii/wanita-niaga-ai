import { useState, useEffect } from 'react'
import { ApiKeyModal } from './ApiKeyModal'
import {
  SparklesIcon,
  AiChatBubbleIcon,
  LightBulbIcon,
  LockIcon,
  CheckCircleIcon,
  PencilIcon,
  TrashIcon,
  PlusIcon,
  ReceiptIcon,
  ChevronRightIcon,
} from './ui/Icons'
import { extractSalesFromStory } from '../services/aiExtraction'
import { formatRM, formatDateMY, validateRecords, parseCurrency, parseQuantity } from '../data/validate'
import type { RawSale } from '../types'

export interface StoryInputFormProps {
  onConfirm: (records: RawSale[], operatingExpenses: number | null) => void
  onBack?: () => void
  initialStory?: string
  initialRecords?: RawSale[]
  onStoryChange?: (val: string) => void
  isReviewStage?: boolean
  onReviewStageChange?: (isReview: boolean) => void
}

export function StoryInputForm({
  onConfirm,
  onBack: _onBack,
  initialStory = '',
  initialRecords,
  onStoryChange,
  isReviewStage,
  onReviewStageChange,
}: StoryInputFormProps) {
  const [story, setStory] = useState(initialStory)
  const [isLoading, setIsLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [clarification, setClarification] = useState<string | null>(null)
  const [showApiKeyModal, setShowApiKeyModal] = useState(false)

  // Stage 2: Extracted records review
  const [extractedRecords, setExtractedRecords] = useState<RawSale[] | null>(
    initialRecords && initialRecords.length > 0 ? initialRecords : null
  )
  const [opexInput, setOpexInput] = useState<string>('')
  const [isOpexExpanded, setIsOpexExpanded] = useState<boolean>(false)
  const [editingIndex, setEditingIndex] = useState<number | null>(null)
  const [isAddingRecord, setIsAddingRecord] = useState<boolean>(false)
  const [toastMessage, setToastMessage] = useState<string | null>(null)
  const [formError, setFormError] = useState<string | null>(null)

  // Edit form state for an individual record
  const [editForm, setEditForm] = useState<RawSale>({
    produk: '',
    kuantiti: '',
    harga: '',
    kos: null,
    tarikh: null,
    saluran: null,
  })

  // Add form state for "+ Tambah Jualan"
  const [addForm, setAddForm] = useState<RawSale>({
    produk: '',
    kuantiti: '',
    harga: '',
    kos: null,
    tarikh: null,
    saluran: null,
  })

  // Derived review state from extractedRecords and parent review flag
  const isReview = Boolean(
    (isReviewStage === undefined || isReviewStage === true) && extractedRecords !== null
  )

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [isReview])

  const handleExtract = async () => {
    if (!story.trim() || isLoading) return
    setIsLoading(true)
    setErrorMessage(null)
    setClarification(null)

    try {
      const result = await extractSalesFromStory(story)

      if (!result.success) {
        setErrorMessage(result.error || 'Gagal memproses teks jualan anda.')
        return
      }

      if (!result.hasSufficientData || result.records.length === 0) {
        setClarification(
          result.clarificationMessage ||
            'Maklumat jualan belum lengkap. Sila nyatakan harga seunit dan bilangan unit yang terjual bagi produk anda.'
        )
        return
      }

      setExtractedRecords(result.records)
      if (result.operatingExpenses !== null) {
        setOpexInput(String(result.operatingExpenses))
        setIsOpexExpanded(true)
      } else {
        setOpexInput('')
        setIsOpexExpanded(false)
      }

      if (onReviewStageChange) {
        onReviewStageChange(true)
      }
    } catch {
      setErrorMessage('Berlaku masalah rangkaian. Sila cuba lagi sebentar lagi.')
    } finally {
      setIsLoading(false)
    }
  }

  // Edit record handlers
  const handleStartEdit = (index: number) => {
    if (!extractedRecords) return
    setIsAddingRecord(false)
    setEditingIndex(index)
    setFormError(null)
    setEditForm({ ...extractedRecords[index] })
  }

  const handleSaveEdit = () => {
    if (!extractedRecords || editingIndex === null) return

    if (!editForm.produk.trim()) {
      setFormError('Sila masukkan nama produk.')
      return
    }
    const parsedQty = parseQuantity(editForm.kuantiti)
    if (parsedQty === null) {
      setFormError('Sila masukkan kuantiti jualan yang sah (lebih daripada 0).')
      return
    }
    const parsedPrice = parseCurrency(editForm.harga)
    if (parsedPrice === null || parsedPrice < 0) {
      setFormError('Sila masukkan harga jualan seunit yang sah.')
      return
    }

    const updated = [...extractedRecords]
    updated[editingIndex] = {
      ...editForm,
      produk: editForm.produk.trim(),
      kuantiti: parsedQty,
      harga: parsedPrice,
      kos:
        editForm.kos !== null && editForm.kos !== undefined && String(editForm.kos).trim() !== ''
          ? parseCurrency(editForm.kos)
          : null,
    }
    setExtractedRecords(updated)
    setEditingIndex(null)
    setFormError(null)
    setToastMessage('Perubahan berjaya disimpan.')
    setTimeout(() => setToastMessage(null), 3000)
  }

  const handleRemoveRecord = (index: number) => {
    if (!extractedRecords) return
    const recName = extractedRecords[index]?.produk || 'rekod ini'
    if (!window.confirm(`Adakah Puan pasti mahu memadam rekod "${recName}"?`)) {
      return
    }
    const updated = extractedRecords.filter((_, i) => i !== index)
    setExtractedRecords(updated)
    if (editingIndex === index) {
      setEditingIndex(null)
    }
    setToastMessage('Rekod telah dipadam.')
    setTimeout(() => setToastMessage(null), 3000)
  }

  // Add new record handlers
  const handleSaveNewRecord = () => {
    if (!extractedRecords) return

    if (!addForm.produk.trim()) {
      setFormError('Sila masukkan nama produk atau perkhidmatan.')
      return
    }
    const parsedQty = parseQuantity(addForm.kuantiti)
    if (parsedQty === null) {
      setFormError('Sila masukkan kuantiti jualan yang sah (lebih daripada 0).')
      return
    }
    const parsedPrice = parseCurrency(addForm.harga)
    if (parsedPrice === null || parsedPrice < 0) {
      setFormError('Sila masukkan harga jualan seunit yang sah.')
      return
    }

    const newRecord: RawSale = {
      produk: addForm.produk.trim(),
      kuantiti: parsedQty,
      harga: parsedPrice,
      kos:
        addForm.kos !== null && addForm.kos !== undefined && String(addForm.kos).trim() !== ''
          ? parseCurrency(addForm.kos)
          : null,
      tarikh: addForm.tarikh || null,
      saluran: addForm.saluran || null,
    }

    setExtractedRecords([...extractedRecords, newRecord])
    setIsAddingRecord(false)
    setFormError(null)
    setToastMessage('Jualan berjaya ditambah.')
    setTimeout(() => setToastMessage(null), 3000)
  }

  // Calculate total confirmed revenue deterministically
  const totalRevenue = (extractedRecords || []).reduce((sum, r) => {
    const qty = Number(r.kuantiti) || 0
    const price = Number(r.harga) || 0
    return sum + qty * price
  }, 0)

  // Confirm and proceed to dashboard
  const handleConfirmAndProceed = () => {
    if (!extractedRecords || extractedRecords.length === 0) {
      alert('Sila pastikan terdapat sekurang-kurangnya satu rekod jualan.')
      return
    }

    const { valid, invalid } = validateRecords(extractedRecords)
    if (invalid.length > 0) {
      const topErrors = invalid
        .slice(0, 3)
        .map((inv) => `Baris ${inv.row}: ${inv.issues.map((i) => i.message).join(' ')}`)
        .join('\n')
      alert(`Sila semak semula maklumat rekod berikut:\n\n${topErrors}`)
      return
    }

    let opex: number | null = null
    if (opexInput.trim() !== '') {
      const parsed = Number(opexInput)
      if (Number.isFinite(parsed) && parsed >= 0) {
        opex = parsed
      }
    }

    if (onReviewStageChange) {
      onReviewStageChange(false)
    }

    onConfirm(valid, opex)
  }

  return (
    <div className="space-y-4 sm:space-y-5 max-w-2xl mx-auto">
      {/* ========================================================
          Stage 1: Story Input Area (Ceritakan Jualan Puan)
          ======================================================== */}
      {!isReview && (
        <div className="space-y-4 sm:space-y-5">
          {/* 1. Main Heading & Subtitle */}
          <div className="apple-reveal-card space-y-1" style={{ animationDelay: '0ms' }}>
            <h2 className="text-xl sm:text-2xl font-extrabold text-[#171317] font-heading tracking-tight leading-tight">
              Apa yang Puan jual hari ini?
            </h2>
            <p className="text-sm sm:text-base text-[#6B6069] font-body leading-relaxed">
              Cerita sahaja seperti biasa. AI akan bantu susunkan maklumat jualan Puan secara automatik.
            </p>
          </div>

          {/* 2. Story Input Card */}
          <div
            className="apple-reveal-card bg-[#FAF6F0] border border-[#EBE1D7] rounded-[24px] p-4 sm:p-5 shadow-[0_4px_20px_rgba(23,19,23,0.03)] space-y-3"
            style={{ animationDelay: '80ms' }}
          >
            {/* Card Header Label */}
            <div className="flex items-center gap-2 text-[#171317]">
              <div className="w-8 h-8 rounded-xl bg-[#F4E9DF] border border-[#E9DDD1] flex items-center justify-center text-[#800020] shrink-0">
                <AiChatBubbleIcon className="w-4 h-4 text-[#800020]" />
              </div>
              <label htmlFor="story-input" className="text-sm sm:text-base font-bold font-heading">
                Cerita Jualan Puan
              </label>
            </div>

            {/* Textarea Input Container (font size 16px to prevent iOS auto-zoom) */}
            <div className="relative">
              <textarea
                id="story-input"
                rows={4}
                value={story}
                disabled={isLoading}
                onChange={(e) => {
                  setStory(e.target.value)
                  if (onStoryChange) onStoryChange(e.target.value)
                  setErrorMessage(null)
                  setClarification(null)
                }}
                placeholder="Contoh: Saya jual karipap RM2 sebiji. Hari ini laku 50 biji. Kos membuatnya RM0.80 sebiji..."
                className="w-full rounded-xl sm:rounded-2xl border border-[#EBE1D7] p-3.5 sm:p-4 text-base text-[#171317] placeholder-[#9C8F99] bg-white focus:outline-none focus:ring-2 focus:ring-[#800020]/20 focus:border-[#800020] shadow-2xs leading-relaxed transition-all resize-y min-h-[140px] sm:min-h-[160px]"
              />
            </div>

            {/* Card Footer: Encouraging note & "Cuba ayat contoh" button */}
            <div className="flex items-center justify-between pt-1 gap-2 flex-wrap">
              <div className="flex items-center gap-1.5 text-xs text-[#7A6E77]">
                <LightBulbIcon className="w-4 h-4 text-[#800020] shrink-0" />
                <span>Tak perlu ayat yang sempurna!</span>
              </div>

              <button
                type="button"
                onClick={() => {
                  const sample =
                    'Saya jual karipap RM2 sebiji. Hari ini laku 50 biji. Kos membuatnya RM0.80 sebiji. Brownies RM8 satu, terjual 20 biji.'
                  setStory(sample)
                  if (onStoryChange) onStoryChange(sample)
                  setErrorMessage(null)
                  setClarification(null)
                }}
                disabled={isLoading}
                className="text-xs sm:text-sm font-bold text-[#800020] hover:text-[#70193D] hover:underline cursor-pointer min-h-[44px] inline-flex items-center transition-colors"
              >
                Cuba ayat contoh
              </button>
            </div>
          </div>

          {/* 3. Clarification Banner (if AI needs more details) */}
          {clarification && (
            <div className="bg-amber-50 border border-amber-200/80 rounded-2xl p-4 text-xs sm:text-sm text-amber-950 space-y-1.5 animate-in fade-in duration-150">
              <div className="font-bold flex items-center gap-1.5 text-amber-900">
                <span>💬</span>
                <span>Maklumat Tambahan Diperlukan:</span>
              </div>
              <p className="leading-relaxed text-amber-900">{clarification}</p>
              <p className="text-xs text-amber-800 italic">
                Sila tambahkan bilangan terjual atau harga pada kotak cerita di atas dan tekan &quot;Susun Jualan dengan AI&quot; sekali lagi.
              </p>
            </div>
          )}

          {/* 4. Error Banner (if extraction fails) */}
          {errorMessage && (
            <div className="bg-rose-50 border border-rose-200/80 rounded-2xl p-4 text-xs sm:text-sm text-rose-950 space-y-2 animate-in fade-in duration-150">
              <div className="font-bold flex items-center gap-1.5 text-rose-900">
                <span>⚠️</span>
                <span>Maaf Puan, ada sedikit masalah:</span>
              </div>
              <p className="leading-relaxed text-rose-800">{errorMessage}</p>

              {(errorMessage.includes('GEMINI_API_KEY') || errorMessage.includes('Kunci API') || errorMessage.includes('kunci API')) && (
                <div className="pt-2 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => setShowApiKeyModal(true)}
                    className="inline-flex items-center gap-1.5 bg-[#800020] hover:bg-[#70193D] active:scale-[0.98] text-white text-xs font-bold px-4 py-2 rounded-full shadow-2xs transition-all cursor-pointer min-h-[40px]"
                  >
                    <span>🔑</span>
                    <span>Masukkan Kunci API di sini</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleExtract}
                    disabled={isLoading || !story.trim()}
                    className="text-xs font-bold text-[#800020] hover:underline cursor-pointer inline-flex items-center gap-1 px-3 py-2 min-h-[40px]"
                  >
                    <span>Cuba semula</span>
                    <span aria-hidden="true">↻</span>
                  </button>
                </div>
              )}

              {!errorMessage.includes('GEMINI_API_KEY') && !errorMessage.includes('Kunci API') && !errorMessage.includes('kunci API') && (
                <button
                  type="button"
                  onClick={handleExtract}
                  disabled={isLoading || !story.trim()}
                  className="text-xs font-bold text-[#800020] hover:underline cursor-pointer inline-flex items-center gap-1 pt-1 min-h-[44px]"
                >
                  <span>Cuba semula sekarang</span>
                  <span aria-hidden="true">↻</span>
                </button>
              )}
            </div>
          )}

          {/* 5. Tips Box (Apple Bento Warm Champagne Tint Panel) */}
          <div
            className="apple-reveal-card bg-[#FAF4EA] border border-[#EBE1D7] rounded-[20px] p-3.5 sm:p-4 shadow-2xs space-y-1"
            style={{ animationDelay: '160ms' }}
          >
            <div className="flex items-center gap-1.5 text-[#800020] font-bold text-xs sm:text-sm">
              <SparklesIcon className="w-4 h-4 text-[#800020]" />
              <span>Tip Mudah Bercerita</span>
            </div>
            <p className="text-xs sm:text-sm text-[#4A3E4E] leading-relaxed">
              Sebut nama produk, harga dan jumlah yang terjual. Kos modal seunit boleh ditambah jika ada untuk pengiraan untung kasar yang tepat.
            </p>
          </div>

          {/* 6. Primary Action Button ("Susun Jualan dengan AI") */}
          <div className="apple-reveal-card space-y-2.5" style={{ animationDelay: '240ms' }}>
            <button
              type="button"
              onClick={handleExtract}
              disabled={isLoading || !story.trim()}
              className={`apple-hover-card w-full min-h-[48px] sm:min-h-[52px] rounded-full font-bold text-sm sm:text-base flex items-center justify-center gap-2 transition-all cursor-pointer shadow-xs ${
                isLoading || !story.trim()
                  ? 'bg-[#EFE9E2] text-[#9C8F99] border border-[#DFD3C7] cursor-not-allowed shadow-none'
                  : 'btn-primary-burgundy'
              }`}
              aria-busy={isLoading}
            >
              {isLoading ? (
                <span className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-white animate-ping" />
                  <span>AI Sedang Menyusun Jualan...</span>
                </span>
              ) : (
                <>
                  <SparklesIcon className="w-5 h-5 text-white" />
                  <span>Susun Jualan dengan AI</span>
                  <span aria-hidden="true">→</span>
                </>
              )}
            </button>

            {/* 7. Privacy Notice */}
            <div className="flex items-center justify-center gap-1.5 text-xs text-[#7A6E77] text-center pt-1 pb-1">
              <LockIcon className="w-3.5 h-3.5 text-[#0D7355] shrink-0" />
              <span>Maklumat dihantar kepada pembantu AI untuk diproses secara selamat.</span>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================
          Stage 2: Sales Data Review & Confirmation
          ======================================================== */}
      {isReview && extractedRecords !== null && (
        <div className="space-y-4 sm:space-y-5">
          {/* 1. Page Heading & Subtitle */}
          <div className="apple-reveal-card space-y-1" style={{ animationDelay: '0ms' }}>
            <h2 className="text-xl sm:text-2xl font-extrabold text-[#171317] font-heading tracking-tight leading-tight">
              Semak Jualan
            </h2>
            <p className="text-sm sm:text-base text-[#6B6069] font-body leading-relaxed">
              Mekara dah susunkan jualan Puan. Semak nama produk, kuantiti, harga dan kos sebelum simpan.
            </p>
          </div>

          {/* 2. Extraction Success Feedback Pill */}
          <div
            className="apple-reveal-card bg-[#E8F5E9] border border-[#C8E6C9] rounded-2xl p-3 sm:p-3.5 flex items-center gap-2.5 text-[#0D7355] shadow-2xs"
            style={{ animationDelay: '80ms' }}
          >
            <CheckCircleIcon className="w-5 h-5 text-[#0D7355] shrink-0" />
            <span className="text-xs sm:text-sm font-bold font-body">
              {extractedRecords.length} rekod jualan berjaya dikenal pasti
            </span>
          </div>

          {/* Toast Notification Banner (when record added, saved, or deleted) */}
          {toastMessage && (
            <div className="bg-[#E8F5E9] border border-[#C8E6C9] text-[#0D7355] text-xs sm:text-sm px-3.5 py-2.5 rounded-xl flex items-center gap-2 animate-in fade-in duration-150">
              <CheckCircleIcon className="w-4 h-4 text-[#0D7355] shrink-0" />
              <span className="font-semibold">{toastMessage}</span>
            </div>
          )}

          {/* 3. Section Title & "+ Tambah Jualan" Secondary Action */}
          <div className="flex items-center justify-between pt-1">
            <h3 className="text-base sm:text-lg font-bold text-[#171317] font-heading">
              Senarai Jualan
            </h3>
            <button
              type="button"
              onClick={() => {
                setIsAddingRecord(true)
                setEditingIndex(null)
                setFormError(null)
                setAddForm({
                  produk: '',
                  kuantiti: '',
                  harga: '',
                  kos: null,
                  tarikh: null,
                  saluran: null,
                })
              }}
              className="text-xs sm:text-sm font-bold text-[#800020] hover:text-[#70193D] bg-[#F8EAE8] hover:bg-[#F2DFDD] border border-[#EED7D5] px-3.5 py-1.5 rounded-full flex items-center gap-1 cursor-pointer min-h-[38px] transition-all active:scale-[0.98]"
            >
              <PlusIcon className="w-4 h-4 text-[#800020]" />
              <span>Tambah Jualan</span>
            </button>
          </div>

          {/* 4. Inline Expandable Form: "+ Tambah Jualan" */}
          {isAddingRecord && (
            <div className="bg-[#FAF6F0] border border-[#DFD3C7] rounded-[22px] p-4 sm:p-5 space-y-3.5 shadow-sm animate-in fade-in duration-150">
              <div className="flex items-center justify-between border-b border-[#EBE1D7] pb-2">
                <span className="text-sm font-bold text-[#171317] font-heading flex items-center gap-1.5">
                  <PlusIcon className="w-4 h-4 text-[#800020]" />
                  <span>Tambah Rekod Jualan Baru</span>
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setIsAddingRecord(false)
                    setFormError(null)
                  }}
                  className="text-xs font-semibold text-[#7A6E77] hover:text-[#171317] min-h-[44px] min-w-[44px] flex items-center justify-center cursor-pointer"
                >
                  Batal
                </button>
              </div>

              {formError && (
                <div className="bg-rose-50 border border-rose-200 text-rose-800 text-xs p-2.5 rounded-xl">
                  {formError}
                </div>
              )}

              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-bold text-[#171317] mb-1">
                    Nama Produk / Perkhidmatan *
                  </label>
                  <input
                    type="text"
                    value={addForm.produk}
                    onChange={(e) => setAddForm((p) => ({ ...p, produk: e.target.value }))}
                    placeholder="cth. Kuih Seri Muka"
                    className="w-full rounded-xl border border-[#EBE1D7] px-3.5 py-2.5 text-base sm:text-sm text-[#171317] placeholder-[#9C8F99] bg-white focus:outline-none focus:ring-2 focus:ring-[#800020]/20 focus:border-[#800020]"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label className="block text-xs font-bold text-[#171317] mb-1">
                      Kuantiti Terjual *
                    </label>
                    <input
                      type="number"
                      min="1"
                      inputMode="numeric"
                      value={String(addForm.kuantiti)}
                      onChange={(e) => setAddForm((p) => ({ ...p, kuantiti: e.target.value }))}
                      placeholder="cth. 30"
                      className="w-full rounded-xl border border-[#EBE1D7] px-3.5 py-2.5 text-base sm:text-sm text-[#171317] bg-white focus:outline-none focus:ring-2 focus:ring-[#800020]/20 focus:border-[#800020]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-[#171317] mb-1">
                      Harga Seunit (RM) *
                    </label>
                    <input
                      type="number"
                      step="0.10"
                      min="0"
                      inputMode="decimal"
                      value={String(addForm.harga)}
                      onChange={(e) => setAddForm((p) => ({ ...p, harga: e.target.value }))}
                      placeholder="cth. 2.50"
                      className="w-full rounded-xl border border-[#EBE1D7] px-3.5 py-2.5 text-base sm:text-sm text-[#171317] bg-white focus:outline-none focus:ring-2 focus:ring-[#800020]/20 focus:border-[#800020]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label className="block text-xs font-bold text-[#171317] mb-1">
                      Kos Seunit (RM) <span className="text-[#7A6E77] font-normal">(Pilihan)</span>
                    </label>
                    <input
                      type="number"
                      step="0.10"
                      min="0"
                      inputMode="decimal"
                      placeholder="cth. 1.00"
                      value={
                        addForm.kos !== null && addForm.kos !== undefined
                          ? String(addForm.kos)
                          : ''
                      }
                      onChange={(e) =>
                        setAddForm((p) => ({
                          ...p,
                          kos: e.target.value !== '' ? Number(e.target.value) : null,
                        }))
                      }
                      className="w-full rounded-xl border border-[#EBE1D7] px-3.5 py-2.5 text-base sm:text-sm text-[#171317] bg-white focus:outline-none focus:ring-2 focus:ring-[#800020]/20 focus:border-[#800020]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-[#171317] mb-1">
                      Saluran Jualan <span className="text-[#7A6E77] font-normal">(Pilihan)</span>
                    </label>
                    <select
                      value={addForm.saluran || ''}
                      onChange={(e) =>
                        setAddForm((p) => ({
                          ...p,
                          saluran: e.target.value ? (e.target.value as any) : null,
                        }))
                      }
                      className="w-full rounded-xl border border-[#EBE1D7] px-3.5 py-2.5 text-base sm:text-sm text-[#171317] bg-white focus:outline-none focus:ring-2 focus:ring-[#800020]/20 focus:border-[#800020] cursor-pointer"
                    >
                      <option value="">Tiada</option>
                      <option value="Gerai">Gerai</option>
                      <option value="Booth">Booth</option>
                      <option value="WhatsApp">WhatsApp</option>
                      <option value="Online">Online</option>
                      <option value="Tempahan">Tempahan</option>
                      <option value="TikTok Shop">TikTok Shop</option>
                      <option value="Bazar">Bazar</option>
                      <option value="Kiosk">Kiosk</option>
                      <option value="Lain-lain">Lain-lain</option>
                    </select>
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-2">
                  <button
                    type="button"
                    onClick={handleSaveNewRecord}
                    className="flex-1 btn-primary-burgundy text-sm"
                  >
                    Simpan Jualan
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setIsAddingRecord(false)
                      setFormError(null)
                    }}
                    className="btn-secondary-neutral text-sm px-4"
                  >
                    Batal
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* 5. Sales Record Cards List */}
          <div className="space-y-3">
            {extractedRecords.map((r, idx) => {
              const isEditing = editingIndex === idx

              if (isEditing) {
                return (
                  <div
                    key={idx}
                    className="bg-[#FAF6F0] border border-[#DFD3C7] rounded-[22px] p-4 sm:p-5 space-y-3.5 shadow-sm animate-in fade-in duration-150"
                  >
                    <div className="flex items-center justify-between border-b border-[#EBE1D7] pb-2">
                      <span className="text-sm font-bold text-[#800020] font-heading">
                        Edit Rekod #{idx + 1}: {r.produk}
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          setEditingIndex(null)
                          setFormError(null)
                        }}
                        className="text-xs font-semibold text-[#7A6E77] hover:text-[#171317] min-h-[44px] min-w-[44px] flex items-center justify-center cursor-pointer"
                      >
                        Batal
                      </button>
                    </div>

                    {formError && (
                      <div className="bg-rose-50 border border-rose-200 text-rose-800 text-xs p-2.5 rounded-xl">
                        {formError}
                      </div>
                    )}

                    <div className="space-y-3">
                      <div>
                        <label className="block text-xs font-bold text-[#171317] mb-1">
                          Nama Produk / Servis *
                        </label>
                        <input
                          type="text"
                          value={editForm.produk}
                          onChange={(e) => setEditForm((p) => ({ ...p, produk: e.target.value }))}
                          className="w-full rounded-xl border border-[#EBE1D7] px-3.5 py-2.5 text-base sm:text-sm text-[#171317] bg-white focus:outline-none focus:ring-2 focus:ring-[#800020]/20 focus:border-[#800020]"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-2.5">
                        <div>
                          <label className="block text-xs font-bold text-[#171317] mb-1">
                            Kuantiti Terjual *
                          </label>
                          <input
                            type="number"
                            min="1"
                            inputMode="numeric"
                            value={String(editForm.kuantiti)}
                            onChange={(e) =>
                              setEditForm((p) => ({ ...p, kuantiti: Number(e.target.value) }))
                            }
                            className="w-full rounded-xl border border-[#EBE1D7] px-3.5 py-2.5 text-base sm:text-sm text-[#171317] bg-white focus:outline-none focus:ring-2 focus:ring-[#800020]/20 focus:border-[#800020]"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-[#171317] mb-1">
                            Harga Seunit (RM) *
                          </label>
                          <input
                            type="number"
                            step="0.10"
                            min="0"
                            inputMode="decimal"
                            value={String(editForm.harga)}
                            onChange={(e) =>
                              setEditForm((p) => ({ ...p, harga: Number(e.target.value) }))
                            }
                            className="w-full rounded-xl border border-[#EBE1D7] px-3.5 py-2.5 text-base sm:text-sm text-[#171317] bg-white focus:outline-none focus:ring-2 focus:ring-[#800020]/20 focus:border-[#800020]"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2.5">
                        <div>
                          <label className="block text-xs font-bold text-[#171317] mb-1">
                            Kos Seunit (RM) <span className="text-[#7A6E77] font-normal">(Pilihan)</span>
                          </label>
                          <input
                            type="number"
                            step="0.10"
                            min="0"
                            inputMode="decimal"
                            placeholder="cth. 1.00"
                            value={
                              editForm.kos !== null && editForm.kos !== undefined
                                ? String(editForm.kos)
                                : ''
                            }
                            onChange={(e) =>
                              setEditForm((p) => ({
                                ...p,
                                kos: e.target.value !== '' ? Number(e.target.value) : null,
                              }))
                            }
                            className="w-full rounded-xl border border-[#EBE1D7] px-3.5 py-2.5 text-base sm:text-sm text-[#171317] bg-white focus:outline-none focus:ring-2 focus:ring-[#800020]/20 focus:border-[#800020]"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-[#171317] mb-1">
                            Saluran Jualan <span className="text-[#7A6E77] font-normal">(Pilihan)</span>
                          </label>
                          <select
                            value={editForm.saluran || ''}
                            onChange={(e) =>
                              setEditForm((p) => ({
                                ...p,
                                saluran: e.target.value ? (e.target.value as any) : null,
                              }))
                            }
                            className="w-full rounded-xl border border-[#EBE1D7] px-3.5 py-2.5 text-base sm:text-sm text-[#171317] bg-white focus:outline-none focus:ring-2 focus:ring-[#800020]/20 focus:border-[#800020] cursor-pointer"
                          >
                            <option value="">Tiada</option>
                            <option value="Gerai">Gerai</option>
                            <option value="Booth">Booth</option>
                            <option value="WhatsApp">WhatsApp</option>
                            <option value="Online">Online</option>
                            <option value="Tempahan">Tempahan</option>
                            <option value="TikTok Shop">TikTok Shop</option>
                            <option value="Bazar">Bazar</option>
                            <option value="Kiosk">Kiosk</option>
                            <option value="Lain-lain">Lain-lain</option>
                          </select>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 pt-2">
                        <button
                          type="button"
                          onClick={handleSaveEdit}
                          className="flex-1 btn-primary-burgundy text-sm"
                        >
                          Simpan Pembetulan
                        </button>
                        <button
                          type="button"
                          onClick={() => handleRemoveRecord(idx)}
                          className="min-h-[44px] px-3.5 border border-rose-200 text-rose-600 hover:bg-rose-50 rounded-xl text-xs font-bold flex items-center gap-1 cursor-pointer transition-colors"
                        >
                          <TrashIcon className="w-3.5 h-3.5" />
                          <span>Padam</span>
                        </button>
                      </div>
                    </div>
                  </div>
                )
              }

              return (
                <div
                  key={idx}
                  className="bg-white border border-[#EBE1D7] hover:border-[#DFD4C8] rounded-[20px] p-4 sm:p-5 shadow-2xs space-y-2.5 transition-all"
                >
                  {/* Top Row: Badge + Product Name & Sales Channel */}
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-6 h-6 rounded-full bg-[#FAF0E6] border border-[#EBE1D7] text-[#800020] font-bold text-xs flex items-center justify-center shrink-0">
                        {idx + 1}
                      </div>
                      <h4 className="text-base sm:text-lg font-bold text-[#171317] font-heading break-words">
                        {r.produk}
                      </h4>
                    </div>
                    {r.saluran && (
                      <span className="text-[11px] font-semibold text-[#800020] bg-[#F8EAE8] border border-[#EED7D5] px-2.5 py-0.5 rounded-full shrink-0">
                        {r.saluran}
                      </span>
                    )}
                  </div>

                  {/* Middle Row: Quantity × Price & Calculated Total */}
                  <div className="flex items-baseline justify-between gap-2">
                    <span className="text-sm text-[#4A3E4E] font-body">
                      {r.kuantiti} unit &times; {formatRM(Number(r.harga))}
                    </span>
                    <span className="text-base sm:text-lg font-extrabold text-[#1C151F] font-heading tabular-nums">
                      {formatRM(Number(r.kuantiti) * Number(r.harga))}
                    </span>
                  </div>

                  {/* Bottom Row: Unit cost & Edit button */}
                  <div className="flex items-center justify-between pt-1">
                    <div className="text-xs text-[#786C7C]">
                      {r.kos !== null && r.kos !== undefined ? (
                        <span>Kos seunit: {formatRM(Number(r.kos))}</span>
                      ) : (
                        <span className="text-amber-700 italic">Kos seunit: Tiada maklumat</span>
                      )}
                      {r.tarikh && (
                        <span className="ml-2 text-gray-400">&bull; {formatDateMY(r.tarikh)}</span>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={() => handleStartEdit(idx)}
                      className="btn-secondary-neutral text-xs py-1 px-3 min-h-[36px] rounded-full"
                      aria-label={`Edit ${r.produk}`}
                    >
                      <PencilIcon className="w-3.5 h-3.5" />
                      <span>Edit</span>
                    </button>
                  </div>
                </div>
              )
            })}
          </div>

          {/* 6. Operating Expenses Section (Kos Operasi) */}
          <div className="bg-[#FAF6F0] border border-[#EBE1D7] rounded-[20px] p-4 sm:p-5 shadow-[0_2px_12px_rgba(23,19,23,0.02)] space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ReceiptIcon className="w-4 h-4 text-[#800020] shrink-0" />
                <h4 className="text-sm sm:text-base font-bold text-[#171317] font-heading">
                  Kos Operasi (Pilihan)
                </h4>
              </div>
              <span className="text-xs text-[#7A6E77] font-medium">Pilihan</span>
            </div>

            <p className="text-xs text-[#7A6E77]">
              Sewa gerai, bil elektrik, pengangkutan dan perbelanjaan sampingan lain.
            </p>

            {!isOpexExpanded && opexInput.trim() === '' ? (
              <button
                type="button"
                onClick={() => setIsOpexExpanded(true)}
                className="text-xs sm:text-sm font-bold text-[#800020] hover:text-[#70193D] flex items-center justify-between w-full pt-1 cursor-pointer min-h-[44px]"
              >
                <span>+ Tambah kos operasi</span>
                <ChevronRightIcon className="w-4 h-4 text-[#800020]" />
              </button>
            ) : (
              <div className="pt-2 space-y-2">
                <div className="flex items-center gap-2">
                  <div className="relative flex-1">
                    <span className="absolute left-3 top-2.5 text-xs font-bold text-[#7A6E77]">
                      RM
                    </span>
                    <input
                      id="opex-input"
                      type="number"
                      min="0"
                      step="1"
                      inputMode="decimal"
                      placeholder="0.00"
                      value={opexInput}
                      onChange={(e) => setOpexInput(e.target.value)}
                      className="w-full pl-9 pr-3 py-2.5 rounded-full border border-[#EBE1D7] text-base sm:text-sm text-[#171317] font-semibold bg-white focus:outline-none focus:ring-2 focus:ring-[#800020]/15 focus:border-[#800020]"
                    />
                  </div>
                  {opexInput.trim() !== '' && (
                    <button
                      type="button"
                      onClick={() => {
                        setOpexInput('')
                        setIsOpexExpanded(false)
                      }}
                      className="text-xs text-[#7A6E77] hover:text-rose-600 px-2 py-2 min-h-[44px] cursor-pointer"
                    >
                      Padam
                    </button>
                  )}
                </div>
                <p className="text-[11px] text-[#7A6E77] italic">
                  * Biarkan kosong jika tiada perbelanjaan operasi lain.
                </p>
              </div>
            )}
          </div>

          {/* 7. Total Summary Bar (Jumlah Jualan) */}
          <div
            className="apple-reveal-card bg-[#F5ECE0] border border-[#EBE1D7] rounded-[20px] p-4 sm:p-5 flex items-center justify-between shadow-[0_2px_8px_rgba(23,19,23,0.02)]"
            style={{ animationDelay: '200ms' }}
          >
            <span className="text-sm sm:text-base font-semibold text-[#171317] font-body">
              Jumlah Jualan
            </span>
            <span className="text-lg sm:text-xl font-extrabold text-[#171317] font-heading tabular-nums">
              {formatRM(totalRevenue)}
            </span>
          </div>

          {/* 8. Primary Confirmation Button & Back Action */}
          <div className="apple-reveal-card space-y-3 pt-1" style={{ animationDelay: '280ms' }}>
            <button
              type="button"
              onClick={handleConfirmAndProceed}
              disabled={extractedRecords.length === 0}
              className={`apple-hover-card w-full min-h-[48px] sm:min-h-[52px] rounded-full font-bold text-base flex items-center justify-center gap-2 transition-all cursor-pointer shadow-[0_4px_14px_rgba(128,0,32,0.28)] ${
                extractedRecords.length === 0
                  ? 'bg-gray-100 text-gray-400 border border-gray-200 cursor-not-allowed shadow-none'
                  : 'btn-primary-burgundy'
              }`}
            >
              <CheckCircleIcon className="w-5 h-5 text-white" />
              <span>Sahkan &amp; Jana Laporan</span>
            </button>

            <div className="text-center">
              <button
                type="button"
                onClick={() => {
                  setExtractedRecords(null)
                  setEditingIndex(null)
                  setIsAddingRecord(false)
                  if (onReviewStageChange) onReviewStageChange(false)
                }}
                className="text-xs sm:text-sm font-semibold text-[#7A6E77] hover:text-[#800020] hover:underline cursor-pointer min-h-[44px] inline-flex items-center gap-1 transition-colors"
              >
                <span aria-hidden="true">&larr;</span>
                <span>Ubah cerita jualan</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* API Key Modal */}
      <ApiKeyModal
        isOpen={showApiKeyModal}
        onClose={() => setShowApiKeyModal(false)}
      />
    </div>
  )
}
