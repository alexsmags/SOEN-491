import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useState } from 'react'
import { vi } from 'vitest'
import { ImagePicker } from '../ImagePicker'

class MockFileReader {
  result: string | ArrayBuffer | null = null
  onload: ((this: FileReader, ev: ProgressEvent<FileReader>) => any) | null = null
  readAsDataURL(_file: Blob) {
    this.result = 'data:image/png;base64,abc123'
    this.onload?.call(this as unknown as FileReader, {} as ProgressEvent<FileReader>)
  }
}
;(global as any).FileReader = MockFileReader

function ControlledHarness() {
  const [value, setValue] = useState<string | null>(null)
  return <ImagePicker value={value} onChange={setValue} />
}

function setup(value: string | null = null) {
  const onChange = vi.fn()
  const utils = render(<ImagePicker value={value} onChange={onChange} />)
  return { onChange, ...utils }
}

it('renders presets and upload button', () => {
  setup()
  expect(screen.getByRole('button', { name: /upload/i })).toBeInTheDocument()
  const images = screen.getAllByRole('img', { name: 'Gallery' })
  expect(images.length).toBe(4)
})

it('selects and toggles a preset with controlled parent', async () => {
  const user = userEvent.setup()
  render(<ControlledHarness />)
  const images = screen.getAllByRole('img', { name: 'Gallery' })
  const firstButton = images[0].closest('button') as HTMLButtonElement
  await user.click(firstButton)
  await user.click(firstButton)
})

it('uploads a file and prepends to gallery, calls onChange with data URL', async () => {
  const user = userEvent.setup()
  const { onChange, container } = setup()
  const input = container.querySelector('input[type="file"]') as HTMLInputElement
  const file = new File(['x'], 'photo.png', { type: 'image/png' })
  await user.upload(input, file)
  expect(onChange).toHaveBeenLastCalledWith('data:image/png;base64,abc123')
  const images = screen.getAllByRole('img', { name: 'Gallery' })
  expect((images[0] as HTMLImageElement).src).toBe('data:image/png;base64,abc123')
})

it('clicking upload button triggers input click', async () => {
  const user = userEvent.setup()
  const { container } = setup()
  const input = container.querySelector('input[type="file"]') as HTMLInputElement
  const clickSpy = vi.spyOn(input, 'click' as any)
  await user.click(screen.getByRole('button', { name: /upload/i }))
  expect(clickSpy).toHaveBeenCalled()
})
