import { render, screen, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import UserMenu from '../UserMenu'

const navigateMock = vi.fn()
vi.mock('react-router-dom', async () => {
  return {
    useNavigate: () => navigateMock,
  }
})

function openMenu() {
  const trigger = screen.getByRole('button', { name: /account/i })
  expect(trigger).toHaveAttribute('aria-expanded', 'false')
  fireEvent.click(trigger)
  expect(trigger).toHaveAttribute('aria-expanded', 'true')
  return { trigger }
}

describe('UserMenu (unauthenticated)', () => {
  it('renders trigger button and closed panel by default', () => {
    render(<UserMenu />)
    const trigger = screen.getByRole('button', { name: /account/i })
    expect(trigger).toBeInTheDocument()
    expect(trigger).toHaveClass('w-8', 'h-8')

    const panel = screen.getByRole('menu', { name: /user menu/i })
    expect(panel).toBeInTheDocument()
    expect(panel).toHaveClass('pointer-events-none', 'opacity-0', 'scale-95')
    expect(trigger).toHaveAttribute('aria-expanded', 'false')
  })

  it('opens the menu and shows unauthenticated actions', () => {
    render(<UserMenu />)
    openMenu()

    const panel = screen.getByRole('menu', { name: /user menu/i })
    expect(panel).toHaveClass('opacity-100', 'scale-100')
    expect(screen.getByRole('menuitem', { name: /sign in/i })).toBeInTheDocument()
    expect(screen.getByRole('menuitem', { name: /create account/i })).toBeInTheDocument()
  })

  it('calls onSignIn and navigates to /login', async () => {
    const user = userEvent.setup()
    const onSignIn = vi.fn()

    render(<UserMenu onSignIn={onSignIn} />)
    openMenu()

    await user.click(screen.getByRole('menuitem', { name: /sign in/i }))
    expect(onSignIn).toHaveBeenCalled()
    expect(navigateMock).toHaveBeenCalledWith('/login')

    const trigger = screen.getByRole('button', { name: /account/i })
    expect(trigger).toHaveAttribute('aria-expanded', 'false')
  })

  it('calls onSignUp and navigates to /signup', async () => {
    const user = userEvent.setup()
    const onSignUp = vi.fn()

    render(<UserMenu onSignUp={onSignUp} />)
    openMenu()

    await user.click(screen.getByRole('menuitem', { name: /create account/i }))
    expect(onSignUp).toHaveBeenCalled()
    expect(navigateMock).toHaveBeenCalledWith('/signup')
  })

  it('closes when clicking outside and with Escape', async () => {
    const user = userEvent.setup()
    render(
      <div>
        <UserMenu />
        <div data-testid="outside">outside</div>
      </div>
    )
    const { trigger } = openMenu()

    await user.click(screen.getByTestId('outside'))
    expect(trigger).toHaveAttribute('aria-expanded', 'false')

    fireEvent.click(trigger)
    expect(trigger).toHaveAttribute('aria-expanded', 'true')
    fireEvent.keyDown(document, { key: 'Escape' })
    expect(trigger).toHaveAttribute('aria-expanded', 'false')
  })

  it('menu items have correct roles', () => {
    render(<UserMenu />)
    openMenu()
    const items = screen.getAllByRole('menuitem')
    expect(items.length).toBeGreaterThanOrEqual(2)
  })
})

describe('UserMenu (authenticated)', () => {
  it('shows email and authenticated actions', () => {
    render(<UserMenu isAuthenticated email="jane@example.com" />)
    openMenu()

    expect(screen.getByText('jane@example.com')).toBeInTheDocument()
    expect(screen.getByRole('menuitem', { name: /profile/i })).toBeInTheDocument()
    expect(screen.getByRole('menuitem', { name: /account settings/i })).toBeInTheDocument()
    expect(screen.getByRole('menuitem', { name: /log out/i })).toBeInTheDocument()
  })

  it('invokes action callbacks and closes after click', async () => {
    const user = userEvent.setup()
    const onProfile = vi.fn()
    const onSettings = vi.fn()
    const onSignOut = vi.fn()

    render(
      <UserMenu
        isAuthenticated
        email="user@site.com"
        onProfile={onProfile}
        onSettings={onSettings}
        onSignOut={onSignOut}
      />
    )
    const { trigger } = openMenu()

    await user.click(screen.getByRole('menuitem', { name: /profile/i }))
    expect(onProfile).toHaveBeenCalled()
    expect(trigger).toHaveAttribute('aria-expanded', 'false')

    fireEvent.click(trigger)
    await user.click(screen.getByRole('menuitem', { name: /account settings/i }))
    expect(onSettings).toHaveBeenCalled()

    fireEvent.click(trigger)
    await user.click(screen.getByRole('menuitem', { name: /log out/i }))
    expect(onSignOut).toHaveBeenCalled()
  })

  it('applies expected panel styling', () => {
    render(<UserMenu isAuthenticated email="a@b.c" />)
    openMenu()
    const panel = screen.getByRole('menu', { name: /user menu/i })
    expect(panel).toHaveClass('w-60', 'rounded-xl', 'border', 'bg-[#1e2128]', 'shadow-xl', 'p-2')
  })
})
