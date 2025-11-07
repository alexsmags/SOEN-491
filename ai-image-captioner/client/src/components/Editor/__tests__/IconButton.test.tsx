import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Square } from 'lucide-react'
import IconButton from '../IconButton'

it('renders and calls onClick', async () => {
  const user = userEvent.setup()
  const onClick = vi.fn()
  render(<IconButton Icon={Square} onClick={onClick} title="Do it" />)
  const btn = screen.getByTestId('icon-button')
  expect(btn).toBeInTheDocument()
  expect(btn).toHaveAttribute('title', 'Do it')
  await user.click(btn)
  expect(onClick).toHaveBeenCalledTimes(1)
})

it('sets accessible name from title', () => {
  render(<IconButton Icon={Square} onClick={() => {}} title="Center" />)
  expect(screen.getByRole('button', { name: 'Center' })).toBeInTheDocument()
})

it('allows overriding data-testid', () => {
  render(<IconButton Icon={Square} onClick={() => {}} title="Alt" data-testid="icon-button-alt" />)
  expect(screen.getByTestId('icon-button-alt')).toBeInTheDocument()
})
