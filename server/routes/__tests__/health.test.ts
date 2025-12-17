import { describe, it, expect, vi, afterEach } from 'vitest'
import request from 'supertest'
import express from 'express'
import healthRouter from '../health'

const app = express()
app.use('/api/health', healthRouter)

describe('Health Check Routes', () => {
  const originalEnv = process.env.NODE_ENV

  afterEach(() => {
    process.env.NODE_ENV = originalEnv
    vi.restoreAllMocks()
  })

  it('should expose sensitive info in development', async () => {
    process.env.NODE_ENV = 'development'

    const res = await request(app).get('/api/health/detailed')

    expect(res.status).toBe(200)
    expect(res.body).toHaveProperty('environment', 'development')
    expect(res.body).toHaveProperty('services')
    expect(res.body.services).toHaveProperty('memory')
  })

  it('should NOT expose sensitive info in production', async () => {
    process.env.NODE_ENV = 'production'

    const res = await request(app).get('/api/health/detailed')

    expect(res.status).toBe(200)
    expect(res.body).not.toHaveProperty('environment')
    expect(res.body).not.toHaveProperty('services')
    expect(res.body).not.toHaveProperty('memory')
  })
})
