import React, { useState } from 'react'
import {
  SpreadsheetIcon,
  UploadArrowIcon,
  LightBulbIcon,
  LockIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  ChevronDownIcon,
  ChevronUpIcon,
} from './ui/Icons'
import {
  parseCSV,
  parseExcel,
  isValidFile,
  applyMapping,
} from '../data/parse'
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

  // Derive mapped records and validation on the fly from rawRows + current mapping
  const { records: mappedRecords } = applyMapping(rawRows, mapping)
  const { valid, invalid } = validateRecords(mappedRecords)

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
        `Terdapat ${invalid.length} baris data yang mengandungi ralat (contoh: tiada nama produk atau nombor tidak sah).\n\nAdakah Puan mahu meneruskan dengan ${valid.length} rekod yang sah sahaja?`
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
  }

  return (
    <div className="space-y-4 sm:space-y-5 max-w-xl mx-auto animate-fadeIn">
      {/* 1. Page Heading & Subtitle */}
      <div className="space-y-1">
        <h2 className="text-xl sm:text-2xl font-extrabold text-[#28152F] font-heading tracking-tight leading-tight">
          Ada rekod jualan dalam Excel?
        </h2>
        <p className="text-sm sm:text-base text-[#68586B] font-body leading-relaxed">
          Pilih fail jualan daripada telefon Puan. Kami bantu susunkan maklumatnya.
        </p>
      </div>

      {/* 2. File Error Notification */}
      {fileError && (
        <div className="bg-rose-50 border border-rose-200 rounded-2xl p-3.5 sm:p-4 text-xs sm:text-sm text-rose-800 flex items-start gap-2.5 shadow-2xs animate-fadeIn">
          <ExclamationTriangleIcon className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
          <div className="space-y-0.5">
            <p className="font-bold text-rose-900">Perhatian</p>
            <p className="leading-relaxed">{fileError}</p>
          </div>
        </div>
      )}

      {/* 3. Empty Upload State (Matching Reference Mockup 1) */}
      {!file && (
        <div className="space-y-4 sm:space-y-5">
          <div className="bg-white border border-[#F1D3E3] rounded-3xl p-6 sm:p-8 text-center shadow-2xs space-y-3 sm:space-y-4">
            {/* Mint Square with Spreadsheet Icon */}
            <div className="w-12 h-12 bg-[#E6F4F1] border border-[#A7D7CD] rounded-2xl flex items-center justify-center mx-auto text-[#0D9488] shadow-2xs">
              <SpreadsheetIcon className="w-6 h-6 text-[#0D9488]" />
            </div>

            <div className="space-y-1">
              <h3 className="font-extrabold text-base sm:text-lg text-[#28152F] font-heading">
                Pilih fail jualan Puan
              </h3>
              <p className="text-xs sm:text-sm text-[#68586B] font-body">
                Excel (.xlsx) atau CSV (.csv)
              </p>
            </div>

            <div className="pt-1">
              <label className="inline-block cursor-pointer w-full sm:w-auto">
                <span className="w-full sm:w-auto min-h-[48px] sm:min-h-[50px] bg-[#BE1E72] hover:bg-[#A3165F] active:bg-[#8B0F4E] active:scale-[0.99] text-white font-bold text-sm sm:text-base px-6 py-3 rounded-2xl shadow-sm transition-all inline-flex items-center justify-center gap-2 cursor-pointer shadow-pink-300/40">
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
          </div>

          {/* Bottom Tip Box */}
          <div className="bg-[#FFF5FA] border border-[#F1D3E3] rounded-2xl p-3.5 sm:p-4 space-y-1 shadow-2xs">
            <div className="flex items-center gap-1.5 text-[#BE1E72] font-bold text-xs sm:text-sm">
              <LightBulbIcon className="w-4 h-4 text-[#BE1E72] shrink-0" />
              <span>Apa yang perlu ada dalam fail?</span>
            </div>
            <p className="text-xs sm:text-sm text-[#28152F] leading-relaxed">
              Nama produk, kuantiti terjual dan harga. Maklumat kos boleh ditambah jika ada.
            </p>
          </div>

          {/* Privacy Note */}
          <div className="flex items-center justify-center gap-1.5 text-xs text-[#68586B] text-center pt-1 pb-1">
            <LockIcon className="w-3.5 h-3.5 text-[#68586B] shrink-0" />
            <span>Fail jualan diproses dalam peranti Puan.</span>
          </div>
        </div>
      )}

      {/* 4. Processing Loading Indicator */}
      {isProcessing && (
        <div className="bg-white border border-[#F1D3E3] rounded-3xl p-8 text-center space-y-3 shadow-2xs animate-pulse">
          <div className="w-10 h-10 border-3 border-pink-200 border-t-[#BE1E72] rounded-full animate-spin mx-auto" />
          <p className="font-bold text-sm text-[#28152F]">
            Membaca fail jualan... Sila tunggu sebentar.
          </p>
        </div>
      )}

      {/* 5. File Loaded: Mapping & Preview State */}
      {file && !isProcessing && (
        <div className="space-y-4 sm:space-y-5 animate-fadeIn">
          {/* File Summary Card */}
          <div className="bg-white border border-[#F1D3E3] rounded-2xl p-3.5 sm:p-4 flex items-center justify-between gap-3 shadow-2xs">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-xl bg-[#E6F4F1] border border-[#A7D7CD] flex items-center justify-center text-[#0D9488] shrink-0">
                <SpreadsheetIcon className="w-5 h-5 text-[#0D9488]" />
              </div>
              <div className="min-w-0">
                <p className="text-xs sm:text-sm font-bold text-[#28152F] truncate">
                  {file.name}
                </p>
                <p className="text-[11px] sm:text-xs text-[#68586B]">
                  {rawRows.length} baris dijumpai &bull;{' '}
                  <span className="text-[#0D9488] font-semibold">{valid.length} sah</span>
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
              className="text-xs font-bold text-[#BE1E72] hover:text-[#A3165F] px-3 py-1.5 rounded-xl border border-pink-200 hover:bg-pink-50 min-h-[44px] flex items-center justify-center transition-colors cursor-pointer shrink-0"
            >
              Tukar Fail
            </button>
          </div>

          {/* Column Mapping Section */}
          <div className="bg-white border border-[#F1D3E3] rounded-3xl p-4 sm:p-5 space-y-3.5 shadow-2xs">
            <div className="border-b border-gray-100 pb-2.5">
              <h3 className="text-sm sm:text-base font-bold text-[#28152F] font-heading flex items-center gap-1.5">
                <span>🧭</span>
                <span>Semak Kolum Fail (Mapping)</span>
              </h3>
              <p className="text-xs text-[#68586B] mt-0.5">
                Pastikan setiap medan memadankan kolum yang betul dalam fail Puan.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs sm:text-sm">
              <div>
                <label className="block text-xs font-bold text-[#28152F] mb-1">
                  Nama Produk / Perkhidmatan *
                </label>
                <select
                  value={mapping.produk || ''}
                  onChange={(e) => handleMappingChange('produk', e.target.value)}
                  className={`w-full rounded-xl border px-3 py-2.5 text-xs sm:text-sm text-[#28152F] bg-white focus:outline-none focus:ring-2 focus:ring-[#BE1E72]/20 focus:border-[#BE1E72] ${
                    !mapping.produk ? 'border-rose-300 bg-rose-50/20' : 'border-gray-200'
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
                  <p className="text-[11px] text-rose-600 mt-0.5">Sila pilih kolum produk.</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-[#28152F] mb-1">
                  Kuantiti Terjual *
                </label>
                <select
                  value={mapping.kuantiti || ''}
                  onChange={(e) => handleMappingChange('kuantiti', e.target.value)}
                  className={`w-full rounded-xl border px-3 py-2.5 text-xs sm:text-sm text-[#28152F] bg-white focus:outline-none focus:ring-2 focus:ring-[#BE1E72]/20 focus:border-[#BE1E72] ${
                    !mapping.kuantiti ? 'border-rose-300 bg-rose-50/20' : 'border-gray-200'
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
                  <p className="text-[11px] text-rose-600 mt-0.5">Sila pilih kolum kuantiti.</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-[#28152F] mb-1">
                  Harga Seunit (RM) *
                </label>
                <select
                  value={mapping.harga || ''}
                  onChange={(e) => handleMappingChange('harga', e.target.value)}
                  className={`w-full rounded-xl border px-3 py-2.5 text-xs sm:text-sm text-[#28152F] bg-white focus:outline-none focus:ring-2 focus:ring-[#BE1E72]/20 focus:border-[#BE1E72] ${
                    !mapping.harga ? 'border-rose-300 bg-rose-50/20' : 'border-gray-200'
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
                  <p className="text-[11px] text-rose-600 mt-0.5">Sila pilih kolum harga.</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-[#28152F] mb-1">
                  Kos Seunit (RM) <span className="text-[#68586B] font-normal">(Pilihan)</span>
                </label>
                <select
                  value={mapping.kos || ''}
                  onChange={(e) => handleMappingChange('kos', e.target.value)}
                  className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-xs sm:text-sm text-[#28152F] bg-white focus:outline-none focus:ring-2 focus:ring-[#BE1E72]/20 focus:border-[#BE1E72]"
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
                <label className="block text-xs font-bold text-[#28152F] mb-1">
                  Tarikh Jualan <span className="text-[#68586B] font-normal">(Pilihan)</span>
                </label>
                <select
                  value={mapping.tarikh || ''}
                  onChange={(e) => handleMappingChange('tarikh', e.target.value)}
                  className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-xs sm:text-sm text-[#28152F] bg-white focus:outline-none focus:ring-2 focus:ring-[#BE1E72]/20 focus:border-[#BE1E72]"
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
                <label className="block text-xs font-bold text-[#28152F] mb-1">
                  Saluran Jualan <span className="text-[#68586B] font-normal">(Pilihan)</span>
                </label>
                <select
                  value={mapping.saluran || ''}
                  onChange={(e) => handleMappingChange('saluran', e.target.value)}
                  className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-xs sm:text-sm text-[#28152F] bg-white focus:outline-none focus:ring-2 focus:ring-[#BE1E72]/20 focus:border-[#BE1E72]"
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

            {/* Collapsible Section: Maklumat Tambahan (Pilihan) */}
            <div className="pt-2 border-t border-gray-100">
              <button
                type="button"
                onClick={() => setShowExtraMapping(!showExtraMapping)}
                className="w-full flex items-center justify-between py-1 text-left text-xs font-bold text-[#BE1E72] hover:text-[#A3165F] transition-colors cursor-pointer"
              >
                <span className="flex items-center gap-1.5">
                  <span>✨ Maklumat Tambahan (Pilihan)</span>
                  {mappedExtraCount > 0 && (
                    <span className="bg-pink-100 text-[#BE1E72] text-[10px] font-bold px-2 py-0.5 rounded-full">
                      {mappedExtraCount} kolum dikesan
                    </span>
                  )}
                </span>
                {showExtraMapping ? (
                  <ChevronUpIcon className="w-4 h-4 text-[#BE1E72]" />
                ) : (
                  <ChevronDownIcon className="w-4 h-4 text-[#BE1E72]" />
                )}
              </button>

              {showExtraMapping && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 text-xs sm:text-sm animate-fadeIn">
                  <div>
                    <label className="block text-xs font-semibold text-[#28152F] mb-1">
                      Kategori Produk (Pilihan)
                    </label>
                    <select
                      value={mapping.kategori || ''}
                      onChange={(e) => handleMappingChange('kategori', e.target.value)}
                      className="w-full rounded-xl border border-gray-200 px-3 py-2 text-xs text-[#28152F] bg-white focus:outline-none focus:ring-2 focus:ring-[#BE1E72]/20 focus:border-[#BE1E72]"
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
                    <label className="block text-xs font-semibold text-[#28152F] mb-1">
                      Kaedah Bayaran (Pilihan)
                    </label>
                    <select
                      value={mapping.kaedahBayaran || ''}
                      onChange={(e) => handleMappingChange('kaedahBayaran', e.target.value)}
                      className="w-full rounded-xl border border-gray-200 px-3 py-2 text-xs text-[#28152F] bg-white focus:outline-none focus:ring-2 focus:ring-[#BE1E72]/20 focus:border-[#BE1E72]"
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
                    <label className="block text-xs font-semibold text-[#28152F] mb-1">
                      Lokasi Jualan (Pilihan)
                    </label>
                    <select
                      value={mapping.lokasi || ''}
                      onChange={(e) => handleMappingChange('lokasi', e.target.value)}
                      className="w-full rounded-xl border border-gray-200 px-3 py-2 text-xs text-[#28152F] bg-white focus:outline-none focus:ring-2 focus:ring-[#BE1E72]/20 focus:border-[#BE1E72]"
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
                    <label className="block text-xs font-semibold text-[#28152F] mb-1">
                      ID Transaksi (Pilihan)
                    </label>
                    <select
                      value={mapping.idTransaksi || ''}
                      onChange={(e) => handleMappingChange('idTransaksi', e.target.value)}
                      className="w-full rounded-xl border border-gray-200 px-3 py-2 text-xs text-[#28152F] bg-white focus:outline-none focus:ring-2 focus:ring-[#BE1E72]/20 focus:border-[#BE1E72]"
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
                    <label className="block text-xs font-semibold text-[#28152F] mb-1">
                      Masa Transaksi (Pilihan)
                    </label>
                    <select
                      value={mapping.masa || ''}
                      onChange={(e) => handleMappingChange('masa', e.target.value)}
                      className="w-full rounded-xl border border-gray-200 px-3 py-2 text-xs text-[#28152F] bg-white focus:outline-none focus:ring-2 focus:ring-[#BE1E72]/20 focus:border-[#BE1E72]"
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
                    <label className="block text-xs font-semibold text-[#28152F] mb-1">
                      Nota / Catatan (Pilihan)
                    </label>
                    <select
                      value={mapping.nota || ''}
                      onChange={(e) => handleMappingChange('nota', e.target.value)}
                      className="w-full rounded-xl border border-gray-200 px-3 py-2 text-xs text-[#28152F] bg-white focus:outline-none focus:ring-2 focus:ring-[#BE1E72]/20 focus:border-[#BE1E72]"
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
          </div>

          {/* Validation Status Pill / Banner */}
          {invalid.length === 0 && valid.length > 0 && (
            <div className="bg-[#E6F4F1] border border-[#A7D7CD] rounded-2xl p-3 sm:p-3.5 flex items-center gap-2.5 text-[#0D9488] shadow-2xs">
              <CheckCircleIcon className="w-5 h-5 text-[#0D9488] shrink-0" />
              <span className="text-xs sm:text-sm font-bold">
                Semua {valid.length} rekod sedia untuk dijana ke laporan.
              </span>
            </div>
          )}

          {invalid.length > 0 && (
            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-3.5 sm:p-4 space-y-2 shadow-2xs">
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
          <div className="bg-white border border-[#F1D3E3] rounded-3xl p-4 sm:p-5 space-y-3 shadow-2xs">
            <div className="flex items-center justify-between">
              <h3 className="text-sm sm:text-base font-bold text-[#28152F] font-heading">
                Pratonton Data ({mappedRecords.length} rekod)
              </h3>
              <span className="text-xs text-[#0D9488] font-semibold">
                {valid.length} sah dibaca
              </span>
            </div>

            <div className="overflow-x-auto -mx-2 sm:mx-0 rounded-xl border border-gray-100">
              <table className="w-full text-left text-xs border-collapse min-w-[340px]">
                <thead>
                  <tr className="bg-[#FFF5FA] text-[#68586B] border-b border-[#F1D3E3]">
                    <th className="py-2.5 px-3 font-bold">Produk</th>
                    <th className="py-2.5 px-3 font-bold text-right">Kuantiti</th>
                    <th className="py-2.5 px-3 font-bold text-right">Harga</th>
                    <th className="py-2.5 px-3 font-bold text-right">Kos</th>
                    <th className="py-2.5 px-3 font-bold">Tarikh</th>
                    <th className="py-2.5 px-3 font-bold">Saluran</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {mappedRecords.slice(0, 6).map((r, i) => (
                    <tr key={i} className="hover:bg-pink-50/30 transition-colors">
                      <td className="py-2.5 px-3 font-semibold text-[#28152F] truncate max-w-[120px]">
                        {r.produk || <span className="text-rose-500 italic">Tiada nama</span>}
                      </td>
                      <td className="py-2.5 px-3 text-right text-[#28152F]">
                        {(() => {
                          const q = parseQuantity(r.kuantiti)
                          return q !== null ? (
                            q.toLocaleString()
                          ) : (
                            <span className="text-rose-500 font-semibold">Ralat</span>
                          )
                        })()}
                      </td>
                      <td className="py-2.5 px-3 text-right text-[#28152F]">
                        {(() => {
                          const p = parseCurrency(r.harga)
                          return p !== null && p >= 0 ? (
                            formatRM(p)
                          ) : (
                            <span className="text-rose-500 font-semibold">Ralat</span>
                          )
                        })()}
                      </td>
                      <td className="py-2.5 px-3 text-right text-[#68586B]">
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
                      <td className="py-2.5 px-3 text-[#68586B] truncate max-w-[90px]">
                        {r.tarikh ? formatDateMY(normalizeDate(r.tarikh) || r.tarikh) : '-'}
                      </td>
                      <td className="py-2.5 px-3 text-[#68586B]">
                        {r.saluran ? normalizeChannel(r.saluran) || r.saluran : '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {mappedRecords.length > 6 && (
              <p className="text-[11px] text-[#68586B] text-center pt-1 font-body">
                Menunjukkan 6 rekod pertama daripada {mappedRecords.length} keseluruhan baris fail.
              </p>
            )}

            {/* Optional recognized columns indicator */}
            {mappedExtraCount > 0 && (
              <div className="flex flex-wrap items-center gap-1.5 pt-1 text-[11px] text-[#68586B]">
                <span className="font-semibold text-[#28152F]">Kolum Tambahan Dikesan:</span>
                {mapping.kategori && (
                  <span className="bg-pink-50 text-[#BE1E72] px-2 py-0.5 rounded-md font-medium border border-pink-100">
                    Kategori ({mapping.kategori})
                  </span>
                )}
                {mapping.kaedahBayaran && (
                  <span className="bg-pink-50 text-[#BE1E72] px-2 py-0.5 rounded-md font-medium border border-pink-100">
                    Kaedah Bayaran ({mapping.kaedahBayaran})
                  </span>
                )}
                {mapping.lokasi && (
                  <span className="bg-pink-50 text-[#BE1E72] px-2 py-0.5 rounded-md font-medium border border-pink-100">
                    Lokasi ({mapping.lokasi})
                  </span>
                )}
                {mapping.idTransaksi && (
                  <span className="bg-pink-50 text-[#BE1E72] px-2 py-0.5 rounded-md font-medium border border-pink-100">
                    ID Transaksi ({mapping.idTransaksi})
                  </span>
                )}
                {mapping.masa && (
                  <span className="bg-pink-50 text-[#BE1E72] px-2 py-0.5 rounded-md font-medium border border-pink-100">
                    Masa ({mapping.masa})
                  </span>
                )}
                {mapping.nota && (
                  <span className="bg-pink-50 text-[#BE1E72] px-2 py-0.5 rounded-md font-medium border border-pink-100">
                    Nota ({mapping.nota})
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Primary Action Buttons */}
          <div className="space-y-2.5 pt-2">
            <button
              type="button"
              onClick={handleConfirm}
              disabled={isProcessing || valid.length === 0 || !mapping.produk || !mapping.kuantiti || !mapping.harga}
              className={`w-full min-h-[48px] sm:min-h-[52px] rounded-2xl font-bold text-base flex items-center justify-center gap-2 transition-all cursor-pointer shadow-sm ${
                isProcessing || valid.length === 0 || !mapping.produk || !mapping.kuantiti || !mapping.harga
                  ? 'bg-gray-200 text-gray-400 border border-gray-200 cursor-not-allowed shadow-none'
                  : 'bg-[#BE1E72] hover:bg-[#A3165F] active:bg-[#8B0F4E] active:scale-[0.99] text-white shadow-pink-300/50'
              }`}
            >
              <CheckCircleIcon className="w-5 h-5 text-white" />
              <span>Jana Laporan Jualan ({valid.length} Rekod Sah)</span>
            </button>

            <button
              type="button"
              onClick={handleSafeBack}
              className="w-full min-h-[44px] text-xs sm:text-sm font-semibold text-[#68586B] hover:text-[#28152F] flex items-center justify-center transition-colors cursor-pointer"
            >
              &larr; Kembali ke Menu Utama
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
