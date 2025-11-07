import { render, screen, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { DownloadModal } from '../DownloadModal'

beforeEach(() => {
  vi.clearAllMocks()
})

function renderModal(overrides: Partial<React.ComponentProps<typeof DownloadModal>> = {}) {
  const onConfirm = vi.fn()
  const onCancel = vi.fn()
  render(
    <DownloadModal
      open
      defaultName="cat_with_caption"
      defaultFormat="png"
      onCancel={onCancel}
      onConfirm={onConfirm}
      {...overrides}
    />
  )
  return { onConfirm, onCancel }
}

it('renders fields and default values', () => {
  renderModal()
  expect(screen.getByTestId('download-modal')).toBeInTheDocument()
  expect(screen.getByTestId('download-name-input')).toHaveValue('cat_with_caption')
  expect(screen.getByTestId('download-format-select')).toHaveValue('png')
  expect(screen.queryByTestId('download-quality-range')).not.toBeInTheDocument()
})

it('shows quality and bg color controls for lossy formats', async () => {
  const user = userEvent.setup()
  renderModal()
  await user.selectOptions(screen.getByTestId('download-format-select'), 'jpg')
  expect(screen.getByTestId('download-quality-range')).toBeInTheDocument()
  fireEvent.input(screen.getByTestId('download-quality-range'), { target: { value: '0.8' } })
  expect(screen.getByTestId('download-quality-value')).toHaveTextContent('80%')
  const bgInput = screen.getByTestId('download-bgcolor-input') as HTMLInputElement
  await user.clear(bgInput)
  await user.type(bgInput, '#ff00ff')
  expect(bgInput).toHaveValue('#ff00ff')
})

it('confirms with default png values', async () => {
  const user = userEvent.setup()
  const { onConfirm } = renderModal()
  await user.click(screen.getByTestId('download-confirm-btn'))
  expect(onConfirm).toHaveBeenCalledWith({
    fileName: 'cat_with_caption.png',
    format: 'png',
    quality: undefined,
    flattenBgColor: undefined,
  })
})
