import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import SkeletonGrid from '../SkeletonGrid'

describe('SkeletonGrid', () => {
  it('renders the correct number of SkeletonCard elements', () => {
    const { container } = render(<SkeletonGrid count={4} />)
    expect(container.querySelectorAll('.rounded-2xl').length).toBe(4)
  })

  it('has appropriate role and aria-live attributes', () => {
    render(<SkeletonGrid count={2} />)
    const grid = screen.getByRole('status')
    expect(grid).toHaveAttribute('aria-live', 'polite')
  })

  it('includes a visually hidden loading text', () => {
    render(<SkeletonGrid count={1} />)
    expect(screen.getByText(/loading content/i)).toBeInTheDocument()
  })
})
