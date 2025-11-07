import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import UploadErrorModal from '../UploadErrorModal.tsx'

vi.mock('../Modal', () => ({
default: ({ open, title, confirmText, onConfirm, children }: any) =>
open ? ( <div data-testid="mock-modal"> <h1 data-testid="modal-title">{title}</h1> <div data-testid="modal-body">{children}</div> <button onClick={onConfirm} data-testid="confirm-btn">
{confirmText} </button> </div>
) : null,
}))

describe('UploadErrorModal', () => {
it('renders message and tips when open', () => {
render(<UploadErrorModal open message="Upload failed" onClose={() => {}} />)
expect(screen.getByTestId('mock-modal')).toBeInTheDocument()
expect(screen.getByTestId('modal-title')).toHaveTextContent('Upload Error')
expect(screen.getByTestId('upload-error-message')).toHaveTextContent('Upload failed')
expect(screen.getByText(/Supported formats/i)).toBeInTheDocument()
expect(screen.getByText(/Try a smaller image/i)).toBeInTheDocument()
})

it('renders fallback message when message is null', () => {
render(<UploadErrorModal open message={null} onClose={() => {}} />)
expect(screen.getByTestId('upload-error-message')).toHaveTextContent(
/Something went wrong with your upload/i
)
})

it('does not render when open=false', () => {
const { queryByTestId } = render(<UploadErrorModal open={false} message="err" onClose={() => {}} />)
expect(queryByTestId('mock-modal')).toBeNull()
})

it('calls onClose when confirm button is clicked', () => {
const onClose = vi.fn()
render(<UploadErrorModal open message="msg" onClose={onClose} />)
fireEvent.click(screen.getByTestId('confirm-btn'))
expect(onClose).toHaveBeenCalled()
})
})
