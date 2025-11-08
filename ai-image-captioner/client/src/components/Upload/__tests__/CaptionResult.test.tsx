import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import CaptionResult from '../CaptionResult'

vi.mock('../CopyButton', () => ({
  default: ({ text }: { text: string }) => <button data-testid="copy-btn">{text}</button>,
}))

describe('CaptionResult', () => {
  it('renders caption and tone correctly', () => {
    render(
      <CaptionResult
        caption="A cool caption"
        tone="funny"
        onRegenerate={() => {}}
        onUse={() => {}}
        onSave={() => {}}
      />
    )
    expect(screen.getByTestId('caption-text')).toHaveTextContent('A cool caption')
    expect(screen.getByTestId('tone-badge')).toHaveTextContent('Funny')
  })

  it('handles save, use, and regenerate actions', () => {
    const onSave = vi.fn()
    const onUse = vi.fn()
    const onRegenerate = vi.fn()
    render(
      <CaptionResult
        caption="caption"
        tone="neutral"
        onSave={onSave}
        onUse={onUse}
        onRegenerate={onRegenerate}
      />
    )
    fireEvent.click(screen.getByText(/save to workspace/i))
    fireEvent.click(screen.getByText(/use → editor/i))
    fireEvent.click(screen.getByText(/regenerate/i))
    expect(onSave).toHaveBeenCalled()
    expect(onUse).toHaveBeenCalled()
    expect(onRegenerate).toHaveBeenCalled()
  })

  it('shows saving spinner and done state', () => {
    const { rerender } = render(
      <CaptionResult
        caption="x"
        tone="neutral"
        onRegenerate={() => {}}
        onUse={() => {}}
        onSave={() => {}}
        saveBusy
      />
    )
    expect(screen.getByText(/saving/i)).toBeInTheDocument()
    rerender(
      <CaptionResult
        caption="x"
        tone="neutral"
        onRegenerate={() => {}}
        onUse={() => {}}
        onSave={() => {}}
        saveDone
      />
    )
    expect(screen.getByText(/saved/i)).toBeInTheDocument()
  })

  it('shows save error when provided', () => {
    render(
      <CaptionResult
        caption="text"
        tone="serious"
        onRegenerate={() => {}}
        onUse={() => {}}
        onSave={() => {}}
        saveError="Failed to save"
      />
    )
    expect(screen.getByText('Failed to save')).toBeInTheDocument()
  })
})
