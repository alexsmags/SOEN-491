import { render, screen, fireEvent, act } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import UploadDropzone from "../UploadDropzone"

let createObjectURLMock: ReturnType<typeof vi.fn>
let revokeObjectURLMock: ReturnType<typeof vi.fn>

let nextImageSize = { w: 1000, h: 1000 }

class MockImage {
  onload: null | (() => void) = null
  onerror: null | (() => void) = null
  naturalWidth = 0
  naturalHeight = 0
  set src(_: string) {
    setTimeout(() => {
      if (this.onload) {
        this.naturalWidth = nextImageSize.w
        this.naturalHeight = nextImageSize.h
        this.onload()
      }
    }, 0)
  }
}

beforeAll(() => {
  if (!(URL as any).createObjectURL) {
    Object.defineProperty(URL, "createObjectURL", {
      value: vi.fn(() => "blob:mock"),
      writable: true,
    })
  }
  if (!(URL as any).revokeObjectURL) {
    Object.defineProperty(URL, "revokeObjectURL", {
      value: vi.fn(),
      writable: true,
    })
  }

  createObjectURLMock = URL.createObjectURL as any
  revokeObjectURLMock = URL.revokeObjectURL as any

  ;(global as any).Image = MockImage
})

beforeEach(() => {
  vi.clearAllMocks()
  nextImageSize = { w: 1000, h: 1000 }
  createObjectURLMock.mockReturnValue("blob:mock")
})

it("rejects unsupported type via drag-and-drop", async () => {
  const onUpload = vi.fn()
  const onError = vi.fn()
  render(<UploadDropzone onUpload={onUpload} onError={onError} />)

  const dropzone = screen.getByTestId("dropzone")
  const bad = new File([new Uint8Array(1000)], "bad.gif", { type: "image/gif" })

  fireEvent.dragOver(dropzone, { dataTransfer: { files: [bad] } })
  fireEvent.drop(dropzone, { dataTransfer: { files: [bad] } })
  await act(async () => {})

  expect(onUpload).toHaveBeenLastCalledWith(null, null)
  expect(onError).toHaveBeenCalledWith(
    "Unsupported file format. Please upload a JPEG or PNG image."
  )
})

it("rejects files over max size", async () => {
  const onUpload = vi.fn()
  const onError = vi.fn()
  render(<UploadDropzone onUpload={onUpload} onError={onError} />)

  const input = screen.getByTestId("file-input") as HTMLInputElement
  const big = new File([new Uint8Array(11 * 1024 * 1024)], "big.png", { type: "image/png" })
  await userEvent.upload(input, big)

  expect(onUpload).toHaveBeenLastCalledWith(null, null)
  expect(onError).toHaveBeenCalledWith(expect.stringMatching(/too large/i))
})

it("rejects images over max megapixels", async () => {
  const onUpload = vi.fn()
  const onError = vi.fn()
  render(<UploadDropzone onUpload={onUpload} onError={onError} />)

  nextImageSize = { w: 9000, h: 6000 }

  const input = screen.getByTestId("file-input") as HTMLInputElement
  const imgFile = new File([new Uint8Array(1000)], "huge.jpg", { type: "image/jpeg" })
  await userEvent.upload(input, imgFile)
  await act(async () => {})

  expect(revokeObjectURLMock).toHaveBeenCalledWith("blob:mock")
  expect(onUpload).toHaveBeenLastCalledWith(null, null)
  expect(onError).toHaveBeenCalledWith(expect.stringMatching(/resolution is too large/i))
})

it("accepts valid image and shows preview", async () => {
  const onUpload = vi.fn()
  const onError = vi.fn()
  render(<UploadDropzone onUpload={onUpload} onError={onError} />)

  nextImageSize = { w: 2000, h: 1500 }

  const input = screen.getByTestId("file-input") as HTMLInputElement
  const ok = new File([new Uint8Array(1024)], "ok.jpg", { type: "image/jpeg" })
  await userEvent.upload(input, ok)
  await act(async () => {})

  expect(onError).not.toHaveBeenCalled()
  expect(onUpload).toHaveBeenLastCalledWith(ok, "blob:mock")
  expect(screen.getByTestId("preview-image")).toBeInTheDocument()
})
