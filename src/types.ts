export type SalesChannel = 'Booth' | 'Online' | 'Lain-lain'

export interface RawSale {
  produk: string
  kuantiti: number | string
  harga: number | string
  kos?: number | string | null
  tarikh?: string | null
  saluran?: string | null
}

export interface ValidatedSale {
  id?: string
  produk: string
  kuantiti: number
  harga: number
  kos: number | null
  tarikh: string | null
  saluran: SalesChannel | null
}

export interface ColumnMapping {
  produk: string | null
  kuantiti: string | null
  harga: string | null
  kos: string | null
  tarikh: string | null
  saluran: string | null
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
