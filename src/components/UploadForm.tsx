import React, { useState, useEffect } from 'react'
import {
  SpreadsheetIcon,
  UploadArrowIcon,
  LightBulbIcon,
  LockIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  DownloadIcon,
  AdjustmentsHorizontalIcon,
  XMarkIcon,
} from './ui/Icons'
import {
  parseCSV,
  parseExcel,
  isValidFile,
  applyMapping,
} from '../data/parse'
import { generateAndDownloadExcelTemplate } from '../data/templateGenerator'
import { validateRecords, formatRM, formatDateMY, parseCurrency, parseQuantity, normalizeDate, normalizeChannel } from '../data/validate'
import type { RawSale, ColumnMapping } from '../types'

export interface UploadFormProps {
  onConfirm: (records: RawSale[]) => void
  onBack: () => void
}

export function UploadForm({ onConfirm, onBack }: UploadFormProps) {
  const [file, setFile] = useState<File | null>(null)
  const [rawRows, setRawRows] = useState<Record<string, unknown>[]>([])
  const [headers, setHeaders] = useState<string[]>([])
  const [mapping, setMapping] = useState<ColumnMapping>({
    produk: null,
    kuantiti: null,
    harga: null,
    kos: null,
    tarikh: null,
    saluran: null,
  })
  const [fileError, setFileError] = useState<string | null>(null)
  const [isProcessing, setIsProcessing] = useState<boolean>(false)
  const [showExtraMapping, setShowExtraMapping] = useState<boolean>(false)
  const [showMappingSection, setShowMappingSection] = useState<boolean>(false)

  // Derive mapped records and validation on the fly from rawRows + current mapping
  const { records: mappedRecords } = applyMapping(rawRows, mapping)
  const { valid, invalid } = validateRecords(mappedRecords)
  const isAutoMapped = Boolean(mapping.produk && mapping.kuantiti && mapping.harga)

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [file])

  // Count detected optional columns
  const mappedExtraCount = [
    mapping.kategori,
    mapping.kaedahBayaran,
    mapping.lokasi,
    mapping.idTransaksi,
    mapping.masa,
    mapping.nota,
  ].filter(Boolean).length

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0] || null
    if (!selected) return

    const err = isValidFile(selected)
    if (err) {
      setFileError(err)
      setFile(null)
      return
    }

    setFile(selected)
    setFileError(null)
    setIsProcessing(true)

    try {
      let result
      if (selected.name.toLowerCase().endsWith('.csv')) {
        result = await parseCSV(selected)
      } else {
        result = await parseExcel(selected)
      }

      if (result.errors.length > 0 && result.records.length === 0) {
        setFileError(result.errors.join(' '))
        setFile(null)
        setIsProcessing(false)
        return
      }

      setHeaders(result.headers)
      setRawRows(result.rawRows)
      setMapping(result.mapping)

      // Pilihan B: Auto-skip mapping section if mandatory columns are recognized
      const hasRequired = Boolean(
        result.mapping.produk && result.mapping.kuantiti && result.mapping.harga
      )
      setShowMappingSection(!hasRequired)
    } catch {
      setFileError(
        'Gagal membaca fail. Sila pastikan fail tidak rosak dan formatnya betul.'
      )
      setFile(null)
    } finally {
      setIsProcessing(false)
    }
  }

  const handleMappingChange = (field: keyof ColumnMapping, value: string) => {
    setMapping((prev) => ({
      ...prev,
      [field]: value === '' ? null : value,
    }))
  }

  const handleConfirm = () => {
    if (mappedRecords.length === 0) {
      alert('Tiada data jualan ditemui untuk dijana.')
      return
    }

    if (!mapping.produk || !mapping.kuantiti || !mapping.harga) {
      alert('Sila pastikan kolum Produk, Kuantiti, dan Harga telah dipadankan.')
      return
    }

    if (invalid.length > 0) {
      const proceed = window.confirm(
        `Ada ${invalid.length} baris dalam fail yang tak lengkap atau tak sah.\n\nAdakah Puan mahu meneruskan dengan ${valid.length} rekod yang sah sahaja?`
      )
      if (!proceed) return
    }

    if (valid.length === 0) {
      alert('Tiada rekod sah yang boleh dijana. Sila semak padanan kolum anda.')
      return
    }

    // Pass valid records (ensuring clean data with optional fields preserved)
    const validRawSales: RawSale[] = valid.map((v) => ({
      produk: v.produk,
      kuantiti: v.kuantiti,
      harga: v.harga,
      kos: v.kos,
      tarikh: v.tarikh,
      saluran: v.saluran,
      kategori: v.kategori,
      kaedahBayaran: v.kaedahBayaran,
      lokasi: v.lokasi,
      idTransaksi: v.idTransaksi,
      masa: v.masa,
      nota: v.nota,
    }))

    onConfirm(validRawSales)
  }

  const handleSafeBack = () => {
    if (file && mappedRecords.length > 0) {
      if (
        !window.confirm(
          'Adakah Puan pasti mahu kembali ke Menu Utama? Data fail yang dimuat naik belum disimpan.'
        )
      ) {
        return
      }
    }
    onBack()
  }

  const handleReplaceFile = () => {
    setFile(null)
    setRawRows([])
    setHeaders([])
    setFileError(null)
    setShowMappingSection(false)
  }

  return (
    <div className="space-y-5 sm:space-y-6 max-w-xl mx-auto">
      {/* 1. Page Heading & Subtitle */}
      <div className="apple-reveal-card space-y-1" style={{ animationDelay: '0ms' }}>
        <h2 className="text-xl sm:text-2xl font-extrabold text-[#171317] font-heading tracking-tight leading-tight">
          Ada rekod jualan dalam Excel?
        </h2>
        <p className="text-sm sm:text-base text-[#6B6069] font-body leading-relaxed">
          Pilih fail jualan daripada telefon atau komputer Puan. Kami bantu susunkan maklumatnya secara automatik.
        </p>
      </div>

      {/* 2. File Error Notification */}
      {fileError && (
        <div className="bg-rose-50 border border-rose-200/80 rounded-2xl p-3.5 sm:p-4 text-xs sm:text-sm text-rose-800 flex items-start gap-3 shadow-xs animate-fadeIn">
          <ExclamationTriangleIcon className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
          <div className="space-y-0.5">
            <p className="font-bold text-rose-900">Perhatian</p>
            <p className="leading-relaxed">{fileError}</p>
          </div>
        </div>
      )}

      {/* 3. Empty Upload State */}
      {!file && (
        <div className="space-y-4 sm:space-y-5">
          <div
            className="apple-reveal-card apple-hover-card bg-[#FAF6F0] border border-[#EBE1D7] rounded-[24px] p-6 sm:p-8 text-center space-y-4 shadow-[0_4px_20px_rgba(23,19,23,0.03)] cursor-pointer"
            style={{ animationDelay: '80ms' }}
          >
            {/* Mint Squircle with Spreadsheet Icon */}
            <div className="w-14 h-14 bg-[#E8F5E9] border border-[#C8E6C9] rounded-2xl flex items-center justify-center mx-auto text-[#0D7355] shadow-xs">
              <SpreadsheetIcon className="w-7 h-7 text-[#0D7355]" />
            </div>

            <div className="space-y-1">
              <h3 className="font-extrabold text-base sm:text-lg text-[#171317] font-heading">
                Tekan untuk pilih fail Excel atau CSV
              </h3>
              <p className="text-xs sm:text-sm text-[#7A6E77] font-body">
                Format diterima: .xlsx, .xls dan .csv (maksimum 5 MB)
              </p>
              <p className="text-xs text-[#7A6E77] font-body">
                Atau tarik fail ke sini.
              </p>
            </div>

            <div className="pt-1">
              <label className="inline-block cursor-pointer w-full sm:w-auto">
                <span className="btn-primary-burgundy apple-hover-card w-full sm:w-auto min-h-[48px] sm:min-h-[52px] text-white font-bold text-sm sm:text-base px-7 py-3 rounded-full shadow-[0_4px_14px_rgba(128,0,32,0.28)] transition-all inline-flex items-center justify-center gap-2 cursor-pointer">
                  <UploadArrowIcon className="w-4 h-4 text-white" />
                  <span>Pilih Fail</span>
                </span>
                <input
                  type="file"
                  accept=".csv, .xlsx, .xls"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </label>
            </div>

            {/* Download Empty Template Draft Option */}
            <div className="pt-1 flex justify-center">
              <a
                href="/templates/Templat_Jualan_Mekara_Kosong.xlsx"
                download="Templat_Jualan_Mekara_Kosong.xlsx"
                onClick={(e) => {
                  e.stopPropagation()
                  try {
                    generateAndDownloadExcelTemplate()
                  } catch {
                    // Let native anchor take over
                  }
                }}
                className="apple-hover-card inline-flex items-center gap-2 px-4 py-2.5 rounded-full bg-white hover:bg-[#FAF4EA] active:bg-[#F4EDE5] text-[#800020] border border-[#EBE1D7] hover:border-[#800020] text-xs font-bold transition-all shadow-2xs active:scale-95 cursor-pointer min-h-[44px]"
                title="Muat turun draf fail Excel (hanya tajuk kolum) untuk diisi"
              >
                <DownloadIcon className="w-4 h-4 text-[#800020]" />
                <span>Muat Turun Draf Excel</span>
              </a>
            </div>
          </div>

          {/* Bottom Tip Box */}
          <div
            className="apple-reveal-card bg-[#FAF4EA] border border-[#EBE1D7] rounded-[20px] p-3.5 sm:p-4 space-y-1 shadow-[0_2px_8px_rgba(23,19,23,0.02)]"
            style={{ animationDelay: '160ms' }}
          >
            <div className="flex items-center gap-1.5 text-[#800020] font-bold text-xs sm:text-sm">
              <LightBulbIcon className="w-4 h-4 text-[#800020] shrink-0" />
              <span>Apa yang perlu ada dalam fail?</span>
            </div>
            <p className="text-xs sm:text-sm text-[#6B6069] leading-relaxed">
              Nama produk, kuantiti terjual dan harga seunit. Maklumat kos modal, tarikh dan saluran boleh disertakan jika ada.
            </p>
          </div>

          {/* Privacy Note */}
          <div
            className="apple-reveal-card flex items-center justify-center gap-1.5 text-xs text-[#7A6E77] text-center pt-1 pb-1"
            style={{ animationDelay: '240ms' }}
          >
            <LockIcon className="w-3.5 h-3.5 text-[#7A6E77] shrink-0" />
            <span>Fail jualan diproses secara tertutup dalam peranti Puan.</span>
          </div>
        </div>
      )}

      {/* 4. Processing Loading Indicator */}
      {isProcessing && (
        <div className="bg-[#FAF6F0] border border-[#EBE1D7] rounded-[24px] p-8 text-center space-y-3 shadow-[0_4px_20px_rgba(23,19,23,0.03)]">
          <div className="w-10 h-10 border-3 border-[#F8EAE8] border-t-[#800020] rounded-full animate-spin mx-auto" />
          <p className="font-bold text-sm sm:text-base text-[#171317]">
            Membaca fail jualan... Sila tunggu sebentar.
          </p>
          <p className="text-xs text-[#7A6E77]">
            Sistem sedang menyusun lajur jualan Puan.
          </p>
        </div>
      )}

      {/* 5. File Loaded: Mapping & Preview State */}
      {file && !isProcessing && (
        <div className="space-y-4 sm:space-y-5 animate-fadeIn">
          {/* File Summary Card */}
          <div className="bg-[#FAF6F0] border border-[#EBE1D7] rounded-[20px] p-3.5 sm:p-4 flex items-center justify-between gap-3 shadow-[0_2px_12px_rgba(23,19,23,0.02)]">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-xl bg-[#E8F5E9] border border-[#C8E6C9] flex items-center justify-center text-[#0D7355] shrink-0">
                <SpreadsheetIcon className="w-5 h-5 text-[#0D7355]" />
              </div>
              <div className="min-w-0">
                <p className="text-xs sm:text-sm font-bold text-[#171317] truncate">
                  {file.name}
                </p>
                <p className="text-[11px] sm:text-xs text-[#7A6E77]">
                  {rawRows.length} baris dijumpai &bull;{' '}
                  <span className="text-[#0D7355] font-semibold">{valid.length} sah</span>
                  {invalid.length > 0 && (
                    <span className="text-amber-700 font-semibold">
                      {' '}
                      &bull; {invalid.length} perlu semakan
                    </span>
                  )}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={handleReplaceFile}
              className="btn-secondary-neutral text-xs font-semibold px-3.5 py-2 rounded-full min-h-[44px] flex items-center justify-center transition-colors cursor-pointer shrink-0"
            >
              Tukar Fail
            </button>
          </div>

          {/* Smart Auto-Match Summary Card (Pilihan B: Auto-Skipped when mandatory columns match) */}
          {!showMappingSection && isAutoMapped && (
            <div className="bg-[#FAF6F0] border border-[#EBE1D7] rounded-[22px] sm:rounded-[24px] p-4 sm:p-5 shadow-[0_2px_12px_rgba(23,19,23,0.02)] transition-all">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-start sm:items-center gap-3 min-w-0">
                  <div className="w-9 h-9 rounded-xl bg-[#E8F5E9] border border-[#C8E6C9] flex items-center justify-center text-[#0D7355] shrink-0 mt-0.5 sm:mt-0">
                    <CheckCircleIcon className="w-5 h-5 text-[#0D7355]" />
                  </div>
                  <div className="space-y-0.5 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-xs sm:text-sm font-bold text-[#171317]">
                        Kolum Dipadankan Secara Pintar
                      </p>
                      <span className="bg-[#E8F5E9] text-[#0D7355] text-[10px] font-bold px-2 py-0.5 rounded-full border border-[#C8E6C9]">
                        Sedia Dijana
                      </span>
                    </div>
                    <p className="text-[11px] sm:text-xs text-[#7A6E77] leading-relaxed">
                      Produk: <span className="font-semibold text-[#171317]">{mapping.produk}</span> &bull; Kuantiti: <span className="font-semibold text-[#171317]">{mapping.kuantiti}</span> &bull; Harga: <span className="font-semibold text-[#171317]">{mapping.harga}</span>
                      {mapping.kos && <> &bull; Kos: <span className="font-semibold text-[#171317]">{mapping.kos}</span></>}
                      {mapping.tarikh && <> &bull; Tarikh: <span className="font-semibold text-[#171317]">{mapping.tarikh}</span></>}
                      {mapping.saluran && <> &bull; Saluran: <span className="font-semibold text-[#171317]">{mapping.saluran}</span></>}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setShowMappingSection(true)}
                  className="btn-secondary-neutral self-start sm:self-center text-xs font-semibold text-[#800020] hover:text-[#70193D] flex items-center gap-1.5 transition-all cursor-pointer py-2 px-3.5 rounded-full border border-[#EBE1D7] bg-white hover:bg-[#FAF4EA] active:bg-[#F4EDE5] shrink-0 shadow-2xs"
                >
                  <AdjustmentsHorizontalIcon className="w-4 h-4 text-[#800020]" />
                  <span>Ubah Padanan Kolum</span>
                </button>
              </div>
            </div>
          )}

          {/* Column Mapping Section (Only shown if manual toggle clicked OR if required columns are missing) */}
          {(showMappingSection || !isAutoMapped) && (
            <div className="bg-[#FAF6F0] border border-[#EBE1D7] rounded-[22px] sm:rounded-[24px] p-4 sm:p-5 space-y-4 shadow-[0_4px_20px_rgba(23,19,23,0.03)] animate-fadeIn">
              <div className="border-b border-[#EBE1D7] pb-3 flex items-start justify-between gap-3">
                <div className="flex items-start gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-[#FAF4EA] border border-[#EBE1D7] flex items-center justify-center text-[#800020] shrink-0 mt-0.5">
                    <AdjustmentsHorizontalIcon className="w-4 h-4 text-[#800020]" />
                  </div>
                  <div>
                    <h3 className="text-sm sm:text-base font-bold text-[#171317] font-heading">
                      Padanan Kolum Fail
                    </h3>
                    <p className="text-xs text-[#7A6E77] mt-0.5">
                      {isAutoMapped
                        ? 'Tukar pilihan jika kolum yang dikesan tidak bertepatan dengan fail anda.'
                        : 'Sila padankan kolum bertanda (*) sebelum menjana laporan.'}
                    </p>
                  </div>
                </div>
                {isAutoMapped && (
                  <button
                    type="button"
                    onClick={() => setShowMappingSection(false)}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#7A6E77] hover:text-[#171317] transition-colors cursor-pointer py-1.5 px-3 rounded-full hover:bg-white border border-transparent hover:border-[#EBE1D7] shrink-0"
                  >
                    <XMarkIcon className="w-3.5 h-3.5" />
                    <span>Tutup</span>
                  </button>
                )}
              </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 text-xs sm:text-sm">
              <div>
                <label className="block text-xs font-bold text-[#171317] mb-1.5">
                  Nama Produk / Perkhidmatan *
                </label>
                <select
                  value={mapping.produk || ''}
                  onChange={(e) => handleMappingChange('produk', e.target.value)}
                  className={`w-full rounded-xl border px-3.5 py-2.5 text-base sm:text-sm text-[#171317] bg-white focus:outline-none focus:ring-2 focus:ring-[#800020]/15 focus:border-[#800020] transition-colors ${
                    !mapping.produk ? 'border-rose-300 bg-rose-50/20' : 'border-[#EBE1D7]'
                  }`}
                >
                  <option value="">-- Pilih Kolum --</option>
                  {headers.map((h) => (
                    <option key={h} value={h}>
                      {h}
                    </option>
                  ))}
                </select>
                {!mapping.produk && (
                  <p className="text-[11px] text-rose-600 mt-1">Sila pilih kolum produk.</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-[#171317] mb-1.5">
                  Kuantiti Terjual *
                </label>
                <select
                  value={mapping.kuantiti || ''}
                  onChange={(e) => handleMappingChange('kuantiti', e.target.value)}
                  className={`w-full rounded-xl border px-3.5 py-2.5 text-base sm:text-sm text-[#171317] bg-white focus:outline-none focus:ring-2 focus:ring-[#800020]/15 focus:border-[#800020] transition-colors ${
                    !mapping.kuantiti ? 'border-rose-300 bg-rose-50/20' : 'border-[#EBE1D7]'
                  }`}
                >
                  <option value="">-- Pilih Kolum --</option>
                  {headers.map((h) => (
                    <option key={h} value={h}>
                      {h}
                    </option>
                  ))}
                </select>
                {!mapping.kuantiti && (
                  <p className="text-[11px] text-rose-600 mt-1">Sila pilih kolum kuantiti.</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-[#171317] mb-1.5">
                  Harga Seunit (RM) *
                </label>
                <select
                  value={mapping.harga || ''}
                  onChange={(e) => handleMappingChange('harga', e.target.value)}
                  className={`w-full rounded-xl border px-3.5 py-2.5 text-base sm:text-sm text-[#171317] bg-white focus:outline-none focus:ring-2 focus:ring-[#800020]/15 focus:border-[#800020] transition-colors ${
                    !mapping.harga ? 'border-rose-300 bg-rose-50/20' : 'border-[#EBE1D7]'
                  }`}
                >
                  <option value="">-- Pilih Kolum --</option>
                  {headers.map((h) => (
                    <option key={h} value={h}>
                      {h}
                    </option>
                  ))}
                </select>
                {!mapping.harga && (
                  <p className="text-[11px] text-rose-600 mt-1">Sila pilih kolum harga.</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-[#171317] mb-1.5">
                  Kos Seunit (RM) <span className="text-[#7A6E77] font-normal">(Pilihan)</span>
                </label>
                <select
                  value={mapping.kos || ''}
                  onChange={(e) => handleMappingChange('kos', e.target.value)}
                  className="w-full rounded-xl border border-[#EBE1D7] px-3.5 py-2.5 text-base sm:text-sm text-[#171317] bg-white focus:outline-none focus:ring-2 focus:ring-[#800020]/15 focus:border-[#800020] transition-colors"
                >
                  <option value="">-- Tiada / Bukan dalam fail --</option>
                  {headers.map((h) => (
                    <option key={h} value={h}>
                      {h}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#171317] mb-1.5">
                  Tarikh Jualan <span className="text-[#7A6E77] font-normal">(Pilihan)</span>
                </label>
                <select
                  value={mapping.tarikh || ''}
                  onChange={(e) => handleMappingChange('tarikh', e.target.value)}
                  className="w-full rounded-xl border border-[#EBE1D7] px-3.5 py-2.5 text-base sm:text-sm text-[#171317] bg-white focus:outline-none focus:ring-2 focus:ring-[#800020]/15 focus:border-[#800020] transition-colors"
                >
                  <option value="">-- Tiada / Bukan dalam fail --</option>
                  {headers.map((h) => (
                    <option key={h} value={h}>
                      {h}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#171317] mb-1.5">
                  Saluran Jualan <span className="text-[#7A6E77] font-normal">(Pilihan)</span>
                </label>
                <select
                  value={mapping.saluran || ''}
                  onChange={(e) => handleMappingChange('saluran', e.target.value)}
                  className="w-full rounded-xl border border-[#EBE1D7] px-3.5 py-2.5 text-base sm:text-sm text-[#171317] bg-white focus:outline-none focus:ring-2 focus:ring-[#800020]/15 focus:border-[#800020] transition-colors"
                >
                  <option value="">-- Tiada / Bukan dalam fail --</option>
                  {headers.map((h) => (
                    <option key={h} value={h}>
                      {h}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Collapsible Section: Maklumat Tambahan (Pilihan) - No Emojis */}
            <div className="pt-2 border-t border-[#EBE1D7]">
              <button
                type="button"
                onClick={() => setShowExtraMapping(!showExtraMapping)}
                className="w-full flex items-center justify-between py-2 text-left text-xs font-bold text-[#800020] hover:text-[#70193D] transition-colors cursor-pointer"
              >
                <span className="flex items-center gap-2">
                  <span className="font-bold text-xs sm:text-sm text-[#171317]">
                    Kolum Tambahan (Pilihan)
                  </span>
                  {mappedExtraCount > 0 ? (
                    <span className="bg-[#E8F5E9] text-[#0D7355] border border-[#C8E6C9] text-[10px] font-bold px-2 py-0.5 rounded-full">
                      {mappedExtraCount} kolum dikesan
                    </span>
                  ) : (
                    <span className="text-[11px] font-normal text-[#7A6E77]">
                      (Kategori, Kaedah Bayaran, Lokasi, dll.)
                    </span>
                  )}
                </span>
                {showExtraMapping ? (
                  <ChevronUpIcon className="w-4 h-4 text-[#800020]" />
                ) : (
                  <ChevronDownIcon className="w-4 h-4 text-[#800020]" />
                )}
              </button>

              {showExtraMapping && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-2 text-xs sm:text-sm animate-fadeIn">
                  <div>
                    <label className="block text-xs font-semibold text-[#171317] mb-1.5">
                      Kategori Produk (Pilihan)
                    </label>
                    <select
                      value={mapping.kategori || ''}
                      onChange={(e) => handleMappingChange('kategori', e.target.value)}
                      className="w-full rounded-xl border border-[#EBE1D7] px-3.5 py-2 text-base sm:text-xs text-[#171317] bg-white focus:outline-none focus:ring-2 focus:ring-[#800020]/15 focus:border-[#800020]"
                    >
                      <option value="">-- Tiada / Bukan dalam fail --</option>
                      {headers.map((h) => (
                        <option key={h} value={h}>
                          {h}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#171317] mb-1.5">
                      Kaedah Bayaran (Pilihan)
                    </label>
                    <select
                      value={mapping.kaedahBayaran || ''}
                      onChange={(e) => handleMappingChange('kaedahBayaran', e.target.value)}
                      className="w-full rounded-xl border border-[#EBE1D7] px-3.5 py-2 text-base sm:text-xs text-[#171317] bg-white focus:outline-none focus:ring-2 focus:ring-[#800020]/15 focus:border-[#800020]"
                    >
                      <option value="">-- Tiada / Bukan dalam fail --</option>
                      {headers.map((h) => (
                        <option key={h} value={h}>
                          {h}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#171317] mb-1.5">
                      Lokasi Jualan (Pilihan)
                    </label>
                    <select
                      value={mapping.lokasi || ''}
                      onChange={(e) => handleMappingChange('lokasi', e.target.value)}
                      className="w-full rounded-xl border border-[#EBE1D7] px-3.5 py-2 text-base sm:text-xs text-[#171317] bg-white focus:outline-none focus:ring-2 focus:ring-[#800020]/15 focus:border-[#800020]"
                    >
                      <option value="">-- Tiada / Bukan dalam fail --</option>
                      {headers.map((h) => (
                        <option key={h} value={h}>
                          {h}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#171317] mb-1.5">
                      ID Transaksi (Pilihan)
                    </label>
                    <select
                      value={mapping.idTransaksi || ''}
                      onChange={(e) => handleMappingChange('idTransaksi', e.target.value)}
                      className="w-full rounded-xl border border-[#EBE1D7] px-3.5 py-2 text-base sm:text-xs text-[#171317] bg-white focus:outline-none focus:ring-2 focus:ring-[#800020]/15 focus:border-[#800020]"
                    >
                      <option value="">-- Tiada / Bukan dalam fail --</option>
                      {headers.map((h) => (
                        <option key={h} value={h}>
                          {h}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#171317] mb-1.5">
                      Masa Transaksi (Pilihan)
                    </label>
                    <select
                      value={mapping.masa || ''}
                      onChange={(e) => handleMappingChange('masa', e.target.value)}
                      className="w-full rounded-xl border border-[#EBE1D7] px-3.5 py-2 text-base sm:text-xs text-[#171317] bg-white focus:outline-none focus:ring-2 focus:ring-[#800020]/15 focus:border-[#800020]"
                    >
                      <option value="">-- Tiada / Bukan dalam fail --</option>
                      {headers.map((h) => (
                        <option key={h} value={h}>
                          {h}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#171317] mb-1.5">
                      Nota / Catatan (Pilihan)
                    </label>
                    <select
                      value={mapping.nota || ''}
                      onChange={(e) => handleMappingChange('nota', e.target.value)}
                      className="w-full rounded-xl border border-[#EBE1D7] px-3.5 py-2 text-base sm:text-xs text-[#171317] bg-white focus:outline-none focus:ring-2 focus:ring-[#800020]/15 focus:border-[#800020]"
                    >
                      <option value="">-- Tiada / Bukan dalam fail --</option>
                      {headers.map((h) => (
                        <option key={h} value={h}>
                          {h}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              )}
            </div>

            {/* Bottom Action when user expands mapping */}
            {isAutoMapped && (
              <div className="pt-2 flex justify-end border-t border-[#EBE1D7]">
                <button
                  type="button"
                  onClick={() => setShowMappingSection(false)}
                  className="btn-primary-burgundy text-xs font-bold px-5 py-2.5 rounded-full text-white cursor-pointer shadow-xs transition-transform active:scale-95"
                >
                  Simpan & Teruskan
                </button>
              </div>
            )}
          </div>
          )}

          {/* Validation Status Pill / Banner */}
          {invalid.length === 0 && valid.length > 0 && (
            <div className="bg-[#E8F5E9] border border-[#C8E6C9] rounded-2xl p-3.5 sm:p-4 flex items-center gap-3 text-[#0D7355] shadow-xs">
              <CheckCircleIcon className="w-5 h-5 text-[#0D7355] shrink-0" />
              <span className="text-xs sm:text-sm font-bold">
                Semua {valid.length} rekod sedia untuk dijana ke laporan jualan.
              </span>
            </div>
          )}

          {invalid.length > 0 && (
            <div className="bg-amber-50 border border-amber-200/80 rounded-2xl p-3.5 sm:p-4 space-y-2 shadow-xs">
              <div className="flex items-center gap-2 text-amber-900 font-bold text-xs uppercase tracking-wide">
                <ExclamationTriangleIcon className="w-4 h-4 text-amber-700 shrink-0" />
                <span>{invalid.length} Baris Mengandungi Ralat Format / Nombor:</span>
              </div>
              <ul className="text-xs text-amber-800 space-y-1 list-disc pl-4 max-h-32 overflow-y-auto">
                {invalid.slice(0, 5).map((inv, idx) => (
                  <li key={idx}>
                    <strong>Baris {inv.row}:</strong> {inv.issues.map((i) => i.message).join(' ')}
                  </li>
                ))}
                {invalid.length > 5 && (
                  <li className="italic text-amber-700">
                    ...dan {invalid.length - 5} baris lagi.
                  </li>
                )}
              </ul>
              <p className="text-[11px] text-amber-800 pt-1">
                Puan masih boleh menjana laporan dengan {valid.length} rekod yang sah.
              </p>
            </div>
          )}

          {/* Data Preview Table */}
          <div className="bg-[#FAF6F0] border border-[#EBE1D7] rounded-[22px] sm:rounded-[24px] p-4 sm:p-5 space-y-3.5 shadow-[0_4px_20px_rgba(23,19,23,0.03)]">
            <div className="flex items-center justify-between">
              <h3 className="text-sm sm:text-base font-bold text-[#171317] font-heading">
                Pratonton Data ({mappedRecords.length} rekod)
              </h3>
              <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-[#E8F5E9] text-[#0D7355] border border-[#C8E6C9]">
                {valid.length} sah dibaca
              </span>
            </div>

            <div className="overflow-x-auto -mx-1 sm:mx-0 rounded-xl border border-[#EBE1D7]">
              <table className="w-full text-left text-xs border-collapse min-w-[340px]">
                <thead>
                  <tr className="bg-[#F5ECE0] text-[#171317] border-b border-[#EBE1D7]">
                    <th className="py-2.5 px-3 font-bold">Produk</th>
                    <th className="py-2.5 px-3 font-bold text-right">Kuantiti</th>
                    <th className="py-2.5 px-3 font-bold text-right">Harga</th>
                    <th className="py-2.5 px-3 font-bold text-right">Kos</th>
                    <th className="py-2.5 px-3 font-bold">Tarikh</th>
                    <th className="py-2.5 px-3 font-bold">Saluran</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#EBE1D7]">
                  {mappedRecords.slice(0, 6).map((r, i) => (
                    <tr key={i} className="hover:bg-[#FAF4EA] transition-colors">
                      <td className="py-2.5 px-3 font-semibold text-[#171317] truncate max-w-[120px]">
                        {r.produk || <span className="text-rose-500 italic">Tiada nama</span>}
                      </td>
                      <td className="py-2.5 px-3 text-right text-[#171317] tabular-nums font-medium">
                        {(() => {
                          const q = parseQuantity(r.kuantiti)
                          return q !== null ? (
                            q.toLocaleString()
                          ) : (
                            <span className="text-rose-500 font-semibold">Ralat</span>
                          )
                        })()}
                      </td>
                      <td className="py-2.5 px-3 text-right text-[#171317] tabular-nums font-medium">
                        {(() => {
                          const p = parseCurrency(r.harga)
                          return p !== null && p >= 0 ? (
                            formatRM(p)
                          ) : (
                            <span className="text-rose-500 font-semibold">Ralat</span>
                          )
                        })()}
                      </td>
                      <td className="py-2.5 px-3 text-right text-[#7A6E77] tabular-nums">
                        {(() => {
                          if (r.kos === null || r.kos === undefined || r.kos === '') return '-'
                          const raw = String(r.kos).trim()
                          if (raw === '-' || raw === '--' || /^(?:n\/?a|tiada)$/i.test(raw)) {
                            return '-'
                          }
                          const c = parseCurrency(r.kos)
                          return c !== null && c >= 0 ? (
                            formatRM(c)
                          ) : (
                            <span className="text-rose-500 font-semibold">Ralat</span>
                          )
                        })()}
                      </td>
                      <td className="py-2.5 px-3 text-[#7A6E77] truncate max-w-[90px]">
                        {r.tarikh ? formatDateMY(normalizeDate(r.tarikh) || r.tarikh) : '-'}
                      </td>
                      <td className="py-2.5 px-3 text-[#7A6E77]">
                        {r.saluran ? normalizeChannel(r.saluran) || r.saluran : '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {mappedRecords.length > 6 && (
              <p className="text-[11px] text-[#7A6E77] text-center pt-1 font-body">
                Menunjukkan 6 rekod pertama daripada {mappedRecords.length} keseluruhan baris fail.
              </p>
            )}

            {/* Optional recognized columns indicator */}
            {mappedExtraCount > 0 && (
              <div className="flex flex-wrap items-center gap-1.5 pt-1 text-[11px] text-[#7A6E77]">
                <span className="font-semibold text-[#171317]">Kolum Tambahan Dikesan:</span>
                {mapping.kategori && (
                  <span className="bg-[#FAF4EA] text-[#800020] px-2 py-0.5 rounded-md font-medium border border-[#EBE1D7]">
                    Kategori ({mapping.kategori})
                  </span>
                )}
                {mapping.kaedahBayaran && (
                  <span className="bg-[#FAF4EA] text-[#800020] px-2 py-0.5 rounded-md font-medium border border-[#EBE1D7]">
                    Kaedah Bayaran ({mapping.kaedahBayaran})
                  </span>
                )}
                {mapping.lokasi && (
                  <span className="bg-[#FAF4EA] text-[#800020] px-2 py-0.5 rounded-md font-medium border border-[#EBE1D7]">
                    Lokasi ({mapping.lokasi})
                  </span>
                )}
                {mapping.idTransaksi && (
                  <span className="bg-[#FAF4EA] text-[#800020] px-2 py-0.5 rounded-md font-medium border border-[#EBE1D7]">
                    ID Transaksi ({mapping.idTransaksi})
                  </span>
                )}
                {mapping.masa && (
                  <span className="bg-[#FAF4EA] text-[#800020] px-2 py-0.5 rounded-md font-medium border border-[#EBE1D7]">
                    Masa ({mapping.masa})
                  </span>
                )}
                {mapping.nota && (
                  <span className="bg-[#FAF4EA] text-[#800020] px-2 py-0.5 rounded-md font-medium border border-[#EBE1D7]">
                    Nota ({mapping.nota})
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Primary Action Buttons */}
          <div className="apple-reveal-card space-y-2.5 pt-2" style={{ animationDelay: '240ms' }}>
            <button
              type="button"
              onClick={handleConfirm}
              disabled={isProcessing || valid.length === 0 || !mapping.produk || !mapping.kuantiti || !mapping.harga}
              className={`apple-hover-card w-full min-h-[48px] sm:min-h-[52px] rounded-full font-bold text-base flex items-center justify-center gap-2 transition-all cursor-pointer shadow-[0_4px_14px_rgba(128,0,32,0.28)] ${
                isProcessing || valid.length === 0 || !mapping.produk || !mapping.kuantiti || !mapping.harga
                  ? 'bg-gray-100 text-gray-400 border border-gray-200 cursor-not-allowed shadow-none'
                  : 'btn-primary-burgundy text-white'
              }`}
            >
              <CheckCircleIcon className="w-5 h-5 text-white" />
              <span>Jana Laporan Jualan ({valid.length} Rekod Sah)</span>
            </button>

            <button
              type="button"
              onClick={handleSafeBack}
              className="btn-secondary-neutral w-full min-h-[44px] text-xs sm:text-sm font-semibold flex items-center justify-center transition-colors cursor-pointer rounded-full"
            >
              &larr; Kembali ke Menu Utama
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
