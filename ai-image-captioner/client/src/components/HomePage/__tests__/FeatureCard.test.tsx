import { render, screen } from '@testing-library/react'
import FeatureCard from '../FeatureCard'

function renderCard(overrides: Partial<React.ComponentProps<typeof FeatureCard>> = {}) {
  return render(
    <FeatureCard
      icon={<span data-testid="feat-icon">I</span>}
      title="Awesome Title"
      desc="Clear description"
      {...overrides}
    />
  )
}

it('renders title and description', () => {
  renderCard()
  expect(screen.getByText('Awesome Title')).toBeInTheDocument()
  expect(screen.getByText('Clear description')).toBeInTheDocument()
})

it('renders the icon node', () => {
  renderCard()
  expect(screen.getByTestId('feat-icon')).toBeInTheDocument()
})

it('applies custom className to the outer container', () => {
  renderCard({ className: 'shadow-lg' })
  const outer = screen.getByText('Awesome Title').closest('div') as HTMLElement
  expect(outer).toHaveClass('shadow-lg')
})

it('uses the dark background color style', () => {
  renderCard()
  const outer = screen.getByText('Awesome Title').closest('div') as HTMLElement
  expect(outer).toHaveStyle({ backgroundColor: '#1e2128' })
})
