export type SalesChannel = string

export interface RawSale {
  produk: string
  kuantiti: number | string
  harga: number | string
  kos?: number | string | null
  tarikh?: string | null
  saluran?: string | null
  // Optional Additional SME Fields (Task 6)
  kategori?: string | null
  kaedahBayaran?: string | null
  lokasi?: string | null
  idTransaksi?: string | number | null
  masa?: string | null
  nota?: string | null
}

export interface ValidatedSale {
  id?: string
  produk: string
  kuantiti: number
  harga: number
  kos: number | null
  tarikh: string | null
  saluran: SalesChannel | null
  // Optional Additional SME Fields (Task 6)
  kategori?: string | null
  kaedahBayaran?: string | null
  lokasi?: string | null
  idTransaksi?: string | null
  masa?: string | null
  nota?: string | null
}

export interface ColumnMapping {
  produk: string | null
  kuantiti: string | null
  harga: string | null
  kos: string | null
  tarikh: string | null
  saluran: string | null
  // Optional Additional SME Fields (Task 6)
  kategori?: string | null
  kaedahBayaran?: string | null
  lokasi?: string | null
  idTransaksi?: string | null
  masa?: string | null
  nota?: string | null
}

export interface ParseResult {
  records: RawSale[]
  rawRows: Record<string, unknown>[]
  headers: string[]
  mapping: ColumnMapping
  errors: string[]
}

export interface ProductStats {
  produk: string
  kuantiti: number
  revenue: number
  cost: number | null
  grossProfit: number | null
  profitMarginPercent: number | null
}

export interface ChannelStats {
  saluran: SalesChannel
  kuantiti: number
  revenue: number
  percentage: number
}

export interface TrendPoint {
  tarikh: string
  displayTarikh: string
  revenue: number
  kuantiti: number
}

export interface CategoryStats {
  kategori: string
  kuantiti: number
  revenue: number
  percentage: number
}

export interface PaymentMethodStats {
  kaedah: string
  kuantiti: number
  transaksi: number
  revenue: number
  percentage: number
}

export interface SalesResult {
  totalRevenue: number
  totalKuantiti: number
  totalCost: number | null
  grossProfit: number | null
  operatingExpenses: number | null
  estimatedNetProfit: number | null
  hasCostData: boolean
  costComplete: boolean
  hasDateData: boolean
  hasChannelData: boolean
  products: ProductStats[]
  bestSeller: ProductStats | null
  highestRevenue: ProductStats | null
  highestProfit: ProductStats | null
  channels: ChannelStats[]
  trends: TrendPoint[]
  // Optional SME Insights (Task 6)
  categories: CategoryStats[]
  paymentMethods: PaymentMethodStats[]
  hasCategoryData: boolean
  hasPaymentData: boolean
  currency: string
  recordCount: number
}

export interface ValidationIssue {
  row: number
  field: string
  message: string
}

export interface ValidationSummary {
  valid: ValidatedSale[]
  invalid: { row: number; sale: RawSale; issues: ValidationIssue[] }[]
  allIssues: ValidationIssue[]
}

export interface ChatMessage {
  id: string
  text: string
  sender: 'user' | 'bot'
  timestamp?: string
  isPlaceholder?: boolean
  isLocalCalculation?: boolean
  isError?: boolean
  model?: string
  suggestedFollowUps?: string[]
}

export interface MonthOption {
  key: string
  label: string
  fullName: string
  year: number
  month: number
}

export interface MonthlyComparison {
  currentMonthKey: string
  currentMonthLabel: string
  currentRevenue: number
  currentKuantiti: number
  previousMonthKey: string | null
  previousMonthLabel: string | null
  previousRevenue: number | null
  previousKuantiti: number | null
  diffRevenue: number | null
  diffKuantiti: number | null
  percentageChange: number | null
  trend: 'increase' | 'decrease' | 'equal' | 'none'
  summaryText: string
  isPartialMonth?: boolean
}

export interface WeekdayStat {
  dayIndex: number
  nameMY: string
  nameEN: string
  isWeekend: boolean
  revenue: number
  kuantiti: number
  recordCount: number
  distinctDatesCount: number
  avgRevenuePerDate: number
}

export interface WeekdayAnalytics {
  days: WeekdayStat[]
  highestRevenueDay: WeekdayStat | null
  highestAvgDay: WeekdayStat | null
  lowestRevenueDay: WeekdayStat | null
  weekendRevenue: number
  weekdayRevenue: number
  weekendKuantiti: number
  weekdayKuantiti: number
  weekendPercentage: number
  weekendRecordedDates: number
  weekdayRecordedDates: number
  avgWeekendDailyRevenue: number
  avgWeekdayDailyRevenue: number
  isWeekendMoreProfitable: boolean
  hasDateData: boolean
}

export interface DailyStat {
  tarikh: string
  displayTarikh: string
  weekdayMY: string
  revenue: number
  kuantiti: number
  recordCount: number
}

export interface DailyAnalytics {
  totalRecordedDates: number
  highestRevenueDate: DailyStat | null
  lowestRevenueDate: DailyStat | null
  avgDailyRevenue: number
  dateRange: { start: string; end: string } | null
  hasDateData: boolean
  dailyStats: DailyStat[]
}

export interface MonthSummary {
  key: string
  label: string
  fullName: string
  revenue: number
  kuantiti: number
  recordCount: number
  grossProfit: number | null
  bestSellerQty: { produk: string; kuantiti: number } | null
  bestSellerRev: { produk: string; revenue: number } | null
}


