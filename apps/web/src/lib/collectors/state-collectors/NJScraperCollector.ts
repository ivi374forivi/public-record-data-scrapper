import { RateLimiter } from '../RateLimiter'
import {
  CollectionError,
  type CollectionOptions,
  type CollectorStatus,
  type Party,
  type SearchResult,
  type StateCollector,
  type UCCFiling,
  type ValidationResult
} from '../types'

interface NJScraperConfig {
  portalUrl?: string
  apiKey?: string
  accountId?: string
  debtorSeeds?: string[]
}

interface NJPortalRecord {
  filingNumber?: string
  filingType?: string
  filingDate?: string
  status?: string
  debtorName?: string
  securedPartyName?: string
  collateral?: string
}

export class NJScraperCollector implements StateCollector {
  private readonly portalUrl: string
  private readonly apiKey: string
  private readonly accountId: string
  private readonly debtorSeeds: string[]
  private readonly rateLimiter: RateLimiter
  private readonly stats = {
    totalCollected: 0,
    totalErrors: 0,
    totalRequests: 0,
    lastCollectionTime: undefined as string | undefined,
    latencies: [] as number[]
  }

  constructor(config: NJScraperConfig = {}) {
    this.portalUrl = config.portalUrl ?? 'https://www.njportal.com/ucc/search'
    this.apiKey = (config.apiKey ?? '').trim()
    this.accountId = (config.accountId ?? '').trim()
    this.debtorSeeds = (config.debtorSeeds ?? [])
      .map((seed) => seed.trim())
      .filter((seed) => seed.length > 0)

    this.rateLimiter = new RateLimiter({
      requestsPerMinute: 6,
      requestsPerHour: 180,
      requestsPerDay: 1500
    })
  }

  isReady(): boolean {
    return Boolean(this.apiKey && this.accountId && this.debtorSeeds.length > 0)
  }

  async searchByBusinessName(name: string): Promise<SearchResult> {
    const records = await this.queryPortal(name)
    const filings = records.map((record) => this.mapRecord(record))
    this.stats.totalCollected += filings.length
    this.stats.lastCollectionTime = new Date().toISOString()

    return {
      filings,
      total: filings.length,
      hasMore: false
    }
  }

  async searchByFilingNumber(number: string): Promise<UCCFiling | null> {
    const records = await this.queryPortal('', number)
    const match = records.find((record) => (record.filingNumber ?? '').trim() === number.trim())
    return match ? this.mapRecord(match) : null
  }

  async getFilingDetails(filingNumber: string): Promise<UCCFiling> {
    const filing = await this.searchByFilingNumber(filingNumber)
    if (!filing) {
      throw new CollectionError(
        'NJ',
        'STRUCTURE_CHANGE',
        false,
        `NJ filing not found: ${filingNumber}`
      )
    }
    return filing
  }

  async collectNewFilings(options: CollectionOptions): Promise<UCCFiling[]> {
    if (!this.isReady()) {
      throw new CollectionError(
        'NJ',
        'AUTH',
        false,
        'NJ collector is not configured. Set NJ_UCC_API_KEY, NJ_UCC_ACCOUNT_ID, and NJ_UCC_DEBTOR_SEEDS.'
      )
    }

    const limit = options.limit ?? 500
    const unique = new Map<string, UCCFiling>()

    for (const seed of this.debtorSeeds) {
      if (unique.size >= limit) break
      const result = await this.searchByBusinessName(seed)
      for (const filing of result.filings) {
        if (!unique.has(filing.filingNumber)) {
          unique.set(filing.filingNumber, filing)
        }
        if (unique.size >= limit) break
      }
    }

    return Array.from(unique.values()).slice(0, limit)
  }

  validateFiling(filing: UCCFiling): ValidationResult {
    const errors: string[] = []
    const warnings: string[] = []
    if (!filing.filingNumber) errors.push('Missing filing number')
    if (!filing.filingDate) errors.push('Missing filing date')
    if (!filing.debtor?.name) errors.push('Missing debtor name')
    if (!filing.securedParty?.name) errors.push('Missing secured party name')
    if (!filing.collateral) warnings.push('Missing collateral description')
    if (filing.state !== 'NJ') errors.push(`Invalid state: ${filing.state}, expected NJ`)
    return { valid: errors.length === 0, errors, warnings }
  }

  getStatus(): CollectorStatus {
    const rate = this.rateLimiter.getStats()
    return {
      isHealthy: this.isReady() && this.stats.totalErrors === 0,
      lastCollectionTime: this.stats.lastCollectionTime,
      totalCollected: this.stats.totalCollected,
      errorRate:
        this.stats.totalRequests > 0 ? this.stats.totalErrors / this.stats.totalRequests : 0,
      averageLatency:
        this.stats.latencies.length > 0
          ? this.stats.latencies.reduce((a, b) => a + b, 0) / this.stats.latencies.length
          : 0,
      rateLimitStats: {
        perMinute: rate.perMinute,
        perHour: rate.perHour,
        perDay: rate.perDay
      }
    }
  }

  private async queryPortal(name: string, filingNumber?: string): Promise<NJPortalRecord[]> {
    if (!this.isReady()) {
      this.stats.totalErrors++
      throw new CollectionError(
        'NJ',
        'AUTH',
        false,
        'NJ collector is not configured. Set NJ_UCC_API_KEY, NJ_UCC_ACCOUNT_ID, and NJ_UCC_DEBTOR_SEEDS.'
      )
    }

    await this.rateLimiter.acquire()
    this.stats.totalRequests++

    const startTime = Date.now()
    try {
      const response = await fetch(this.portalUrl, {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
          'X-NJ-API-Key': this.apiKey,
          'X-NJ-Account-ID': this.accountId
        },
        body: JSON.stringify({
          debtorName: name || undefined,
          filingNumber: filingNumber || undefined
        })
      })

      if (!response.ok) {
        throw new CollectionError(
          'NJ',
          'NETWORK',
          response.status >= 500,
          `NJ portal error ${response.status}: ${response.statusText || 'unknown'}`
        )
      }

      const contentType = response.headers.get('content-type') ?? ''
      if (!/json/i.test(contentType)) {
        throw new CollectionError(
          'NJ',
          'STRUCTURE_CHANGE',
          false,
          `NJ portal returned non-JSON content (${contentType || 'unknown'})`
        )
      }

      let payload: unknown
      try {
        payload = await response.json()
      } catch {
        throw new CollectionError('NJ', 'PARSE', false, 'NJ portal returned invalid JSON')
      }

      if (!Array.isArray(payload)) {
        throw new CollectionError('NJ', 'PARSE', false, 'NJ portal payload is not an array')
      }

      return payload as NJPortalRecord[]
    } catch (error) {
      this.stats.totalErrors++
      if (error instanceof CollectionError) throw error
      throw new CollectionError(
        'NJ',
        'NETWORK',
        true,
        `NJ portal request failed: ${error instanceof Error ? error.message : 'unknown error'}`
      )
    } finally {
      const duration = Date.now() - startTime
      this.stats.latencies.push(duration)
      if (this.stats.latencies.length > 100) this.stats.latencies.shift()
    }
  }

  private mapRecord(record: NJPortalRecord): UCCFiling {
    const debtor: Party = { name: (record.debtorName ?? '').trim() || 'Unknown Debtor' }
    const securedParty: Party = {
      name: (record.securedPartyName ?? '').trim() || 'Unknown Secured Party'
    }

    return {
      filingNumber: (record.filingNumber ?? '').trim(),
      filingType: (record.filingType ?? 'UCC-1').trim(),
      filingDate: (record.filingDate ?? '').trim(),
      status: this.normalizeStatus(record.status),
      state: 'NJ',
      securedParty,
      debtor,
      collateral: (record.collateral ?? '').trim(),
      rawData: record as Record<string, unknown>
    }
  }

  private normalizeStatus(status: string | undefined): UCCFiling['status'] {
    const normalized = (status ?? '').toLowerCase()
    if (normalized.includes('laps')) return 'lapsed'
    if (normalized.includes('termin')) return 'terminated'
    if (normalized.includes('amend')) return 'amended'
    return 'active'
  }
}

function parseDebtorSeeds(raw: string | undefined): string[] {
  if (!raw) return []
  return raw
    .split(',')
    .map((seed) => seed.trim())
    .filter((seed) => seed.length > 0)
}

export function createNJScraperCollector(): NJScraperCollector {
  return new NJScraperCollector({
    portalUrl: process.env.NJ_UCC_PORTAL_URL,
    apiKey: process.env.NJ_UCC_API_KEY,
    accountId: process.env.NJ_UCC_ACCOUNT_ID,
    debtorSeeds: parseDebtorSeeds(process.env.NJ_UCC_DEBTOR_SEEDS)
  })
}
