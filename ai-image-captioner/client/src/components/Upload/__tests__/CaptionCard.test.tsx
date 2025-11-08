import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import CaptionCard from '../CaptionCard'

vi.mock('../CopyButton', () => ({
  default: ({ disabled }: { disabled?: boolean }) => (
    <button disabled={disabled} data-testid="copy-btn">Copy</button>
  ),
}))

describe('CaptionCard', () => {
  it('renders image and tone label', () => {
    render(<CaptionCard imageUrl="/img.jpg" tone="funny" caption="hello" />)
    expect(screen.getByAltText('Uploaded preview')).toHaveAttribute('src', '/img.jpg')
    expect(screen.getByText('Funny')).toBeInTheDocument()
  })

  it('renders caption when provided', () => {
    render(<CaptionCard imageUrl="/x.png" tone="serious" caption="A test caption" />)
    expect(screen.getByText('A test caption')).toBeInTheDocument()
    expect(screen.getByTestId('copy-btn')).not.toBeDisabled()
  })

  it('shows placeholder and disables copy when no caption', () => {
    render(<CaptionCard imageUrl="/x.png" tone="neutral" caption={null} />)
    expect(screen.getByText(/no caption yet/i)).toBeInTheDocument()
    expect(screen.getByTestId('copy-btn')).toBeDisabled()
  })

  it('shows loading skeleton when loading', () => {
    const { container } = render(<CaptionCard imageUrl="/x.png" tone="neutral" caption={null} loading />)
    expect(container.querySelectorAll('.animate-pulse').length).toBeGreaterThan(0)
  })
})
