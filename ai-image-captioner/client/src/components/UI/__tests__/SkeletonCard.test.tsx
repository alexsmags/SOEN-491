import { render } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import SkeletonCard from '../SkeletonCard'

describe('SkeletonCard', () => {
  it('renders container and skeleton elements', () => {
    const { container } = render(<SkeletonCard />)
    const card = container.querySelector('.rounded-2xl')
    expect(card).toBeInTheDocument()
    expect(container.querySelectorAll('.animate-pulse').length).toBeGreaterThanOrEqual(3)
  })

  it('has aspect box and body section', () => {
    const { container } = render(<SkeletonCard />)
    const aspectBox = container.querySelector('.aspect-\\[4\\/5\\]')
    const body = container.querySelector('.p-3.space-y-2')
    expect(aspectBox).toBeInTheDocument()
    expect(body).toBeInTheDocument()
  })
})
