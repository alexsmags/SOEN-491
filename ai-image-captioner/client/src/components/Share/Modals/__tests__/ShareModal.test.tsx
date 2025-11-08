import { render, screen, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { vi } from 'vitest'
import { ShareModal } from '../ShareModal'

function setup(open: boolean = true) {
  const onClose = vi.fn()
  const onShareSystem = vi.fn()
  render(<ShareModal open={open} onClose={onClose} onShareSystem={onShareSystem} />)
  return { onClose, onShareSystem }
}

it('renders nothing when closed', () => {
  setup(false)
  expect(screen.queryByRole('dialog')).toBeNull()
})

it('renders dialog when open with proper aria', () => {
  setup(true)
  const dialog = screen.getByRole('dialog', { name: /share/i })
  expect(dialog).toBeInTheDocument()
  expect(dialog).toHaveAttribute('aria-modal', 'true')
})

it('closes when clicking backdrop', async () => {
  const user = userEvent.setup()
  const { onClose } = setup(true)
  const backdrop = screen.getByRole('dialog', { name: /share/i })
  await user.click(backdrop)
  expect(onClose).toHaveBeenCalled()
})

it('does not close when clicking inside content', async () => {
  const user = userEvent.setup()
  const { onClose } = setup(true)
  const contentButton = screen.getByRole('button', { name: /share via system/i })
  await user.click(contentButton)
  expect(onClose).not.toHaveBeenCalled()
})

it('close button triggers onClose', async () => {
  const user = userEvent.setup()
  const { onClose } = setup(true)
  const closeBtn = screen.getByRole('button', { name: /close share/i })
  await user.click(closeBtn)
  expect(onClose).toHaveBeenCalled()
})

it('escape closes only when open', () => {
  const { onClose } = setup(true)
  fireEvent.keyDown(window, { key: 'Escape' })
  expect(onClose).toHaveBeenCalled()
})

it('escape does not attach when closed', () => {
  const onClose = vi.fn()
  const onShareSystem = vi.fn()
  render(<ShareModal open={false} onClose={onClose} onShareSystem={onShareSystem} />)
  fireEvent.keyDown(window, { key: 'Escape' })
  expect(onClose).not.toHaveBeenCalled()
})

it('system share button calls onShareSystem', async () => {
  const user = userEvent.setup()
  const { onShareSystem } = setup(true)
  const shareBtn = screen.getByRole('button', { name: /share via system/i })
  await user.click(shareBtn)
  expect(onShareSystem).toHaveBeenCalled()
})
