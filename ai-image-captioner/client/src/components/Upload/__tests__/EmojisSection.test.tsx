import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import EmojisSection from '../EmojisSection'
import type { Placement } from '../types'

vi.mock('../PlacementSelect', () => ({
  __esModule: true,
  default: ({ label, value, onChange }: { label: string; value: Placement; onChange: (v: Placement) => void }) => (
    <div>
      <label htmlFor="placement">{label}</label>
      <select
        id="placement"
        aria-label={label}
        value={value}
        onChange={(e) => onChange(e.target.value as Placement)}
      >
        <option value="start">start</option>
        <option value="middle">middle</option>
        <option value="end">end</option>
      </select>
    </div>
  ),
}))

describe('EmojisSection', () => {
  let onIncludeEmojisChange: ReturnType<typeof vi.fn>
  let onEmojiCountChange: ReturnType<typeof vi.fn>
  let onPlacementChange: ReturnType<typeof vi.fn>

  beforeEach(() => {
    onIncludeEmojisChange = vi.fn()
    onEmojiCountChange = vi.fn()
    onPlacementChange = vi.fn()
  })

  const setup = (props?: Partial<React.ComponentProps<typeof EmojisSection>>) =>
    render(
      <EmojisSection
        includeEmojis={props?.includeEmojis ?? false}
        onIncludeEmojisChange={onIncludeEmojisChange}
        emojiCount={props?.emojiCount ?? 2}
        onEmojiCountChange={onEmojiCountChange}
        placement={props?.placement ?? ('start' as Placement)}
        onPlacementChange={onPlacementChange}
      />
    )

  it('renders heading and checkbox bound to includeEmojis', () => {
    setup({ includeEmojis: true })
    expect(screen.getByRole('heading', { name: /emojis/i })).toBeInTheDocument()
    const checkbox = screen.getByRole('checkbox')
    expect(checkbox).toBeChecked()
  })

  it('calls onIncludeEmojisChange when toggled', () => {
    setup({ includeEmojis: false })
    const checkbox = screen.getByRole('checkbox')
    fireEvent.click(checkbox)
    expect(onIncludeEmojisChange).toHaveBeenCalledWith(true)
  })

  it('updates emojiCount within bounds and calls onEmojiCountChange', () => {
    setup({ emojiCount: 2 })
    const input = screen.getByRole('spinbutton') as HTMLInputElement
    fireEvent.change(input, { target: { value: '3' } })
    expect(onEmojiCountChange).toHaveBeenLastCalledWith(3)
    fireEvent.change(input, { target: { value: '0' } })
    expect(onEmojiCountChange).toHaveBeenLastCalledWith(1)
    fireEvent.change(input, { target: { value: '99' } })
    expect(onEmojiCountChange).toHaveBeenLastCalledWith(8)
  })

  it('renders and changes placement via PlacementSelect', () => {
    setup({ placement: 'start' as Placement })
    const select = screen.getByRole('combobox', { name: /emojis placement/i })
    fireEvent.change(select, { target: { value: 'end' } })
    expect(onPlacementChange).toHaveBeenCalledWith('end')
  })

  it('shows helper text', () => {
    setup()
    expect(screen.getByText(/chosen by the ai/i)).toBeInTheDocument()
  })
})
