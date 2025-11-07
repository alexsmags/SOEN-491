import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import CaptionOutput from '../CaptionOutput'

describe('CaptionOutput', () => {
  it('renders nothing when caption is null', () => {
    const { container } = render(<CaptionOutput caption={null} />)
    expect(container.firstChild).toBeNull()
  })

  it('renders caption when provided', () => {
    render(<CaptionOutput caption="A great picture of the sunset" />)
    expect(screen.getByText('Generated Caption')).toBeInTheDocument()
    expect(screen.getByText('A great picture of the sunset')).toBeInTheDocument()
  })
})
