import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import Modal from '../Modal'

describe('Modal', () => {
it('does not render when open=false', () => {
const { container } = render(<Modal open={false} onConfirm={() => {}} />)
expect(container.firstChild).toBeNull()
})

it('renders title, message, children, and confirm text', () => {
render(
<Modal open onConfirm={() => {}} title="T" message="M" confirmText="Go"> <div data-testid="child">C</div> </Modal>
)
expect(screen.getByTestId('modal-title')).toHaveTextContent('T')
expect(screen.getByTestId('modal-body')).toHaveTextContent('M')
expect(screen.getByTestId('child')).toBeInTheDocument()
expect(screen.getByTestId('modal-confirm')).toHaveTextContent('Go')
expect(screen.getByRole('dialog')).toHaveAttribute('aria-modal', 'true')
})

it('calls onConfirm on button click', () => {
const onConfirm = vi.fn()
render(<Modal open onConfirm={onConfirm} />)
fireEvent.click(screen.getByTestId('modal-confirm'))
expect(onConfirm).toHaveBeenCalled()
})

it('calls onConfirm when clicking backdrop', () => {
const onConfirm = vi.fn()
render(<Modal open onConfirm={onConfirm} />)
fireEvent.mouseDown(screen.getByTestId('base-modal'))
expect(onConfirm).toHaveBeenCalled()
})

it('does not close when clicking inside dialog', () => {
const onConfirm = vi.fn()
render(<Modal open onConfirm={onConfirm} />)
fireEvent.mouseDown(screen.getByTestId('modal-title'))
expect(onConfirm).not.toHaveBeenCalled()
})

it('closes on Escape key', () => {
const onConfirm = vi.fn()
render(<Modal open onConfirm={onConfirm} />)
fireEvent.keyDown(window, { key: 'Escape' })
expect(onConfirm).toHaveBeenCalled()
})

it('confirms on Enter when focus is inside modal', () => {
const onConfirm = vi.fn()
render(<Modal open onConfirm={onConfirm} />)
const btn = screen.getByTestId('modal-confirm')
btn.focus()
fireEvent.keyDown(window, { key: 'Enter' })
expect(onConfirm).toHaveBeenCalled()
})

it('applies danger tone styles', () => {
render(<Modal open onConfirm={() => {}} tone="danger" />)
expect(screen.getByTestId('modal-confirm').className).toMatch(/bg-red-500/)
})
})
