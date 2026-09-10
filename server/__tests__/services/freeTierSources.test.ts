import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { OSHASource } from '@public-records/core/enrichment'

const fetchMock = vi.fn()

beforeEach(() => {
  fetchMock.mockReset()
  vi.stubGlobal('fetch', fetchMock)
})

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('OSHASource', () => {
  it('fails clearly when the upstream returns HTML with HTTP 200', async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      statusText: 'OK',
      headers: new Headers({ 'content-type': 'text/html' }),
      json: vi.fn()
    })

    const result = await new OSHASource().fetchData({ companyName: 'Acme Co' })

    expect(result.success).toBe(false)
    expect(result.source).toBe('osha')
    expect(result.error).toContain('Non-JSON response from osha')
    expect(fetchMock).toHaveBeenCalledTimes(3)
  })
})
