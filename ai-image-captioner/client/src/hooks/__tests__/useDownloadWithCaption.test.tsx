import { useRef } from 'react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { useDownloadWithCaption } from '../useDownloadWithCaption'

function Harness() {
const frameRef = useRef<HTMLDivElement | null>(null)
const bubbleRef = useRef<HTMLDivElement | null>(null)
const { downloadWithCaption, suggestFileName } = useDownloadWithCaption({
image: '/photo.png',
caption: 'hello world',
frameRef,
bubbleRef,
showBg: true,
})
;(globalThis as any).__dl = downloadWithCaption
;(globalThis as any).__suggest = suggestFileName
return ( <div>
<div ref={frameRef} data-testid="frame" style={{ width: 400, height: 300 }} />
<div
ref={bubbleRef}
data-testid="bubble"
style={{
position: 'absolute',
left: 10,
top: 10,
width: 200,
height: 60,
padding: '8px 12px',
borderRadius: 8,
color: '#fff',
backgroundColor: 'rgba(0,0,0,0.6)',
opacity: 1,
font: 'normal 400 16px/20px Inter',
textAlign: 'left',
}}
/>
<button onClick={() => (globalThis as any).__dl()} data-testid="go">go</button> </div>
)
}

const origGetComputedStyle = window.getComputedStyle
const savedCreateElement = document.createElement
let anchorClick: ReturnType<typeof vi.fn>
let toDataURL: ReturnType<typeof vi.fn>
let drawImage: ReturnType<typeof vi.fn>
let fillText: ReturnType<typeof vi.fn>
let measureText: ReturnType<typeof vi.fn>

beforeEach(() => {
vi.useFakeTimers()
toDataURL = vi.fn(() => 'data:image/png;base64,x')
drawImage = vi.fn()
fillText = vi.fn()
measureText = vi.fn(() => ({ width: 50 } as TextMetrics))
vi.spyOn(document, 'createElement').mockImplementation((tag: any) => {
if (tag === 'canvas') {
const c = savedCreateElement.call(document, 'canvas') as HTMLCanvasElement
;(c as any).getContext = vi.fn(() => ({
save: vi.fn(),
restore: vi.fn(),
beginPath: vi.fn(),
moveTo: vi.fn(),
arcTo: vi.fn(),
closePath: vi.fn(),
clearRect: vi.fn(),
fillRect: vi.fn(),
fill: vi.fn(),
drawImage,
fillText,
measureText,
font: '',
textBaseline: 'top',
textAlign: 'left',
globalAlpha: 1,
fillStyle: '',
}))
;(c as any).toDataURL = toDataURL
Object.defineProperty(c, 'width', { value: 400, writable: true })
Object.defineProperty(c, 'height', { value: 300, writable: true })
return c as any
}
if (tag === 'a') {
const a = savedCreateElement.call(document, 'a') as HTMLAnchorElement
anchorClick = vi.fn()
Object.defineProperty(a, 'click', { value: anchorClick })
return a as any
}
return savedCreateElement.call(document, tag)
})
vi.spyOn(window, 'getComputedStyle').mockImplementation((el: any) => origGetComputedStyle(el))
const RealImage = (globalThis as any).Image
class MockImage {
onload: null | (() => void) = null
onerror: null | (() => void) = null
decoding: any
crossOrigin: any
_src = ''
set src(v: string) {
this._src = v
Promise.resolve().then(() => this.onload && this.onload())
}
get src() { return this._src }
get naturalWidth() { return 800 }
get naturalHeight() { return 600 }
constructor() {}
}
;(globalThis as any).__RealImage = RealImage
;(globalThis as any).Image = MockImage
})

afterEach(() => {
vi.restoreAllMocks()
vi.useRealTimers()
if ((globalThis as any).__RealImage) (globalThis as any).Image = (globalThis as any).__RealImage
})

describe('useDownloadWithCaption', () => {
it('suggests a filename from src', () => {
render(<Harness />)
expect((globalThis as any).__suggest('/foo/bar/baz.png')).toBe('baz.png')
})

it('downloads a PNG by default and draws image and text', async () => {
render(<Harness />)
fireEvent.click(screen.getByTestId('go'))
await vi.runAllTimersAsync()
expect(toDataURL).toHaveBeenCalledWith('image/png', undefined)
expect(anchorClick).toHaveBeenCalled()
expect(drawImage).toHaveBeenCalled()
expect(fillText).toHaveBeenCalled()
})

it('uses JPEG mime when format=jpg and flattens background', async () => {
render(<Harness />)
;(globalThis as any).__dl({ format: 'jpg', flattenBgColor: '#fff', quality: 0.8 })
await vi.runAllTimersAsync()
expect(toDataURL).toHaveBeenCalledWith('image/jpeg', 0.8)
})

it('opens image in new tab if load fails', async () => {
const RealImage = (globalThis as any).Image
class FailingImage {
onload: null | (() => void) = null
onerror: null | (() => void) = null
set src(_: string) { Promise.resolve().then(() => this.onerror && this.onerror()) }
get naturalWidth() { return 0 }
get naturalHeight() { return 0 }
}
;(globalThis as any).Image = FailingImage as any
const openSpy = vi.spyOn(window, 'open').mockImplementation(() => null)
render(<Harness />)
fireEvent.click(screen.getByTestId('go'))
await vi.runAllTimersAsync()
expect(openSpy).toHaveBeenCalled()
;(globalThis as any).Image = RealImage
})
})
