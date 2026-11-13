import { useState } from 'react'
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
import { formatRM, formatDateMY, validateRecords } from '../data/validate'
import type { RawSale } from '../types'

export interface StoryInputFormProps {
  onConfirm: (records: RawSale[], operatingExpenses: number | null) => void
  onBack?: () => void
  initialStory?: string
  onStoryChange?: (val: string) => void
  isReviewStage?: boolean
  onReviewStageChange?: (isReview: boolean) => void
}

export function StoryInputForm({
  onConfirm,
  onBack: _onBack,
  initialStory = '',
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
  const [extractedRecords, setExtractedRecords] = useState<RawSale[] | null>(null)
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
    if (!editForm.kuantiti || Number(editForm.kuantiti) <= 0) {
      setFormError('Sila masukkan kuantiti jualan yang sah (lebih daripada 0).')
      return
    }
    if (editForm.harga === '' || Number(editForm.harga) < 0) {
      setFormError('Sila masukkan harga jualan seunit yang sah.')
      return
    }

    const updated = [...extractedRecords]
    updated[editingIndex] = {
      ...editForm,
      produk: editForm.produk.trim(),
      kuantiti: Number(editForm.kuantiti),
      harga: Number(editForm.harga),
      kos:
        editForm.kos !== null && editForm.kos !== undefined && String(editForm.kos).trim() !== ''
          ? Number(editForm.kos)
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
    if (!addForm.kuantiti || Number(addForm.kuantiti) <= 0) {
      setFormError('Sila masukkan kuantiti jualan yang sah (lebih daripada 0).')
      return
    }
    if (addForm.harga === '' || Number(addForm.harga) < 0) {
      setFormError('Sila masukkan harga jualan seunit yang sah.')
      return
    }

    const newRecord: RawSale = {
      produk: addForm.produk.trim(),
      kuantiti: Number(addForm.kuantiti),
      harga: Number(addForm.harga),
      kos:
        addForm.kos !== null && addForm.kos !== undefined && String(addForm.kos).trim() !== ''
          ? Number(addForm.kos)
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
    <div className="space-y-4 sm:space-y-5 max-w-xl mx-auto">
      {/* ========================================================
          Stage 1: Story Input Area (Ceritakan Jualan Puan)
          ======================================================== */}
      {!isReview && (
        <div className="space-y-4 sm:space-y-5 animate-fadeIn">
          {/* 1. Main Heading & Subtitle */}
          <div className="space-y-1">
            <h2 className="text-xl sm:text-2xl font-extrabold text-[#28152F] font-heading tracking-tight leading-tight">
              Apa yang Puan jual hari ini?
            </h2>
            <p className="text-sm sm:text-base text-[#68586B] font-body leading-relaxed">
              Cerita sahaja seperti biasa. AI akan bantu susunkan maklumat jualan Puan.
            </p>
          </div>

          {/* 3. Story Input Card */}
          <div className="bg-white border border-[#F1D3E3] rounded-3xl p-4 sm:p-5 shadow-xs space-y-3">
            {/* Card Header Label */}
            <div className="flex items-center gap-2 text-[#28152F]">
              <AiChatBubbleIcon className="w-5 h-5 text-[#BE1E72] shrink-0" />
              <label htmlFor="story-input" className="text-base font-bold font-heading">
                Cerita jualan Puan
              </label>
            </div>

            {/* Textarea Input Container */}
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
                className="w-full rounded-2xl border border-gray-200 p-3.5 sm:p-4 text-base text-[#28152F] placeholder-gray-400 bg-white focus:outline-none focus:ring-2 focus:ring-[#BE1E72]/20 focus:border-[#BE1E72] shadow-2xs leading-relaxed transition-all resize-y min-h-[140px] sm:min-h-[160px]"
              />
            </div>

            {/* Card Footer: Encouraging note & "Cuba ayat contoh" button */}
            <div className="flex items-center justify-between pt-1 gap-2 flex-wrap">
              <div className="flex items-center gap-1.5 text-xs text-[#68586B]">
                <LightBulbIcon className="w-4 h-4 text-[#F472B6] shrink-0" />
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
                className="text-xs sm:text-sm font-bold text-[#BE1E72] hover:text-[#A3165F] hover:underline cursor-pointer min-h-[44px] inline-flex items-center transition-colors"
              >
                Cuba ayat contoh
              </button>
            </div>
          </div>

          {/* 4. Clarification Banner (if AI needs more details) */}
          {clarification && (
            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 text-xs sm:text-sm text-amber-950 space-y-1.5 animate-fadeIn">
              <div className="font-bold flex items-center gap-1.5 text-amber-900">
                <span>💬</span>
                <span>Maklumat Tambahan Diperlukan:</span>
              </div>
              <p className="leading-relaxed text-amber-900">{clarification}</p>
              <p className="text-xs text-amber-700 italic">
                Sila tambahkan bilangan terjual atau harga pada kotak cerita di atas dan tekan &quot;Susun Jualan dengan AI&quot; sekali lagi.
              </p>
            </div>
          )}

          {/* 5. Error Banner (if extraction fails) */}
          {errorMessage && (
            <div className="bg-rose-50 border border-rose-200 rounded-2xl p-4 text-xs sm:text-sm text-rose-950 space-y-2 animate-fadeIn">
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
                    className="inline-flex items-center gap-1.5 bg-[#BE1E72] hover:bg-[#A3165F] active:bg-[#8B0F4E] text-white text-xs font-bold px-3.5 py-2 rounded-xl shadow-xs transition-all cursor-pointer min-h-[38px]"
                  >
                    <span>🔑</span>
                    <span>Masukkan Kunci API di sini</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleExtract}
                    disabled={isLoading || !story.trim()}
                    className="text-xs font-bold text-[#BE1E72] hover:underline cursor-pointer inline-flex items-center gap-1 px-3 py-2 min-h-[38px]"
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
                  className="text-xs font-bold text-[#BE1E72] hover:underline cursor-pointer inline-flex items-center gap-1 pt-1 min-h-[44px]"
                >
                  <span>Cuba semula sekarang</span>
                  <span aria-hidden="true">↻</span>
                </button>
              )}
            </div>
          )}

          {/* 6. Tips Box (Soft Pink Informational Panel) */}
          <div className="bg-[#FFF5FA] border border-[#F1D3E3] rounded-2xl p-3.5 sm:p-4 shadow-2xs space-y-1">
            <div className="flex items-center gap-1.5 text-[#BE1E72] font-bold text-xs sm:text-sm">
              <SparklesIcon className="w-4 h-4 text-[#BE1E72] shrink-0" />
              <span>Tip mudah</span>
            </div>
            <p className="text-xs sm:text-sm text-[#28152F] leading-relaxed">
              Sebut nama produk, harga dan jumlah yang terjual. Kos boleh ditambah jika ada.
            </p>
          </div>

          {/* 7. Primary Action Button ("Susun Jualan dengan AI") */}
          <button
            type="button"
            onClick={handleExtract}
            disabled={isLoading || !story.trim()}
            className={`w-full min-h-[48px] sm:min-h-[52px] rounded-2xl font-bold text-base flex items-center justify-center gap-2 transition-all cursor-pointer shadow-sm ${
              isLoading || !story.trim()
                ? 'bg-gray-200 text-gray-400 border border-gray-200 cursor-not-allowed shadow-none'
                : 'bg-[#BE1E72] hover:bg-[#A3165F] active:bg-[#8B0F4E] active:scale-[0.99] text-white shadow-pink-300/50'
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

          {/* 8. Privacy Notice */}
          <div className="flex items-center justify-center gap-1.5 text-xs text-[#68586B] text-center pt-1 pb-1">
            <LockIcon className="w-3.5 h-3.5 text-[#68586B] shrink-0" />
            <span>Maklumat dihantar kepada pembantu AI untuk diproses.</span>
          </div>
        </div>
      )}

      {/* ========================================================
          Stage 2: Sales Data Review & Confirmation (Berry Pop Redesign 03)
          ======================================================== */}
      {isReview && extractedRecords !== null && (
        <div className="space-y-4 sm:space-y-5 animate-fadeIn">
          {/* 1. Page Heading & Subtitle */}
          <div className="space-y-1">
            <h2 className="text-xl sm:text-2xl font-extrabold text-[#28152F] font-heading tracking-tight leading-tight">
              Betul ke maklumat ini, Puan?
            </h2>
            <p className="text-sm sm:text-base text-[#68586B] font-body leading-relaxed">
              Semak jualan yang AI susunkan. Puan boleh ubah jika ada kesilapan.
            </p>
          </div>

          {/* 2. Extraction Success Feedback Pill */}
          <div className="bg-[#E6F4F1] border border-[#A7D7CD] rounded-2xl p-3 sm:p-3.5 flex items-center gap-2.5 text-[#0D9488] shadow-2xs">
            <CheckCircleIcon className="w-5 h-5 text-[#0D9488] shrink-0" />
            <span className="text-xs sm:text-sm font-bold font-body">
              {extractedRecords.length} rekod berjaya dikenal pasti
            </span>
          </div>

          {/* Toast Notification Banner (when record added, saved, or deleted) */}
          {toastMessage && (
            <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs sm:text-sm px-3.5 py-2.5 rounded-xl flex items-center gap-2 animate-fadeIn">
              <CheckCircleIcon className="w-4 h-4 text-emerald-600 shrink-0" />
              <span className="font-semibold">{toastMessage}</span>
            </div>
          )}

          {/* 3. Section Title & "+ Tambah Jualan" Secondary Action */}
          <div className="flex items-center justify-between pt-1">
            <h3 className="text-base sm:text-lg font-bold text-[#28152F] font-heading">
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
              className="text-xs sm:text-sm font-bold text-[#BE1E72] hover:text-[#A3165F] flex items-center gap-1 cursor-pointer min-h-[44px] px-2 transition-colors"
            >
              <PlusIcon className="w-4 h-4 text-[#BE1E72]" />
              <span>Tambah</span>
            </button>
          </div>

          {/* 4. Inline Expandable Form: "+ Tambah Jualan" */}
          {isAddingRecord && (
            <div className="bg-white border-2 border-[#BE1E72]/30 rounded-3xl p-4 sm:p-5 space-y-3.5 shadow-sm animate-fadeIn">
              <div className="flex items-center justify-between border-b border-gray-100 pb-2">
                <span className="text-sm font-bold text-[#28152F] font-heading flex items-center gap-1.5">
                  <PlusIcon className="w-4 h-4 text-[#BE1E72]" />
                  <span>Tambah Rekod Jualan Baru</span>
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setIsAddingRecord(false)
                    setFormError(null)
                  }}
                  className="text-xs font-semibold text-[#68586B] hover:text-[#28152F] min-h-[44px] min-w-[44px] flex items-center justify-center cursor-pointer"
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
                  <label className="block text-xs font-bold text-[#28152F] mb-1">
                    Nama Produk / Perkhidmatan *
                  </label>
                  <input
                    type="text"
                    value={addForm.produk}
                    onChange={(e) => setAddForm((p) => ({ ...p, produk: e.target.value }))}
                    placeholder="cth. Kuih Seri Muka"
                    className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm text-[#28152F] focus:outline-none focus:ring-2 focus:ring-[#BE1E72]/20 focus:border-[#BE1E72]"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label className="block text-xs font-bold text-[#28152F] mb-1">
                      Kuantiti Terjual *
                    </label>
                    <input
                      type="number"
                      min="1"
                      inputMode="numeric"
                      value={String(addForm.kuantiti)}
                      onChange={(e) => setAddForm((p) => ({ ...p, kuantiti: e.target.value }))}
                      placeholder="cth. 30"
                      className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm text-[#28152F] focus:outline-none focus:ring-2 focus:ring-[#BE1E72]/20 focus:border-[#BE1E72]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-[#28152F] mb-1">
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
                      className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm text-[#28152F] focus:outline-none focus:ring-2 focus:ring-[#BE1E72]/20 focus:border-[#BE1E72]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label className="block text-xs font-bold text-[#28152F] mb-1">
                      Kos Seunit (RM) <span className="text-[#68586B] font-normal">(Pilihan)</span>
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
                      className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm text-[#28152F] focus:outline-none focus:ring-2 focus:ring-[#BE1E72]/20 focus:border-[#BE1E72]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-[#28152F] mb-1">
                      Saluran Jualan <span className="text-[#68586B] font-normal">(Pilihan)</span>
                    </label>
                    <select
                      value={addForm.saluran || ''}
                      onChange={(e) =>
                        setAddForm((p) => ({
                          ...p,
                          saluran: e.target.value ? (e.target.value as any) : null,
                        }))
                      }
                      className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm text-[#28152F] bg-white focus:outline-none focus:ring-2 focus:ring-[#BE1E72]/20 focus:border-[#BE1E72]"
                    >
                      <option value="">Tiada</option>
                      <option value="Booth">Booth / Gerai</option>
                      <option value="Online">Online</option>
                      <option value="Lain-lain">Lain-lain</option>
                    </select>
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-2">
                  <button
                    type="button"
                    onClick={handleSaveNewRecord}
                    className="flex-1 min-h-[44px] bg-[#BE1E72] hover:bg-[#A3165F] active:scale-[0.99] text-white font-bold text-sm rounded-xl transition-all cursor-pointer shadow-xs"
                  >
                    Simpan Jualan
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setIsAddingRecord(false)
                      setFormError(null)
                    }}
                    className="min-h-[44px] px-4 border border-gray-200 text-[#68586B] hover:text-[#28152F] font-bold text-sm rounded-xl transition-all cursor-pointer"
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
                    className="bg-white border-2 border-[#BE1E72]/40 rounded-3xl p-4 sm:p-5 space-y-3.5 shadow-sm animate-fadeIn"
                  >
                    <div className="flex items-center justify-between border-b border-gray-100 pb-2">
                      <span className="text-sm font-bold text-[#BE1E72] font-heading">
                        Edit Rekod #{idx + 1}: {r.produk}
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          setEditingIndex(null)
                          setFormError(null)
                        }}
                        className="text-xs font-semibold text-[#68586B] hover:text-[#28152F] min-h-[44px] min-w-[44px] flex items-center justify-center cursor-pointer"
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
                        <label className="block text-xs font-bold text-[#28152F] mb-1">
                          Nama Produk / Servis *
                        </label>
                        <input
                          type="text"
                          value={editForm.produk}
                          onChange={(e) => setEditForm((p) => ({ ...p, produk: e.target.value }))}
                          className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm text-[#28152F] focus:outline-none focus:ring-2 focus:ring-[#BE1E72]/20 focus:border-[#BE1E72]"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-2.5">
                        <div>
                          <label className="block text-xs font-bold text-[#28152F] mb-1">
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
                            className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm text-[#28152F] focus:outline-none focus:ring-2 focus:ring-[#BE1E72]/20 focus:border-[#BE1E72]"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-[#28152F] mb-1">
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
                            className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm text-[#28152F] focus:outline-none focus:ring-2 focus:ring-[#BE1E72]/20 focus:border-[#BE1E72]"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2.5">
                        <div>
                          <label className="block text-xs font-bold text-[#28152F] mb-1">
                            Kos Seunit (RM) <span className="text-[#68586B] font-normal">(Pilihan)</span>
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
                            className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm text-[#28152F] focus:outline-none focus:ring-2 focus:ring-[#BE1E72]/20 focus:border-[#BE1E72]"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-[#28152F] mb-1">
                            Saluran Jualan <span className="text-[#68586B] font-normal">(Pilihan)</span>
                          </label>
                          <select
                            value={editForm.saluran || ''}
                            onChange={(e) =>
                              setEditForm((p) => ({
                                ...p,
                                saluran: e.target.value ? (e.target.value as any) : null,
                              }))
                            }
                            className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm text-[#28152F] bg-white focus:outline-none focus:ring-2 focus:ring-[#BE1E72]/20 focus:border-[#BE1E72]"
                          >
                            <option value="">Tiada</option>
                            <option value="Booth">Booth / Gerai</option>
                            <option value="Online">Online</option>
                            <option value="Lain-lain">Lain-lain</option>
                          </select>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 pt-2">
                        <button
                          type="button"
                          onClick={handleSaveEdit}
                          className="flex-1 min-h-[44px] bg-[#BE1E72] hover:bg-[#A3165F] active:scale-[0.99] text-white font-bold text-sm rounded-xl transition-all cursor-pointer shadow-xs"
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
                  className="bg-white border border-[#F1D3E3] rounded-3xl p-4 sm:p-5 shadow-xs space-y-2.5 transition-all hover:border-pink-300"
                >
                  {/* Top Row: Badge + Product Name & Sales Channel */}
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-6 h-6 rounded-full bg-pink-100 text-[#BE1E72] font-bold text-xs flex items-center justify-center shrink-0">
                        {idx + 1}
                      </div>
                      <h4 className="text-base sm:text-lg font-bold text-[#28152F] font-heading break-words">
                        {r.produk}
                      </h4>
                    </div>
                    {r.saluran && (
                      <span className="text-xs text-[#68586B] font-medium shrink-0">
                        {r.saluran}
                      </span>
                    )}
                  </div>

                  {/* Middle Row: Quantity × Price & Calculated Total */}
                  <div className="flex items-baseline justify-between gap-2">
                    <span className="text-sm text-[#68586B] font-body">
                      {r.kuantiti} unit &times; {formatRM(Number(r.harga))}
                    </span>
                    <span className="text-base sm:text-lg font-extrabold text-[#28152F] font-heading">
                      {formatRM(Number(r.kuantiti) * Number(r.harga))}
                    </span>
                  </div>

                  {/* Bottom Row: Unit cost & Edit button */}
                  <div className="flex items-center justify-between pt-1">
                    <div className="text-xs text-[#68586B]">
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
                      className="border border-gray-200 hover:border-[#BE1E72] hover:bg-pink-50/50 text-[#28152F] hover:text-[#BE1E72] rounded-full px-3 py-1 flex items-center gap-1 text-xs font-semibold transition-colors cursor-pointer min-h-[36px]"
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

          {/* 6. Operating Expenses Section (Perbelanjaan Operasi) */}
          <div className="bg-white border border-[#F1D3E3] rounded-3xl p-4 sm:p-5 shadow-xs space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ReceiptIcon className="w-4 h-4 text-[#BE1E72] shrink-0" />
                <h4 className="text-sm sm:text-base font-bold text-[#28152F] font-heading">
                  Perbelanjaan Operasi
                </h4>
              </div>
              <span className="text-xs text-[#68586B] font-medium">Pilihan</span>
            </div>

            <p className="text-xs text-[#68586B]">
              Sewa gerai, bil elektrik, pengangkutan dan lain-lain.
            </p>

            {!isOpexExpanded && opexInput.trim() === '' ? (
              <button
                type="button"
                onClick={() => setIsOpexExpanded(true)}
                className="text-xs sm:text-sm font-bold text-[#BE1E72] hover:text-[#A3165F] flex items-center justify-between w-full pt-1 cursor-pointer min-h-[44px]"
              >
                <span>+ Tambah perbelanjaan</span>
                <ChevronRightIcon className="w-4 h-4 text-[#BE1E72]" />
              </button>
            ) : (
              <div className="pt-2 space-y-2">
                <div className="flex items-center gap-2">
                  <div className="relative flex-1">
                    <span className="absolute left-3 top-2.5 text-xs font-bold text-gray-500">
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
                      className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-gray-200 text-sm text-[#28152F] font-semibold focus:outline-none focus:ring-2 focus:ring-[#BE1E72]/20 focus:border-[#BE1E72]"
                    />
                  </div>
                  {opexInput.trim() !== '' && (
                    <button
                      type="button"
                      onClick={() => {
                        setOpexInput('')
                        setIsOpexExpanded(false)
                      }}
                      className="text-xs text-[#68586B] hover:text-rose-600 px-2 py-2 min-h-[44px] cursor-pointer"
                    >
                      Padam
                    </button>
                  )}
                </div>
                <p className="text-[11px] text-[#68586B] italic">
                  * Biarkan kosong jika tiada perbelanjaan operasi.
                </p>
              </div>
            )}
          </div>

          {/* 7. Total Summary Bar (Jumlah Jualan) */}
          <div className="bg-[#FFF5FA] border border-[#F1D3E3] rounded-3xl p-4 sm:p-5 flex items-center justify-between shadow-2xs">
            <span className="text-sm sm:text-base font-semibold text-[#68586B] font-body">
              Jumlah jualan
            </span>
            <span className="text-lg sm:text-xl font-extrabold text-[#28152F] font-heading">
              {formatRM(totalRevenue)}
            </span>
          </div>

          {/* 8. Primary Confirmation Button & Back Action */}
          <div className="space-y-3 pt-1">
            <button
              type="button"
              onClick={handleConfirmAndProceed}
              disabled={extractedRecords.length === 0}
              className={`w-full min-h-[48px] sm:min-h-[52px] rounded-2xl font-bold text-base flex items-center justify-center gap-2 transition-all cursor-pointer shadow-sm ${
                extractedRecords.length === 0
                  ? 'bg-gray-200 text-gray-400 border border-gray-200 cursor-not-allowed shadow-none'
                  : 'bg-[#BE1E72] hover:bg-[#A3165F] active:bg-[#8B0F4E] active:scale-[0.99] text-white shadow-pink-300/50'
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
                className="text-xs sm:text-sm font-semibold text-[#68586B] hover:text-[#BE1E72] hover:underline cursor-pointer min-h-[44px] inline-flex items-center gap-1 transition-colors"
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
