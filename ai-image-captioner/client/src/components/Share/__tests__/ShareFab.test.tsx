import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { vi } from 'vitest'
import { ShareFab } from '../ShareFab'

function getClassList(el: HTMLElement) {
  return el.className.split(/\s+/)
}

it('renders with correct aria attributes', () => {
  render(<ShareFab visible open={false} onClick={vi.fn()} />)
  const btn = screen.getByRole('button', { name: /share/i })
  expect(btn).toBeInTheDocument()
  expect(btn).toHaveAttribute('title', 'Share')
})

it('applies visibility styles based on visible prop', () => {
  const { rerender } = render(<ShareFab visible={false} open={false} onClick={vi.fn()} />)
  let btn = screen.getByRole('button', { name: /share/i })
  expect(getClassList(btn)).toEqual(expect.arrayContaining(['opacity-0', 'scale-90', 'pointer-events-none']))
  rerender(<ShareFab visible open={false} onClick={vi.fn()} />)
  btn = screen.getByRole('button', { name: /share/i })
  expect(getClassList(btn)).toEqual(expect.arrayContaining(['opacity-100', 'scale-100']))
})

it('positions above dock when open is true', () => {
  const { rerender } = render(<ShareFab visible open={false} onClick={vi.fn()} />)
  let btn = screen.getByRole('button', { name: /share/i })
  expect(getClassList(btn)).toEqual(expect.arrayContaining(['bottom-24']))
  rerender(<ShareFab visible open onClick={vi.fn()} />)
  btn = screen.getByRole('button', { name: /share/i })
  expect(getClassList(btn)).toEqual(expect.arrayContaining(['bottom-[7.75rem]']))
})

it('calls onClick when pressed', async () => {
  const user = userEvent.setup()
  const onClick = vi.fn()
  render(<ShareFab visible open={false} onClick={onClick} />)
  const btn = screen.getByRole('button', { name: /share/i })
  await user.click(btn)
  expect(onClick).toHaveBeenCalled()
})
