import { render, screen, cleanup } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { vi } from 'vitest'
import { ShareDock } from '../ShareDock'

function IconStub() {
  return <span data-testid="icon-stub">★</span>
}

const targets = [
  { id: 'x', label: 'X', Icon: IconStub },
  { id: 'facebook', label: 'Facebook', Icon: IconStub },
  { id: 'instagram', label: 'Instagram', Icon: IconStub },
]

Object.defineProperty(HTMLElement.prototype, 'scrollBy', {
  value: vi.fn(),
  configurable: true,
  writable: true,
})

function setup(open = true) {
  const onClose = vi.fn()
  const onShare = vi.fn()
  const utils = render(<ShareDock open={open} onClose={onClose} targets={targets as any} onShare={onShare} />)
  const backdrop = document.querySelector('[aria-hidden]') as HTMLElement
  const dialogs = screen.getAllByRole('dialog', { name: /share options/i })
  const dialog = dialogs[dialogs.length - 1]
  return { onClose, onShare, backdrop, dialog, ...utils }
}

it('renders hidden backdrop and translated dock when closed', () => {
  const { backdrop, dialog } = setup(false)
  expect(backdrop).toHaveAttribute('aria-hidden', 'true')
  expect(dialog.className).toMatch(/translate-y-full/)
})

it('renders visible backdrop and dock when open', () => {
  const { backdrop, dialog } = setup(true)
  expect(backdrop).toHaveAttribute('aria-hidden', 'false')
  expect(dialog.className).toMatch(/translate-y-0/)
})

it('closes when clicking backdrop and close button', async () => {
  const user = userEvent.setup()
  const { onClose, backdrop } = setup(true)
  await user.click(backdrop)
  expect(onClose).toHaveBeenCalled()
  const closeBtn = screen.getByRole('button', { name: /close share/i })
  await user.click(closeBtn)
  expect(onClose).toHaveBeenCalledTimes(2)
})

it('closes on Escape only when open', async () => {
  const user = userEvent.setup()
  const openRender = setup(true)
  await user.keyboard('{Escape}')
  expect(openRender.onClose).toHaveBeenCalled()
  openRender.unmount()
  cleanup()
  const closedRender = setup(false)
  await user.keyboard('{Escape}')
  expect(closedRender.onClose).not.toHaveBeenCalled()
})

it('scroll buttons call scrollBy', async () => {
  const user = userEvent.setup()
  setup(true)
  const leftBtn = screen.getByRole('button', { name: /scroll left/i })
  const rightBtn = screen.getByRole('button', { name: /scroll right/i })
  ;(HTMLElement.prototype.scrollBy as any).mockClear()
  await user.click(leftBtn)
  await user.click(rightBtn)
  expect(HTMLElement.prototype.scrollBy).toHaveBeenCalled()
})

it('invokes onShare with target id', async () => {
  const user = userEvent.setup()
  const { onShare } = setup(true)
  const fbBtn = screen.getByRole('button', { name: /share to facebook/i })
  await user.click(fbBtn)
  expect(onShare).toHaveBeenCalledWith('facebook')
})
