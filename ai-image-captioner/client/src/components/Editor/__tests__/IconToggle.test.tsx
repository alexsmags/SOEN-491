import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { AlignLeft } from 'lucide-react'
import IconToggle from '../IconToggle'

it('renders inactive state and toggles on click', async () => {
  const user = userEvent.setup()
  const onClick = vi.fn()
  render(<IconToggle Icon={AlignLeft} onClick={onClick} title="Align Left" />)
  const btn = screen.getByTestId('icon-toggle')
  expect(btn).toHaveClass('bg-black/30')
  await user.click(btn)
  expect(onClick).toHaveBeenCalledTimes(1)
})

it('renders active state correctly', () => {
  render(<IconToggle Icon={AlignLeft} onClick={() => {}} title="Center" active />)
  const btn = screen.getByTestId('icon-toggle')
  expect(btn).toHaveClass('bg-white/10')
})

it('sets title and aria label', () => {
  render(<IconToggle Icon={AlignLeft} onClick={() => {}} title="Right" />)
  expect(screen.getByRole('button', { name: 'Right' })).toBeInTheDocument()
})
