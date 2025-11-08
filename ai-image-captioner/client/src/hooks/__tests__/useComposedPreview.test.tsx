import { useState } from 'react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, act, waitFor } from '@testing-library/react'
import { useComposedPreview, type SelectedForPreview } from '../useComposedPreview'

vi.mock('../../services/media', () => ({
fetchMediaFileAsFile: vi.fn(async () => new File([new Blob(['x'], { type: 'image/png' })], 'in.png', { type: 'image/png' })),
fetchMediaMeta: vi.fn(async () => ({
caption: 'Server caption',
keywords: ['a', 'b'],
mime: 'image/png',
imageUrl: '/img.png',
fontFamily: 'Inter',
fontSize: 24,
textColor: '#fff',
align: 'center',
showBg: true,
bgColor: '#000',
bgOpacity: 0.5,
posX: 10,
posY: 20,
})),
}))

vi.mock('../../lib/captionCompose', () => ({
composeCaptionedPNG: vi.fn(async () => new Blob(['z'], { type: 'image/png' })),
}))

const { fetchMediaMeta } = await import('../../services/media')
const { composeCaptionedPNG } = await import('../../lib/captionCompose')

function Harness({ initial }: { initial: SelectedForPreview }) {
const [sel, setSel] = useState<SelectedForPreview>(initial)
const { url, composing } = useComposedPreview(sel)
;(globalThis as any).__setSel = setSel
return ( <div> <div data-testid="composing">{String(composing)}</div>
<img data-testid="preview" src={url ?? ''} alt="" /> </div>
)
}

beforeEach(() => {
if (!(URL as any).createObjectURL) {
;(URL as any).createObjectURL = vi.fn(() => 'blob:mock')
} else {
vi.spyOn(URL, 'createObjectURL').mockImplementation(() => 'blob:mock')
}
if (!(URL as any).revokeObjectURL) {
;(URL as any).revokeObjectURL = vi.fn()
} else {
vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {})
}
})

afterEach(() => {
vi.clearAllMocks()
})

describe('useComposedPreview', () => {
it('returns null url and not composing when selected is null', () => {
render(<Harness initial={null} />)
expect(screen.getByTestId('composing').textContent).toBe('false')
expect((screen.getByTestId('preview') as HTMLImageElement).src).toBe('')
})

it('composes a preview when selected is provided', async () => {
render(<Harness initial={null} />)
act(() => {
;(globalThis as any).__setSel({
id: '1',
caption: 'Local caption',
fontFamily: 'Inter',
fontSize: 20,
textColor: '#fff',
align: 'left',
showBg: false,
bgColor: '#000',
bgOpacity: 0.5,
posX: 0,
posY: 0,
})
})
expect(screen.getByTestId('composing').textContent).toBe('true')
await waitFor(() => expect(screen.getByTestId('composing').textContent).toBe('false'))
await waitFor(() => expect((screen.getByTestId('preview') as HTMLImageElement).src).toContain('blob:mock'))
expect(fetchMediaMeta).toHaveBeenCalledWith('1')
expect(composeCaptionedPNG).toHaveBeenCalled()
})

it('cancels composition and clears url when selection becomes null', async () => {
render(<Harness initial={{ id: '2', caption: 'x' }} />)
act(() => {
;(globalThis as any).__setSel(null)
})
await waitFor(() => expect(screen.getByTestId('composing').textContent).toBe('false'))
expect((screen.getByTestId('preview') as HTMLImageElement).src).toBe('')
})

it('normalizes invalid align from server to undefined before composing', async () => {
;(fetchMediaMeta as any).mockResolvedValueOnce({
caption: 'C',
align: 'diagonal',
})
render(<Harness initial={null} />)
act(() => {
;(globalThis as any).__setSel({ id: '9', align: 'right' })
})
await waitFor(() => expect(composeCaptionedPNG).toHaveBeenCalled())
const args = (composeCaptionedPNG as any).mock.calls.at(-1)[1]
expect(args.align).toBeUndefined()
})

it('revokes previous blob url when a new one is set and on unmount', async () => {
render(<Harness initial={{ id: '3' }} />)
await waitFor(() => expect((screen.getByTestId('preview') as HTMLImageElement).src).toContain('blob:mock'))
act(() => {
;(globalThis as any).__setSel({ id: '4' })
})
await waitFor(() => expect((URL as any).revokeObjectURL).toHaveBeenCalled())
})
})
