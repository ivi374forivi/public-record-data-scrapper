import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { CollectionError } from '../types'
import { createNJScraperCollector, NJScraperCollector } from './NJScraperCollector'

describe('NJScraperCollector', () => {
  const originalEnv = { ...process.env }

  beforeEach(() => {
    vi.restoreAllMocks()
    process.env.NJ_UCC_API_KEY = 'test-key'
    process.env.NJ_UCC_ACCOUNT_ID = 'acct-1'
    process.env.NJ_UCC_DEBTOR_SEEDS = 'Atlas Supply LLC'
    process.env.NJ_UCC_PORTAL_URL = 'https://example.test/nj-ucc'
  })

  afterEach(() => {
    process.env = { ...originalEnv }
  })

  it('fails closed when credentials or seeds are missing', async () => {
    const collector = new NJScraperCollector({})
    expect(collector.isReady()).toBe(false)
    await expect(collector.collectNewFilings({})).rejects.toThrow(CollectionError)
  })

  it('fails closed when portal returns HTML with HTTP 200', async () => {
    const collector = createNJScraperCollector()
    expect(collector.isReady()).toBe(true)

    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response('<html>blocked</html>', {
        status: 200,
        headers: { 'content-type': 'text/html' }
      })
    )

    await expect(collector.searchByBusinessName('Atlas')).rejects.toThrow(CollectionError)
    await expect(collector.searchByBusinessName('Atlas')).rejects.toThrow(/non-JSON content/i)
  })
})
