import { useState, useMemo } from 'react'
import { Layout } from './components/Layout'
import { Homepage } from './components/Homepage'
import { StoryInputForm } from './components/StoryInputForm'
import { UploadForm } from './components/UploadForm'
import { ManualEntryForm } from './components/ManualEntryForm'
import { Dashboard } from './components/Dashboard'
import { Chat } from './components/Chat'
import { UserGuide } from './components/UserGuide'
import { calculateSales, emptyResult } from './calc/sales'
import { validateRecords } from './data/validate'
import { SAMPLE_SALES } from './data/sample'
import type { RawSale, SalesResult, ChatMessage } from './types'

type Page = 'home' | 'story' | 'upload' | 'manual' | 'dashboard' | 'chat' | 'guide'

const INITIAL_CHAT_MESSAGES: ChatMessage[] = [
  {
    id: 'welcome',
    text: 'Salam sejahtera, Puan! 😊\nSaya Pembantu AI Wanita Niaga yang siap membantu perniagaan Puan hari ini.\n\nAda apa-apa soalan mengenai prestasi jualan atau produk Puan yang ingin Puan ketahui?',
    sender: 'bot',
    timestamp: '11:05',
    model: 'gemini-1.5-flash-lite',
    isLocalCalculation: false,
    suggestedFollowUps: ['Terangkan lagi', 'Cadangan produk lain', 'Apa tindakan seterusnya?'],
  },
]

export default function App() {
  const [page, setPage] = useState<Page>('home')
  const [previousPage, setPreviousPage] = useState<Page>('home')
  const [currentRecords, setCurrentRecords] = useState<RawSale[]>([])
  const [operatingExpenses, setOperatingExpenses] = useState<number | null>(null)
  const [isSampleData, setIsSampleData] = useState<boolean>(false)
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>(INITIAL_CHAT_MESSAGES)
  const [storyText, setStoryText] = useState<string>('')
  const [isStoryReview, setIsStoryReview] = useState<boolean>(false)

  const handleOpenGuide = () => {
    setPreviousPage(page)
    setPage('guide')
  }

  const handleCloseGuide = () => {
    setPage(previousPage)
  }

  // Compute sales calculations on the fly whenever currentRecords or operatingExpenses change
  const salesResult: SalesResult = useMemo(() => {
    if (currentRecords.length === 0) {
      return emptyResult()
    }
    const { valid } = validateRecords(currentRecords)
    return calculateSales(valid, operatingExpenses)
  }, [currentRecords, operatingExpenses])

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
    if (opex !== undefined) {
      setOperatingExpenses(opex)
    }
    setIsSampleData(false)
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
    setOperatingExpenses(null)
    setIsSampleData(true)
    setPage('dashboard')
  }

  const handleReset = () => {
    if (confirm('Adakah anda pasti mahu memadam semua data sesi ini dan kembali ke menu utama?')) {
      setCurrentRecords([])
      setOperatingExpenses(null)
      setIsSampleData(false)
      setChatMessages(INITIAL_CHAT_MESSAGES)
      setPage('home')
    }
  }

  // Header step text and back action
  let currentStep = 'Menu Utama'
  let subtitle: string | undefined = undefined
  let stepIndicator: string | undefined = undefined
  let showBack = false
  let onBack = () => setPage('home')

  if (page === 'story') {
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
    currentStep = 'Isi Jualan Manual'
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
    currentStep = 'Pembantu AI'
    showBack = true
    onBack = () => setPage('dashboard')
  } else if (page === 'guide') {
    currentStep = 'Panduan Pengguna'
    subtitle = 'Ketahui cara menggunakan Wanita Niaga AI'
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
      hideHeader={page === 'chat'}
      onNavHome={() => {
        setIsStoryReview(false)
        setPage('home')
      }}
    >
      {page === 'home' && (
        <Homepage
          onStory={() => setPage('story')}
          onUpload={() => setPage('upload')}
          onManual={() => setPage('manual')}
          onSample={handleLoadSample}
          onOpenGuide={handleOpenGuide}
        />
      )}

      {page === 'story' && (
        <StoryInputForm
          initialStory={storyText}
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
          messages={chatMessages}
          onUpdateMessages={setChatMessages}
          onBack={() => setPage('dashboard')}
        />
      )}

      {page === 'guide' && (
        <UserGuide onClose={handleCloseGuide} />
      )}
    </Layout>
  )
}
