import { render, screen, fireEvent } from '@testing-library/react'
import { vi, type Mock } from 'vitest'
import Topbar from '../Topbar'

const { useSessionMock } = vi.hoisted(() => ({ useSessionMock: vi.fn() }))

vi.mock('../../session', () => ({
  useSession: useSessionMock,
}))

vi.mock('../UserMenu', () => ({
  __esModule: true,
  default: vi.fn(() => <div data-testid="user-menu" />),
}))
import UserMenu from '../UserMenu'

describe('Topbar', () => {
  beforeEach(() => {
    vi.resetAllMocks()
  })

  it('renders header and user menu', () => {
    useSessionMock.mockReturnValue({ user: { email: 'john@example.com' } })
    render(<Topbar isOverlay={false} mobileOpen={false} onMobileToggle={vi.fn()} />)
    const header = screen.getByRole('banner')
    expect(header).toBeInTheDocument()
    expect(screen.getByTestId('user-menu')).toBeInTheDocument()
  })

  it('shows mobile menu button when overlay is true', () => {
    useSessionMock.mockReturnValue({ user: null })
    const toggle = vi.fn()
    render(<Topbar isOverlay mobileOpen={false} onMobileToggle={toggle} />)
    const btn = screen.getByRole('button', { name: /open menu/i })
    expect(btn).toBeInTheDocument()
    fireEvent.click(btn)
    expect(toggle).toHaveBeenCalled()
  })

  it('changes aria-label when mobileOpen is true', () => {
    useSessionMock.mockReturnValue({ user: null })
    render(<Topbar isOverlay mobileOpen onMobileToggle={vi.fn()} />)
    expect(screen.getByRole('button', { name: /close menu/i })).toBeInTheDocument()
  })

  it('calls logout and redirects to server URL', () => {
    useSessionMock.mockReturnValue({ user: { email: 'a@b.c' } })
    delete (window as any).location
    ;(window as any).location = { href: '' }
    render(<Topbar isOverlay={false} mobileOpen={false} onMobileToggle={vi.fn()} />)
    const props = (UserMenu as unknown as Mock).mock.calls[0][0] as any
    props.onSignOut()
    expect(window.location.href).toContain('/auth/signout')
  })

  it('provides correct sign-in and sign-up handlers', () => {
    useSessionMock.mockReturnValue({ user: null })
    delete (window as any).location
    ;(window as any).location = { href: '' }
    render(<Topbar isOverlay={false} mobileOpen={false} onMobileToggle={vi.fn()} />)
    const props = (UserMenu as unknown as Mock).mock.calls[0][0] as any
    props.onSignIn()
    expect(window.location.href).toBe('/login')
    props.onSignUp()
    expect(window.location.href).toBe('/signup')
  })

  it('provides profile and settings redirect handlers', () => {
    useSessionMock.mockReturnValue({ user: { email: 'z@y.com' } })
    delete (window as any).location
    ;(window as any).location = { href: '' }
    render(<Topbar isOverlay={false} mobileOpen={false} onMobileToggle={vi.fn()} />)
    const props = (UserMenu as unknown as Mock).mock.calls[0][0] as any
    props.onProfile()
    expect(window.location.href).toBe('/workspace')
    props.onSettings()
    expect(window.location.href).toBe('/workspace')
  })
})
