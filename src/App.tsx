import { useState, useMemo, useEffect } from 'react'
import { Layout } from './components/Layout'
import { LandingHero } from './components/LandingHero'
import { Homepage } from './components/Homepage'
import { StoryInputForm } from './components/StoryInputForm'
import { UploadForm } from './components/UploadForm'
import { ManualEntryForm } from './components/ManualEntryForm'
import { Dashboard } from './components/Dashboard'
import { Chat } from './components/Chat'
import { UserGuide } from './components/UserGuide'
import { InstallPwaBanner } from './components/InstallPwaBanner'
import { calculateSales, emptyResult } from './calc/sales'
import {
  extractAvailableMonths,
  filterSalesByMonth,
  calculateMonthlyComparison,
} from './calc/monthly'
import { validateRecords } from './data/validate'
import { SAMPLE_SALES } from './data/sample'
import {
  saveReportToStorage,
  getSavedReportFromStorage,
  clearSavedReportFromStorage,
  generateReportId,
  type SaveStatus,
} from './data/storage'
import type { RawSale, SalesResult, ChatMessage } from './types'

type Page = 'landing' | 'home' | 'story' | 'upload' | 'manual' | 'dashboard' | 'chat' | 'guide'

const INITIAL_CHAT_MESSAGES: ChatMessage[] = [
  {
    id: 'welcome',
    text: 'Hai Puan! 🌷 Saya Pembantu Mekara.\nSaya boleh bantu Puan memahami rekod jualan, keuntungan dan prestasi perniagaan.\n\nAda apa-apa soalan mengenai prestasi jualan atau produk yang ingin Puan ketahui?',
    sender: 'bot',
    timestamp: '11:05',
    model: 'gemini-1.5-flash-lite',
    isLocalCalculation: false,
    suggestedFollowUps: ['Terangkan lagi', 'Cadangan produk lain', 'Apa tindakan seterusnya?'],
  },
]

export default function App() {
  const [page, setPage] = useState<Page>('landing')
  const [previousPage, setPreviousPage] = useState<Page>('landing')
  const [currentRecords, setCurrentRecords] = useState<RawSale[]>([])
  const [operatingExpenses, setOperatingExpenses] = useState<number | null>(null)
  const [selectedMonth, setSelectedMonth] = useState<string>('ALL')
  const [isSampleData, setIsSampleData] = useState<boolean>(false)
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>(INITIAL_CHAT_MESSAGES)
  const [storyText, setStoryText] = useState<string>('')
  const [isStoryReview, setIsStoryReview] = useState<boolean>(false)
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle')
  const [isRestored, setIsRestored] = useState<boolean>(false)
  const [activeReportId, setActiveReportId] = useState<string>(() => generateReportId())
  const [savedRecordCount, setSavedRecordCount] = useState<number>(0)

  // 1. Initial State Restoration from IndexedDB
  useEffect(() => {
    let mounted = true
    const restoreState = async () => {
      try {
        const saved = await getSavedReportFromStorage()
        if (!mounted || !saved) return

        if (saved.records && saved.records.length > 0) {
          setCurrentRecords(saved.records)
          setSavedRecordCount(saved.records.length)
          if (saved.operatingExpenses !== undefined) {
            setOperatingExpenses(saved.operatingExpenses)
          }
          if (saved.selectedMonth) {
            setSelectedMonth(saved.selectedMonth)
          }
          if (saved.isSampleData !== undefined) {
            setIsSampleData(saved.isSampleData)
          }
          if (saved.chatMessages && saved.chatMessages.length > 0) {
            setChatMessages(saved.chatMessages)
          }
          if (saved.storyDraft?.storyText) {
            setStoryText(saved.storyDraft.storyText)
            setIsStoryReview(Boolean(saved.storyDraft.isStoryReview))
          }
          if (saved.reportId) {
            setActiveReportId(saved.reportId)
          }
          if (saved.page && saved.page !== 'home') {
            setPage(saved.page)
          }
        }
      } catch (err) {
        console.warn('Error during state restoration:', err)
      } finally {
        if (mounted) {
          setIsRestored(true)
        }
      }
    }

    restoreState()
    return () => {
      mounted = false
    }
  }, [])

  // 2. Debounced Automatic Persistence
  useEffect(() => {
    if (!isRestored) return

    const hasData = currentRecords.length > 0 || storyText.trim().length > 0
    if (!hasData) return

    setSaveStatus('saving')
    const timer = setTimeout(async () => {
      try {
        const ok = await saveReportToStorage({
          version: 1,
          reportId: activeReportId,
          updatedAt: new Date().toISOString(),
          records: currentRecords,
          operatingExpenses,
          selectedMonth,
          isSampleData,
          page,
          chatMessages,
          storyDraft: {
            storyText,
            isStoryReview,
          },
        })
        setSaveStatus(ok ? 'saved' : 'error')
        if (ok) {
          setSavedRecordCount(currentRecords.length)
        }
      } catch {
        setSaveStatus('error')
      }
    }, 400)

    return () => clearTimeout(timer)
  }, [
    isRestored,
    currentRecords,
    operatingExpenses,
    selectedMonth,
    isSampleData,
    page,
    chatMessages,
    storyText,
    isStoryReview,
    activeReportId,
  ])

  // 3. Reset window scroll to top whenever page navigation occurs
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' })
  }, [page])

  const handleOpenGuide = () => {
    setPreviousPage(page)
    setPage('guide')
  }

  const handleCloseGuide = () => {
    setPage(previousPage)
  }

  // Validated records memoized
  const validRecords = useMemo(() => {
    if (currentRecords.length === 0) return []
    const { valid } = validateRecords(currentRecords)
    return valid
  }, [currentRecords])

  // Extract available months dynamically from actual validated dates
  const availableMonths = useMemo(() => {
    return extractAvailableMonths(validRecords)
  }, [validRecords])

  // Single consistent filtered dataset derived from original records
  const filteredRecords = useMemo(() => {
    return filterSalesByMonth(validRecords, selectedMonth)
  }, [validRecords, selectedMonth])

  // Full dataset result across all periods
  const allSalesResult: SalesResult = useMemo(() => {
    if (validRecords.length === 0) {
      return emptyResult()
    }
    return calculateSales(validRecords, operatingExpenses)
  }, [validRecords, operatingExpenses])

  const isFilteredMonth = selectedMonth !== 'ALL' && selectedMonth !== 'semua'

  // Current view calculation result (All-time or filtered month)
  const salesResult: SalesResult = useMemo(() => {
    if (filteredRecords.length === 0) {
      return emptyResult()
    }
    // Rule 4: Do not deduct the same global operating expense from individual months without monthly attribution
    return isFilteredMonth
      ? calculateSales(filteredRecords, null)
      : allSalesResult
  }, [filteredRecords, isFilteredMonth, allSalesResult])

  // Performance comparison between months
  const monthlyComparison = useMemo(() => {
    return calculateMonthlyComparison(validRecords, selectedMonth, availableMonths)
  }, [validRecords, selectedMonth, availableMonths])

  // Confirming user records from story, upload, or manual form
  const handleConfirmData = (records: RawSale[], opex?: number | null) => {
    const { valid, invalid } = validateRecords(records)

    if (invalid.length > 0) {
      const topErrors = invalid
        .slice(0, 3)
        .map((inv) => `Baris ${inv.row}: ${inv.issues.map((i) => i.message).join(' ')}`)
        .join('\n')
      alert(
        `Terdapat ${invalid.length} baris yang tidak sah. Sila semak semula:\n\n${topErrors}`
      )
      return
    }

    if (valid.length === 0) {
      alert('Sila masukkan sekurang-kurangnya satu rekod jualan yang sah.')
      return
    }

    setCurrentRecords(records)
    setSelectedMonth('ALL')
    if (opex !== undefined) {
      setOperatingExpenses(opex)
    }
    setIsSampleData(false)
    setActiveReportId(generateReportId())
    setChatMessages(INITIAL_CHAT_MESSAGES) // Start fresh AI chat for new report
    setPage('dashboard')
  }

  // Option C: Cuba Data Contoh
  const handleLoadSample = () => {
    const rawSample: RawSale[] = SAMPLE_SALES.map((s) => ({
      produk: s.produk,
      kuantiti: s.kuantiti,
      harga: s.harga,
      kos: s.kos,
      tarikh: s.tarikh,
      saluran: s.saluran,
    }))

    setCurrentRecords(rawSample)
    setSelectedMonth('ALL')
    setOperatingExpenses(null)
    setIsSampleData(true)
    setActiveReportId(generateReportId())
    setChatMessages(INITIAL_CHAT_MESSAGES)
    setPage('dashboard')
  }

  // Start fresh report with confirmation
  const handleStartNewReport = async () => {
    if (
      currentRecords.length > 0 &&
      !confirm('Adakah Puan pasti mahu memulakan laporan baharu? Data jualan tersimpan sebelum ini akan dipadam.')
    ) {
      return
    }
    await clearSavedReportFromStorage()
    setCurrentRecords([])
    setSelectedMonth('ALL')
    setOperatingExpenses(null)
    setIsSampleData(false)
    setChatMessages(INITIAL_CHAT_MESSAGES)
    setStoryText('')
    setIsStoryReview(false)
    setActiveReportId(generateReportId())
    setSavedRecordCount(0)
    setSaveStatus('idle')
    setPage('home')
  }

  const handleReset = async () => {
    if (confirm('Adakah anda pasti mahu memadam semua data sesi dan rekod tersimpan ini untuk kembali ke menu utama?')) {
      await clearSavedReportFromStorage()
      setCurrentRecords([])
      setSelectedMonth('ALL')
      setOperatingExpenses(null)
      setIsSampleData(false)
      setChatMessages(INITIAL_CHAT_MESSAGES)
      setStoryText('')
      setIsStoryReview(false)
      setActiveReportId(generateReportId())
      setSavedRecordCount(0)
      setSaveStatus('idle')
      setPage('home')
    }
  }

  // Header step text and back action
  let currentStep = 'Menu Utama'
  let subtitle: string | undefined = undefined
  let stepIndicator: string | undefined = undefined
  let showBack = false
  let onBack: (() => void) | undefined = undefined

  if (page === 'landing') {
    currentStep = ''
    subtitle = undefined
    showBack = false
    onBack = undefined
  } else if (page === 'home') {
    currentStep = 'Pilih Kaedah Jualan'
    subtitle = undefined
    showBack = true
    onBack = () => setPage('landing')
  } else if (page === 'story') {
    currentStep = isStoryReview ? 'Semak Maklumat' : 'Ceritakan Jualan'
    stepIndicator = isStoryReview ? 'Langkah 2/3' : undefined
    showBack = true
    onBack = () => {
      if (isStoryReview) {
        setIsStoryReview(false)
      } else {
        setPage('home')
      }
    }
  } else if (page === 'upload') {
    currentStep = 'Muat Naik Jualan'
    showBack = true
    onBack = () => setPage('home')
  } else if (page === 'manual') {
    currentStep = 'Urus Rekod Jualan'
    showBack = true
    onBack = () => (currentRecords.length > 0 ? setPage('dashboard') : setPage('home'))
  } else if (page === 'dashboard') {
    currentStep = 'Laporan Jualan'
    const recCount = salesResult.recordCount
    const sampleText = isSampleData ? 'Data contoh' : ''
    let dateRange = ''
    if (salesResult.hasDateData && salesResult.trends.length > 0) {
      const firstDate = salesResult.trends[0].displayTarikh
      const lastDate = salesResult.trends[salesResult.trends.length - 1].displayTarikh
      if (firstDate && lastDate && firstDate !== lastDate) {
        dateRange = `${firstDate} - ${lastDate}`
      } else if (firstDate) {
        dateRange = firstDate
      }
    }
    subtitle = [recCount > 0 ? `${recCount} rekod jualan` : '', dateRange || sampleText].filter(Boolean).join(' • ')
    showBack = true
    onBack = () => setPage('home')
  } else if (page === 'chat') {
    currentStep = 'Mekara'
    subtitle = ''
    showBack = true
    onBack = () => setPage('dashboard')
  } else if (page === 'guide') {
    currentStep = 'Panduan Mekara'
    subtitle = ''
    showBack = true
    onBack = handleCloseGuide
  }

  return (
    <Layout
      currentStep={currentStep}
      subtitle={subtitle}
      stepIndicator={stepIndicator}
      showBack={showBack}
      onBack={onBack}
      onOpenGuide={page === 'guide' ? undefined : handleOpenGuide}
      isLanding={page === 'landing'}
      isHome={page === 'home'}
      isStory={page === 'story'}
      isInnerBerryPop={
        page === 'story' ||
        page === 'upload' ||
        page === 'manual' ||
        page === 'dashboard' ||
        page === 'chat' ||
        page === 'guide'
      }
      isFullScreen={page === 'chat'}
      hideFooter={page === 'chat'}
      onNavHome={() => {
        setIsStoryReview(false)
        if (page === 'home') {
          setPage('landing')
        } else {
          setPage('home')
        }
      }}
      saveStatus={saveStatus}
    >
      {page === 'landing' && (
        <LandingHero onEnter={() => setPage('home')} />
      )}

      {page === 'home' && (
        <Homepage
          onStory={() => setPage('story')}
          onUpload={() => setPage('upload')}
          onManual={() => setPage('manual')}
          onSample={handleLoadSample}
          onOpenGuide={handleOpenGuide}
          hasSavedReport={savedRecordCount > 0 || currentRecords.length > 0}
          savedRecordCount={savedRecordCount || currentRecords.length}
          onResumeSavedReport={() => setPage('dashboard')}
          onStartNewReport={handleStartNewReport}
        />
      )}

      {page === 'story' && (
        <StoryInputForm
          initialStory={storyText}
          initialRecords={currentRecords}
          onStoryChange={setStoryText}
          isReviewStage={isStoryReview}
          onReviewStageChange={setIsStoryReview}
          onConfirm={(records, opex) => handleConfirmData(records, opex)}
          onBack={() => setPage('home')}
        />
      )}

      {page === 'upload' && (
        <UploadForm
          onConfirm={handleConfirmData}
          onBack={() => setPage('home')}
        />
      )}

      {page === 'manual' && (
        <ManualEntryForm
          initialRecords={currentRecords}
          onConfirm={handleConfirmData}
          onBack={() => (currentRecords.length > 0 ? setPage('dashboard') : setPage('home'))}
        />
      )}

      {page === 'dashboard' && (
        <Dashboard
          result={salesResult}
          allResult={allSalesResult}
          allRecords={validRecords}
          reportId={activeReportId}
          selectedMonth={selectedMonth}
          onSelectMonth={setSelectedMonth}
          availableMonths={availableMonths}
          monthlyComparison={monthlyComparison}
          operatingExpenses={operatingExpenses}
          onUpdateOperatingExpenses={(val) => setOperatingExpenses(val)}
          onEdit={() => setPage('manual')}
          onAsk={() => setPage('chat')}
          onReset={handleReset}
          isSampleData={isSampleData}
        />
      )}

      {page === 'chat' && (
        <Chat
          result={salesResult}
          allResult={allSalesResult}
          selectedPeriod={
            selectedMonth === 'ALL' || selectedMonth === 'semua'
              ? 'Semua'
              : availableMonths.find((m) => m.key === selectedMonth)?.label || selectedMonth
          }
          monthlyComparison={monthlyComparison}
          availableMonths={availableMonths}
          allRecords={validRecords}
          messages={chatMessages}
          onUpdateMessages={setChatMessages}
          onBack={() => setPage('dashboard')}
        />
      )}

      {page === 'guide' && (
        <UserGuide
          onClose={handleCloseGuide}
          onNavigate={(targetPage) => {
            setPreviousPage(targetPage === 'dashboard' || targetPage === 'chat' ? 'dashboard' : 'home')
            setPage(targetPage)
          }}
          hasExistingData={validRecords.length > 0}
        />
      )}

      {/* Floating Smart Install Banner (Pilihan 1 - Apple Style) */}
      {page !== 'chat' && <InstallPwaBanner />}
    </Layout>
  )
}
