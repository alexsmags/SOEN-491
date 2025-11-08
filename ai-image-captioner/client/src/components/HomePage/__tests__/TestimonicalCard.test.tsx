import { render, screen } from '@testing-library/react'
import TestimonialCard from '../TestimonialCard'

function renderCard(overrides: Partial<React.ComponentProps<typeof TestimonialCard>> = {}) {
  return render(
    <TestimonialCard
      quote="This app is incredible!"
      name="Jane Doe"
      title="Product Designer"
      avatarSrc={overrides.avatarSrc}
      footer={overrides.footer}
      {...overrides}
    />
  )
}

it('renders quote, name, and title', () => {
  renderCard()
  expect(screen.getByText('This app is incredible!')).toBeInTheDocument()
  expect(screen.getByText('Jane Doe')).toBeInTheDocument()
  expect(screen.getByText('Product Designer')).toBeInTheDocument()
})

it('renders avatar image when avatarSrc is provided', () => {
  renderCard({ avatarSrc: 'https://example.com/avatar.jpg' })
  const avatar = screen.getByRole('img', { name: 'Jane Doe' })
  expect(avatar).toHaveAttribute('src', 'https://example.com/avatar.jpg')
})

it('renders initials when no avatarSrc is provided', () => {
  renderCard({ avatarSrc: undefined })
  expect(screen.getByText('JD')).toBeInTheDocument()
})

it('renders optional footer when provided', () => {
  renderCard({ footer: <div data-testid="footer">Footer content</div> })
  expect(screen.getByTestId('footer')).toHaveTextContent('Footer content')
})

it('applies optional className to outer container', () => {
  renderCard({ className: 'shadow-lg' })
  const outer = screen.getByText('This app is incredible!').closest('div') as HTMLElement
  expect(outer).toHaveClass('shadow-lg')
})
