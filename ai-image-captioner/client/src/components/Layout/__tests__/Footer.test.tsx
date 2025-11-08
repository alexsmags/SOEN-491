import { render, screen } from '@testing-library/react'
import Footer from '../Footer'

describe('Footer', () => {
  it('renders copyright text with current year', () => {
    const year = new Date().getFullYear()
    render(<Footer />)
    expect(screen.getByText(`© ${year} CaptoPic. All rights reserved.`)).toBeInTheDocument()
  })

  it('renders all social media links', () => {
    render(<Footer />)

    const links = screen.getAllByRole('link')
    const hrefs = links.map(link => link.getAttribute('href'))

    expect(hrefs).toContain('https://twitter.com')
    expect(hrefs).toContain('https://github.com')
    expect(hrefs).toContain('https://linkedin.com')
    expect(hrefs).toContain('https://instagram.com')

    links.forEach(link => {
      expect(link).toHaveAttribute('target', '_blank')
      expect(link).toHaveAttribute('rel', 'noopener noreferrer')
    })
  })

  it('has proper layout and structure', () => {
    render(<Footer />)
    const footer = screen.getByRole('contentinfo')
    expect(footer).toBeInTheDocument()
    expect(footer).toHaveClass('bg-[#1e2128]')
    expect(footer).toHaveClass('border-t')
  })
})
