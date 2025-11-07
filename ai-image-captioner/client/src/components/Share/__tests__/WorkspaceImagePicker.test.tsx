import React, { useState } from 'react'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { vi } from 'vitest'
import WorkspaceImagePicker from '../WorkspaceImagePicker'

const imgA = { id: 'a', caption: 'Short caption', imageUrl: 'http://img/a.jpg' }
const imgB = { id: 'b', caption: 'This is a medium length caption that should be a bit longer', imageUrl: 'http://img/b.jpg' }
const imgC = { id: 'c', caption: 'L'.repeat(90), imageUrl: 'http://img/c.jpg' }

function ControlledHarness(props: Partial<React.ComponentProps<typeof WorkspaceImagePicker>>) {
  const [value, setValue] = useState<string | null>(props.value ?? null)
  return (
    <WorkspaceImagePicker
      value={value}
      onChange={setValue}
      images={props.images as any}
      loading={props.loading ?? false}
      error={props.error ?? null}
      onReload={props.onReload ?? vi.fn()}
      page={props.page ?? 1}
      hasNext={props.hasNext ?? false}
      onPrev={props.onPrev ?? vi.fn()}
      onNext={props.onNext ?? vi.fn()}
      panelHeight={props.panelHeight ?? 480}
    />
  )
}

it('renders header, aria label, and height', () => {
  const { container } = render(
    <WorkspaceImagePicker
      value={null}
      onChange={vi.fn()}
      images={[]}
      loading={false}
      error={null}
      onReload={vi.fn()}
      page={1}
      hasNext={false}
      onPrev={vi.fn()}
      onNext={vi.fn()}
      panelHeight={360}
    />
  )
  const section = screen.getByTestId('workspace-image-picker')
  expect(section).toHaveAttribute('aria-label', 'Workspace images picker')
  expect(container.querySelector('[data-testid="workspace-image-picker"]')).toHaveStyle({ height: '360px' })
  expect(screen.getByText('Workspace Images')).toBeInTheDocument()
})

it('shows spinner when loading', () => {
  const { container } = render(
    <WorkspaceImagePicker
      value={null}
      onChange={vi.fn()}
      images={[]}
      loading
      error={null}
      onReload={vi.fn()}
      page={1}
      hasNext={false}
      onPrev={vi.fn()}
      onNext={vi.fn()}
    />
  )
  expect(screen.getByTestId('workspace-image-picker')).toBeInTheDocument()
  expect(container.querySelector('svg.animate-spin')).toBeInTheDocument()
})

it('shows error message', () => {
  render(
    <WorkspaceImagePicker
      value={null}
      onChange={vi.fn()}
      images={[]}
      loading={false}
      error="Failed to load"
      onReload={vi.fn()}
      page={1}
      hasNext={false}
      onPrev={vi.fn()}
      onNext={vi.fn()}
    />
  )
  expect(screen.getByText('Failed to load')).toBeInTheDocument()
})

it('shows empty state when no images', () => {
  render(
    <WorkspaceImagePicker
      value={null}
      onChange={vi.fn()}
      images={[]}
      loading={false}
      error={null}
      onReload={vi.fn()}
      page={1}
      hasNext={false}
      onPrev={vi.fn()}
      onNext={vi.fn()}
    />
  )
  expect(screen.getByText(/No images in your workspace yet/i)).toBeInTheDocument()
})

it('calls onReload when clicking reload', async () => {
  const user = userEvent.setup()
  const onReload = vi.fn()
  render(
    <WorkspaceImagePicker
      value={null}
      onChange={vi.fn()}
      images={[]}
      loading={false}
      error={null}
      onReload={onReload}
      page={1}
      hasNext={false}
      onPrev={vi.fn()}
      onNext={vi.fn()}
    />
  )
  await user.click(screen.getByRole('button', { name: /reload/i }))
  expect(onReload).toHaveBeenCalled()
})

it('renders images and toggles selection with controlled parent', async () => {
  const user = userEvent.setup()
  render(<ControlledHarness images={[imgA, imgB] as any} />)
  const first = screen.getByRole('button', { name: imgA.caption })
  expect(first).toHaveAttribute('aria-pressed', 'false')
  await user.click(first)
  expect(first).toHaveAttribute('aria-pressed', 'true')
  await user.click(first)
  expect(first).toHaveAttribute('aria-pressed', 'false')
})

it('applies caption size classes based on length', () => {
  render(<ControlledHarness images={[imgA, imgB, imgC] as any} />)
  const shortBtn = screen.getByRole('button', { name: imgA.caption })
  const shortOverlay = shortBtn.querySelector('span')
  expect(shortOverlay?.className).toMatch(/text-sm|text-\[13px\]|text-xs|text-\[10px]/)
  const mediumBtn = screen.getByRole('button', { name: imgB.caption })
  const mediumOverlay = mediumBtn.querySelector('span') as HTMLElement
  expect(mediumOverlay.className).toMatch(/text-xs|text-\[13px]/)
  const longBtn = screen.getByRole('button', { name: imgC.caption })
  const longOverlay = longBtn.querySelector('span') as HTMLElement
  expect(longOverlay.className).toMatch(/text-\[10px]/)
})

it('forwards pagination props and handles prev/next clicks', async () => {
  const user = userEvent.setup()
  const onPrev = vi.fn()
  const onNext = vi.fn()
  render(
    <WorkspaceImagePicker
      value={null}
      onChange={vi.fn()}
      images={[imgA] as any}
      loading={false}
      error={null}
      onReload={vi.fn()}
      page={2}
      hasNext
      onPrev={onPrev}
      onNext={onNext}
    />
  )
  const nav = screen.getByRole('navigation', { name: /pagination/i })
  expect(nav).toBeInTheDocument()
  expect(screen.getByText(/Page\s*2/i)).toBeInTheDocument()
  await user.click(screen.getByRole('button', { name: /previous page/i }))
  await user.click(screen.getByRole('button', { name: /next page/i }))
  expect(onPrev).toHaveBeenCalled()
  expect(onNext).toHaveBeenCalled()
})

it('invokes onChange with id on repeated clicks when parent is not controlling the value', async () => {
  const user = userEvent.setup()
  const onChange = vi.fn()
  render(
    <WorkspaceImagePicker
      value={null}
      onChange={onChange}
      images={[imgA, imgB] as any}
      loading={false}
      error={null}
      onReload={vi.fn()}
      page={1}
      hasNext={false}
      onPrev={vi.fn()}
      onNext={vi.fn()}
    />
  )
  const aBtn = screen.getByRole('button', { name: imgA.caption })
  await user.click(aBtn)
  expect(onChange).toHaveBeenLastCalledWith('a')
  await user.click(aBtn)
  expect(onChange).toHaveBeenLastCalledWith('a')
})
