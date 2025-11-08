import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import MediaCard from '../MediaCard'

vi.mock('../Modals/ConfirmModal', () => ({
ConfirmModal: ({ open, onConfirm, onCancel, title }: any) =>
open ? ( <div data-testid="confirm-modal"> <span>{title}</span> <button data-testid="confirm-yes" onClick={onConfirm}>yes</button> <button data-testid="confirm-no" onClick={onCancel}>no</button> </div>
) : null,
}))

vi.mock('../../Share/Modals/ShareModal', () => ({
ShareModal: ({ open, onShareSystem }: any) =>
open ? ( <div data-testid="share-modal"> <button data-testid="share-system" onClick={onShareSystem}>system</button> </div>
) : null,
}))

vi.mock('../../services/media', () => ({
fetchMediaFileAsFile: vi.fn(async () => new File([new Blob(['x'], { type: 'image/png' })], 'orig.png', { type: 'image/png' })),
fetchMediaMeta: vi.fn(async () => ({
caption: 'Meta caption',
keywords: ['tag1', 'tag2'],
fontFamily: 'Inter',
fontSize: 24,
textColor: '#fff',
align: 'center',
showBg: true,
bgColor: '#000',
bgOpacity: 0.5,
posX: 10,
posY: 20,
mime: 'image/png',
})),
}))

vi.mock('../../lib/captionCompose', () => ({
composeCaptionedPNG: vi.fn(async () => new Blob(['z'], { type: 'image/png' })),
}))

const makeItem = (overrides: Record<string, any> = {}) =>
({
id: '1',
src: '/img.png',
caption: 'My caption',
createdAt: '2024-01-02T03:04:05.000Z',
fontFamily: 'Inter',
fontSize: 20,
textColor: '#fff',
align: 'left' as any,
showBg: false,
bgColor: '#000',
bgOpacity: 0.5,
posX: 0,
posY: 0,
...overrides,
} as any)

const mockFetchOk = () => {
const fn = vi.fn(async () => ({ ok: true } as Response))
;(global as any).fetch = fn
return fn
}

const mockFetchNotOk = () => {
const fn = vi.fn(async () => ({ ok: false } as Response))
;(global as any).fetch = fn
return fn
}

beforeEach(() => {
mockFetchOk()
vi.spyOn(window, 'alert').mockImplementation(() => {})
if (typeof (global as any).File === 'undefined') {
class FilePoly extends Blob {
name: string
lastModified: number
constructor(chunks: any[], name: string, opts: any = {}) {
super(chunks, opts)
this.name = name
this.lastModified = Date.now()
}
}
;(global as any).File = FilePoly as any
}
})

afterEach(() => {
vi.clearAllMocks()
})

describe('MediaCard', () => {
it('renders caption and created time', () => {
render(<MediaCard item={makeItem()} shareTargets={[]} />)
expect(screen.getByTestId('workspace-caption-visible')).toHaveTextContent('My caption')
expect(screen.getByTestId('workspace-created-at')).toBeInTheDocument()
expect(screen.getByTestId('workspace-card-image')).toHaveAttribute('src', '/img.png')
})

it('clicking image button triggers onEdit when clickable', () => {
const onEdit = vi.fn()
render(<MediaCard item={makeItem()} shareTargets={[]} onEdit={onEdit} imageClickable />)
fireEvent.click(screen.getByTestId('workspace-card-image-button'))
expect(onEdit).toHaveBeenCalled()
})

it('opens menu and deletes via confirm modal', async () => {
const onMore = vi.fn()
render(<MediaCard item={makeItem()} shareTargets={[]} onMore={onMore} />)
fireEvent.click(screen.getByTestId('workspace-card-more'))
await waitFor(() => expect(screen.getByTestId('workspace-card-menu')).toBeInTheDocument())
fireEvent.click(screen.getByTestId('workspace-card-delete'))
expect(screen.getByTestId('confirm-modal')).toBeInTheDocument()
fireEvent.click(screen.getByTestId('confirm-yes'))
await waitFor(() => expect(onMore).toHaveBeenCalled())
})

it('auto-calls onMore when HEAD request returns not ok', async () => {
mockFetchNotOk()
const onMore = vi.fn()
render(<MediaCard item={makeItem({ id: '2', src: '/missing.png' })} shareTargets={[]} onMore={onMore} />)
await waitFor(() => expect(onMore).toHaveBeenCalled())
})

it('auto-calls onMore on image error', async () => {
const onMore = vi.fn()
render(<MediaCard item={makeItem({ id: '3' })} shareTargets={[]} onMore={onMore} />)
const img = screen.getByTestId('workspace-card-image')
fireEvent.error(img)
await waitFor(() => expect(onMore).toHaveBeenCalled())
})

it('respects disabled state', () => {
const onEdit = vi.fn()
render(<MediaCard item={makeItem()} shareTargets={[]} onEdit={onEdit} disabled />)
expect(screen.queryByTestId('workspace-card-edit')).toBeNull()
expect(screen.queryByTestId('workspace-card-more')).toBeNull()
fireEvent.click(screen.getByTestId('workspace-card-image-button'))
expect(onEdit).not.toHaveBeenCalled()
})
})
