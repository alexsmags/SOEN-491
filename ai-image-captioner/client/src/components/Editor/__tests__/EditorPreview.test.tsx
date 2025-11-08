import { createRef } from 'react'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

const downloadWithCaption = vi.fn()
const suggestFileName = vi.fn().mockReturnValue('cat.jpg')

vi.mock('../../../hooks/useDownloadWithCaption', () => ({
  useDownloadWithCaption: vi.fn(() => ({
    downloadWithCaption,
    suggestFileName,
  })),
}))

vi.mock('../Modals/DownloadModal', () => ({
  DownloadModal: ({ open, onConfirm, defaultName, defaultFormat }: any) =>
    open ? (
      <div data-testid="download-modal">
        <div data-testid="download-modal-defaults">{defaultName}:{defaultFormat}</div>
        <button onClick={() => onConfirm({ fileName: defaultName, format: defaultFormat })} data-testid="download-confirm">confirm</button>
        <button data-testid="download-cancel">cancel</button>
      </div>
    ) : null,
}))

import EditorPreview from '../EditorPreview'

beforeAll(() => {
  Object.defineProperty(window.HTMLCanvasElement.prototype, 'getContext', {
    value: vi.fn(),
  })
})

beforeEach(() => {
  vi.clearAllMocks()
})

function renderPreview(overrides: Partial<React.ComponentProps<typeof EditorPreview>> = {}) {
  const frameRef = createRef<HTMLDivElement>()
  const bubbleRef = createRef<HTMLDivElement>()
  return render(
    <EditorPreview
      image={overrides.image ?? 'https://example.com/cat.jpg'}
      caption={overrides.caption ?? 'Hello world'}
      bubbleStyle={overrides.bubbleStyle ?? { top: 10, left: 10 }}
      frameRef={overrides.frameRef ?? frameRef}
      bubbleRef={overrides.bubbleRef ?? bubbleRef}
      bubbleProps={overrides.bubbleProps}
      showBg={overrides.showBg ?? true}
      aspectFromNat={overrides.aspectFromNat}
    />
  )
}

it('renders image, frame, and caption bubble', () => {
  renderPreview()
  expect(screen.getByTestId('editor-preview')).toBeInTheDocument()
  expect(screen.getByTestId('editor-frame')).toBeInTheDocument()
  expect(screen.getByTestId('editor-image')).toHaveAttribute('src', 'https://example.com/cat.jpg')
  expect(screen.getByTestId('editor-bubble')).toHaveTextContent('Hello world')
})

it('applies aspect ratio when provided', () => {
  renderPreview({ aspectFromNat: '1 / 1' })
  expect(screen.getByTestId('editor-frame')).toHaveStyle({ aspectRatio: '1 / 1' })
})

it('opens download modal and confirms download with defaults', async () => {
  const user = userEvent.setup()
  renderPreview()
  await user.click(screen.getByTestId('editor-download-btn'))
  await screen.findByTestId('download-modal')
  expect(screen.getByTestId('download-modal-defaults')).toHaveTextContent('cat_with_caption:png')
  await user.click(screen.getByTestId('download-confirm'))
  expect(downloadWithCaption).toHaveBeenCalledWith({
    filename: 'cat_with_caption',
    format: 'png',
    quality: undefined,
    flattenBgColor: undefined,
  })
})
