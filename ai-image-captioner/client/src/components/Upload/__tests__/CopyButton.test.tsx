import { render, screen, fireEvent, act } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import CopyButton from '../CopyButton'

describe('CopyButton', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    Object.assign(navigator, {
      clipboard: { writeText: vi.fn().mockResolvedValue(undefined) },
    })
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('renders default label', () => {
    render(<CopyButton text="sample" />)
    expect(screen.getByText('Copy Caption')).toBeInTheDocument()
  })

  it('copies text and shows feedback', async () => {
    const onCopied = vi.fn()
    render(<CopyButton text="hello" onCopied={onCopied} />)
    await act(async () => {
      fireEvent.click(screen.getByText('Copy Caption'))
    })
    expect(navigator.clipboard.writeText).toHaveBeenCalledWith('hello')
    expect(onCopied).toHaveBeenCalled()
    expect(screen.getByText('Copied!')).toBeInTheDocument()
    act(() => {
      vi.advanceTimersByTime(1000)
    })
    expect(screen.getByText('Copy Caption')).toBeInTheDocument()
  })

  it('disables when prop set', async () => {
    render(<CopyButton text="x" disabled />)
    const btn = screen.getByRole('button')
    expect(btn).toBeDisabled()
  })
})
