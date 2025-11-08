import { describe, it, expect, vi } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import Pagination from '../Pagination'

const getNav = () => screen.getByRole('navigation', { name: /pagination/i })

describe('Pagination', () => {
  it('renders current page and basic a11y roles', () => {
    render(
      <Pagination
        page={2}
        hasNext
        onPrev={vi.fn()}
        onNext={vi.fn()}
      />
    )

    const nav = getNav()
    expect(nav).toBeInTheDocument()

    expect(within(nav).getByText(/^\s*Page\s*2\s*$/)).toBeInTheDocument()

    expect(screen.getByRole('button', { name: /previous page/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /next page/i })).toBeInTheDocument()
  })

  it('disables prev on first page and enables next when hasNext=true', () => {
    render(
      <Pagination
        page={1}
        hasNext
        onPrev={vi.fn()}
        onNext={vi.fn()}
      />
    )
    expect(screen.getByRole('button', { name: /previous page/i })).toBeDisabled()
    expect(screen.getByRole('button', { name: /next page/i })).not.toBeDisabled()
  })

  it('disables next when hasNext=false', () => {
    render(
      <Pagination
        page={3}
        hasNext={false}
        onPrev={vi.fn()}
        onNext={vi.fn()}
      />
    )
    expect(screen.getByRole('button', { name: /previous page/i })).not.toBeDisabled()
    expect(screen.getByRole('button', { name: /next page/i })).toBeDisabled()
  })

  it('disables both buttons when loading', () => {
    render(
      <Pagination
        page={5}
        hasNext
        loading
        onPrev={vi.fn()}
        onNext={vi.fn()}
      />
    )
    expect(screen.getByRole('button', { name: /previous page/i })).toBeDisabled()
    expect(screen.getByRole('button', { name: /next page/i })).toBeDisabled()
  })

  it('fires onPrev and onNext when clicked', async () => {
    const user = userEvent.setup()
    const onPrev = vi.fn()
    const onNext = vi.fn()

    render(
      <Pagination
        page={2}
        hasNext
        onPrev={onPrev}
        onNext={onNext}
      />
    )

    await user.click(screen.getByRole('button', { name: /previous page/i }))
    await user.click(screen.getByRole('button', { name: /next page/i }))

    expect(onPrev).toHaveBeenCalledTimes(1)
    expect(onNext).toHaveBeenCalledTimes(1)
  })

  it('merges custom className into nav element', () => {
    render(
      <Pagination
        page={2}
        hasNext
        onPrev={vi.fn()}
        onNext={vi.fn()}
        className="mt-0"
      />
    )
    expect(getNav()).toHaveClass('mt-0')
  })
})
