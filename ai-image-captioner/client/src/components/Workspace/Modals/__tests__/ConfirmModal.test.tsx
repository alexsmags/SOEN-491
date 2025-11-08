import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { ConfirmModal } from '../ConfirmModal'

describe('ConfirmModal', () => {
it('does not render when open=false', () => {
const { container } = render(<ConfirmModal open={false} onCancel={() => {}} onConfirm={() => {}} />)
expect(container.firstChild).toBeNull()
})

it('renders title and message and buttons', () => {
render(
<ConfirmModal
open
title="T"
message="M"
confirmText="Yes"
cancelText="No"
onCancel={() => {}}
onConfirm={() => {}}
tone="default"
/>
)
expect(screen.getByTestId('confirm-modal')).toBeInTheDocument()
expect(screen.getByTestId('confirm-modal-title')).toHaveTextContent('T')
expect(screen.getByTestId('confirm-modal-message')).toHaveTextContent('M')
expect(screen.getByTestId('confirm-modal-cancel')).toHaveTextContent('No')
expect(screen.getByTestId('confirm-modal-confirm')).toHaveTextContent('Yes')
})

it('calls onCancel on cancel button click', () => {
const onCancel = vi.fn()
render(<ConfirmModal open onCancel={onCancel} onConfirm={() => {}} />)
fireEvent.click(screen.getByTestId('confirm-modal-cancel'))
expect(onCancel).toHaveBeenCalled()
})

it('calls onConfirm on confirm button click', () => {
const onConfirm = vi.fn()
render(<ConfirmModal open onCancel={() => {}} onConfirm={onConfirm} />)
fireEvent.click(screen.getByTestId('confirm-modal-confirm'))
expect(onConfirm).toHaveBeenCalled()
})

it('backdrop click triggers onCancel and inside click does not', () => {
const onCancel = vi.fn()
const { rerender } = render(<ConfirmModal open onCancel={onCancel} onConfirm={() => {}} />)
fireEvent.mouseDown(screen.getByTestId('confirm-modal'))
expect(onCancel).toHaveBeenCalled()
onCancel.mockClear()
rerender(<ConfirmModal open onCancel={onCancel} onConfirm={() => {}} />)
fireEvent.mouseDown(screen.getByTestId('confirm-modal-dialog'))
expect(onCancel).not.toHaveBeenCalled()
})

it('Escape triggers onCancel when open', () => {
const onCancel = vi.fn()
render(<ConfirmModal open onCancel={onCancel} onConfirm={() => {}} />)
fireEvent.keyDown(window, { key: 'Escape' })
expect(onCancel).toHaveBeenCalled()
})

it('Enter confirms when focus is inside dialog', () => {
const onConfirm = vi.fn()
render(<ConfirmModal open onCancel={() => {}} onConfirm={onConfirm} />)
const confirmBtn = screen.getByTestId('confirm-modal-confirm')
confirmBtn.focus()
fireEvent.keyDown(window, { key: 'Enter' })
expect(onConfirm).toHaveBeenCalled()
})

it('applies danger tone classes', () => {
render(<ConfirmModal open onCancel={() => {}} onConfirm={() => {}} tone="danger" />)
expect(screen.getByTestId('confirm-modal-confirm').className).toMatch(/bg-red-500/)
})

it('applies default tone classes', () => {
render(<ConfirmModal open onCancel={() => {}} onConfirm={() => {}} tone="default" />)
expect(screen.getByTestId('confirm-modal-confirm').className).toContain('bg-white/90')
})
})
