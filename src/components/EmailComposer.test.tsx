import { render, screen, fireEvent } from '@testing-library/react'
import { EmailComposer } from './EmailComposer'
import { vi, describe, it, expect, beforeEach } from 'vitest'
import { Prospect } from '@/lib/types'
import { toast } from 'sonner'

// Mock sonner toast
vi.mock('sonner', () => ({
  toast: {
    error: vi.fn(),
    success: vi.fn()
  }
}))

// Mock Phosphor Icons
vi.mock('@phosphor-icons/react', () => ({
  Envelope: () => <div data-testid="envelope-icon" />,
  PaperPlaneRight: () => <div data-testid="send-icon" />,
  Calendar: () => <div data-testid="calendar-icon" />,
  Eye: () => <div data-testid="eye-icon" />
}))

const mockProspect: Prospect = {
  id: '1',
  companyName: 'Acme Corp',
  industry: 'Tech',
  priorityScore: 85,
  healthScore: { grade: 'B', score: 80, trend: 'stable' },
  growthSignals: [],
  timeSinceDefault: 1000,
  status: 'active',
  lastContactDate: '2023-01-01',
  contacts: [],
  mlScoring: {
    confidence: 0.9,
    recoveryLikelihood: 0.8,
    modelVersion: '1.0',
    lastUpdated: '2023-01-01'
  }
}

describe('EmailComposer', () => {
  const onOpenChange = vi.fn()
  const onSendEmail = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders correctly when open', () => {
    render(
      <EmailComposer
        prospect={mockProspect}
        open={true}
        onOpenChange={onOpenChange}
        onSendEmail={onSendEmail}
      />
    )

    expect(screen.getByText('Compose Email')).toBeInTheDocument()
    // Using getAllByLabelText because there might be multiple (like visually hidden ones, or just generic matches)
    // But getByLabelText should work if label is associated correctly
    expect(screen.getByLabelText(/subject/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/email body/i)).toBeInTheDocument()
  })

  it('shows error toast when trying to send empty form', () => {
    render(
      <EmailComposer
        prospect={mockProspect}
        open={true}
        onOpenChange={onOpenChange}
        onSendEmail={onSendEmail}
      />
    )

    fireEvent.click(screen.getByText('Send Email'))

    expect(toast.error).toHaveBeenCalledWith('Subject and body are required')
    expect(onSendEmail).not.toHaveBeenCalled()
  })

  it('calls onSendEmail when form is valid', () => {
    render(
      <EmailComposer
        prospect={mockProspect}
        open={true}
        onOpenChange={onOpenChange}
        onSendEmail={onSendEmail}
      />
    )

    fireEvent.change(screen.getByLabelText(/subject/i), { target: { value: 'Test Subject' } })
    fireEvent.change(screen.getByLabelText(/email body/i), { target: { value: 'Test Body' } })

    fireEvent.click(screen.getByText('Send Email'))

    expect(onSendEmail).toHaveBeenCalledWith(expect.objectContaining({
      subject: 'Test Subject',
      body: 'Test Body'
    }))
  })

  it('shows character count', () => {
    render(
      <EmailComposer
        prospect={mockProspect}
        open={true}
        onOpenChange={onOpenChange}
        onSendEmail={onSendEmail}
      />
    )

    const bodyInput = screen.getByLabelText(/email body/i)
    fireEvent.change(bodyInput, { target: { value: 'Hello' } })

    expect(screen.getByText('5 characters')).toBeInTheDocument()
  })
})
