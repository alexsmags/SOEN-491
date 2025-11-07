import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { vi } from 'vitest'
import PreviewWithShare from '../PreviewWithShare'

it('shows spinner when loading', () => {
  const onShare = vi.fn()
  render(
    <PreviewWithShare
      imageSrc={null}
      caption=""
      hashtags={[]}
      onShare={onShare}
      isLoading
    />
  )
  expect(screen.getByText(/Preparing captioned preview/i)).toBeInTheDocument()
  expect(screen.queryByRole('button', { name: /share/i })).not.toBeInTheDocument()
  const busy = screen.getByText(/Preparing captioned preview/i).closest('[aria-busy="true"]')
  expect(busy).toBeInTheDocument()
})

it('shows placeholder when no image and not loading', () => {
  const onShare = vi.fn()
  render(
    <PreviewWithShare
      imageSrc={null}
      caption=""
      hashtags={[]}
      onShare={onShare}
    />
  )
  expect(screen.getByText(/Select an image to enable sharing/i)).toBeInTheDocument()
  expect(screen.queryByRole('button', { name: /share/i })).not.toBeInTheDocument()
  const container = screen.getByText(/Select an image/i).closest('[aria-busy]')
  expect(container).toHaveAttribute('aria-busy', 'false')
})

it('renders image, overlay, and triggers share', async () => {
  const user = userEvent.setup()
  const onShare = vi.fn()
  render(
    <PreviewWithShare
      imageSrc="data:image/png;base64,abc"
      caption="Hello world"
      hashtags={['#one', '#two']}
      onShare={onShare}
    />
  )
  const img = screen.getByAltText(/Captioned preview/i) as HTMLImageElement
  expect(img).toBeInTheDocument()
  expect(img.src).toContain('data:image/png;base64,abc')
  expect(screen.getByText('Hello world')).toBeInTheDocument()
  expect(screen.getByText('#one #two')).toBeInTheDocument()
  const btn = screen.getByRole('button', { name: /share/i })
  await user.click(btn)
  expect(onShare).toHaveBeenCalled()
})

it('does not render overlay when no caption and no hashtags', () => {
  const onShare = vi.fn()
  render(
    <PreviewWithShare
      imageSrc="http://example.com/photo.jpg"
      caption=""
      hashtags={[]}
      onShare={onShare}
    />
  )
  expect(screen.getByAltText(/Captioned preview/i)).toBeInTheDocument()
  expect(screen.getByRole('button', { name: /share/i })).toBeInTheDocument()
  expect(screen.queryByText(/#/)).not.toBeInTheDocument()
})

it('applies fixedHeight to preview container', () => {
  const onShare = vi.fn()
  const { container } = render(
    <PreviewWithShare
      imageSrc={null}
      caption=""
      hashtags={[]}
      onShare={onShare}
      fixedHeight={360}
    />
  )
  const sized = container.querySelector('[aria-busy]')
  expect(sized).toHaveStyle({ height: '360px' })
})
