import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import Sidebar from '../Sidebar'

vi.mock('../../../session/useSession', () => ({
  useSession: vi.fn(() => ({ user: { id: 'u1', name: 'Alex' } })),
}))

function renderSidebar(props?: Partial<React.ComponentProps<typeof Sidebar>>, initialPath = '/') {
  const onToggle = vi.fn()
  const onClose = vi.fn()
  render(
    <MemoryRouter initialEntries={[initialPath]}>
      <Sidebar
        mode={props?.mode ?? 'docked'}
        open={props?.open ?? true}
        collapsed={props?.collapsed ?? false}
        onToggle={props?.onToggle ?? onToggle}
        onClose={props?.onClose ?? onClose}
      />
    </MemoryRouter>
  )
  return { onToggle, onClose }
}

it('renders all links when authenticated', () => {
  renderSidebar()
  const nav = screen.getByLabelText('Sidebar')
  expect(within(nav).getByRole('link', { name: 'Homepage' })).toBeInTheDocument()
  expect(within(nav).getByRole('link', { name: 'Upload & Generate' })).toBeInTheDocument()
  expect(within(nav).getByRole('link', { name: 'Editor' })).toBeInTheDocument()
  expect(within(nav).getByRole('link', { name: 'My Workspace' })).toBeInTheDocument()
  expect(within(nav).getByRole('link', { name: 'Share' })).toBeInTheDocument()
})

it('hides label text when collapsed in docked mode', () => {
  renderSidebar({ collapsed: true, mode: 'docked' })
  const nav = screen.getByLabelText('Sidebar')
  const link = within(nav).getByRole('link', { name: 'Homepage' })
  const span = within(link).getByText('Homepage')
  expect(span).toHaveClass('hidden')
})

it('adds ?page=1 to workspace link', () => {
  renderSidebar()
  const nav = screen.getByLabelText('Sidebar')
  const ws = within(nav).getByRole('link', { name: 'My Workspace' }) as HTMLAnchorElement
  expect(ws.getAttribute('href')).toBe('/workspace?page=1')
})

it('overlay mode close button invokes onClose', async () => {
  const user = userEvent.setup()
  const { onClose } = renderSidebar({ mode: 'overlay', open: true })
  const closeBtn = screen.getByRole('button', { name: 'Close menu' })
  await user.click(closeBtn)
  expect(onClose).toHaveBeenCalledTimes(1)
})

it('overlay backdrop click invokes onClose', async () => {
  const user = userEvent.setup()
  const { onClose } = renderSidebar({ mode: 'overlay', open: true })
  const backdrop = screen.getByRole('presentation')
  await user.click(backdrop)
  expect(onClose).toHaveBeenCalledTimes(1)
})

it('docked toggle button calls onToggle and reflects collapsed state', async () => {
  const user = userEvent.setup()
  const { onToggle } = renderSidebar({ mode: 'docked', collapsed: false })
  const toggle = screen.getByRole('button', { name: 'Collapse sidebar' })
  await user.click(toggle)
  expect(onToggle).toHaveBeenCalledTimes(1)
})

it('unauthenticated users see only public links', async () => {
  const { useSession } = await import('../../../session/useSession') as { useSession: any }
  useSession.mockReturnValue({ user: null })
  renderSidebar()
  const nav = screen.getByLabelText('Sidebar')
  expect(within(nav).getByRole('link', { name: 'Homepage' })).toBeInTheDocument()
  expect(within(nav).queryByRole('link', { name: 'Upload & Generate' })).toBeNull()
  expect(within(nav).queryByRole('link', { name: 'Editor' })).toBeNull()
  expect(within(nav).queryByRole('link', { name: 'My Workspace' })).toBeNull()
  expect(within(nav).queryByRole('link', { name: 'Share' })).toBeNull()
})
