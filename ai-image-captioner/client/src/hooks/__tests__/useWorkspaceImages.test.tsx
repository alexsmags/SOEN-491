import {
  describe,
  it,
  expect,
  vi,
  beforeEach,
  afterEach,
  type Mock,
} from 'vitest'
import { render, screen, waitFor, act } from '@testing-library/react'
import { useWorkspaceImages, type WorkspaceImage } from '../useWorkspaceImages'

type FetchCall = {
  input: RequestInfo | URL
  init?: RequestInit
}

const PAGE_SIZE = 12

function makeItems(n: number, offset = 0): WorkspaceImage[] {
  return Array.from({ length: n }, (_, i) => ({
    id: String(i + 1 + offset),
    imageUrl: `/img/${i + 1 + offset}.png`,
  }))
}

function queueFetchResponses(
  responses: Array<{
    ok?: boolean
    status?: number
    json?: any
    text?: string
  }>
): Mock {
  let callIndex = 0

  const impl = vi.fn(async (): Promise<Response> => {
    const cfg = responses[callIndex] ?? responses[responses.length - 1]
    callIndex++
    const { ok = true, status = 200, json = {}, text = '' } = cfg

    const resp: Partial<Response> = {
      ok,
      status,
      async json() {
        return json
      },
      async text() {
        return text
      },
    }
    return resp as Response
  })

  vi.stubGlobal('fetch', impl)
  return impl as unknown as Mock
}

function getLastFetch(): FetchCall {
  const mock = global.fetch as unknown as Mock
  const calls = mock.mock.calls as Array<[RequestInfo | URL, RequestInit?]>
  const last = calls.at(-1)
  return { input: last?.[0]!, init: last?.[1] }
}

function Harness() {
  const state = useWorkspaceImages()
  ;(globalThis as any).__hook = state
  return (
    <div>
      <div data-testid="loading">{String(state.loading)}</div>
      <div data-testid="error">{state.error ?? ''}</div>
      <div data-testid="page">{state.page}</div>
      <div data-testid="hasNext">{String(state.hasNext)}</div>
      <div data-testid="count">{state.images.length}</div>
      <ul data-testid="ids">
        {state.images.map((im) => (
          <li key={im.id}>{im.id}</li>
        ))}
      </ul>
    </div>
  )
}

beforeEach(() => {
  vi.restoreAllMocks()
  localStorage.clear()
})

afterEach(() => {
  vi.clearAllMocks()
})

describe('useWorkspaceImages', () => {
  it('loads first page on mount and sets state (hasNext via hasNext flag)', async () => {
    queueFetchResponses([
      {
        json: {
          items: makeItems(5),
          hasNext: true,
          page: 1,
          pageSize: PAGE_SIZE,
          total: 100,
        },
      },
    ])

    render(<Harness />)

    expect(screen.getByTestId('loading').textContent).toBe('true')

    await waitFor(() =>
      expect(screen.getByTestId('loading').textContent).toBe('false')
    )

    expect(screen.getByTestId('page').textContent).toBe('1')
    expect(screen.getByTestId('hasNext').textContent).toBe('true')
    expect(screen.getByTestId('error').textContent).toBe('')
    expect(screen.getByTestId('count').textContent).toBe('5')

    const last = getLastFetch()
    expect(String(last.input)).toMatch(/\/api\/media\?page=1&pageSize=12$/)
    expect(last.init?.credentials).toBe('include')
  })

  it('adds dev header when dev-user-id is in localStorage', async () => {
    localStorage.setItem('dev-user-id', 'abc-123')
    queueFetchResponses([{ json: { items: makeItems(2), hasNext: false } }])

    render(<Harness />)
    await waitFor(() =>
      expect(screen.getByTestId('loading').textContent).toBe('false')
    )

    const { init } = getLastFetch()
    const headers = (init?.headers ?? {}) as Record<string, string> | Headers
    const headerVal =
      (headers as any)['x-user-id'] ??
      (headers instanceof Headers ? headers.get('x-user-id') : undefined)

    expect(headerVal).toBe('abc-123')
  })

  it('computes hasNext from total when hasNext is not provided', async () => {
    queueFetchResponses([
      { json: { items: makeItems(12), total: 25 } },
      { json: { items: makeItems(13, 12), total: 25 } },
    ])

    render(<Harness />)
    await waitFor(() =>
      expect(screen.getByTestId('loading').textContent).toBe('false')
    )
    expect(screen.getByTestId('hasNext').textContent).toBe('true')
    expect(screen.getByTestId('count').textContent).toBe('12')

    act(() => {
      ;(globalThis as any).__hook.nextPage()
    })
    await waitFor(() =>
      expect(screen.getByTestId('page').textContent).toBe('2')
    )
    expect(screen.getByTestId('hasNext').textContent).toBe('true')
    expect(screen.getByTestId('count').textContent).toBe('13')
  })

  it('computes hasNext from items length when neither hasNext nor total provided', async () => {
    queueFetchResponses([
      { json: { items: makeItems(PAGE_SIZE) } },
      { json: { items: makeItems(3, PAGE_SIZE) } },
    ])

    render(<Harness />)
    await waitFor(() =>
      expect(screen.getByTestId('loading').textContent).toBe('false')
    )
    expect(screen.getByTestId('hasNext').textContent).toBe('true')

    act(() => {
      ;(globalThis as any).__hook.nextPage()
    })

    await waitFor(() =>
      expect(screen.getByTestId('page').textContent).toBe('2')
    )
    expect(screen.getByTestId('hasNext').textContent).toBe('false')
    expect(screen.getByTestId('count').textContent).toBe('3')
  })

  it('accepts array response and sets hasNext by length === PAGE_SIZE', async () => {
    queueFetchResponses([{ json: makeItems(PAGE_SIZE) }])
    render(<Harness />)
    await waitFor(() =>
      expect(screen.getByTestId('loading').textContent).toBe('false')
    )
    expect(screen.getByTestId('count').textContent).toBe(String(PAGE_SIZE))
    expect(screen.getByTestId('hasNext').textContent).toBe('true')
  })

  it('accepts plain object with items array and no paging fields', async () => {
    queueFetchResponses([{ json: { items: makeItems(3) } }])
    render(<Harness />)
    await waitFor(() =>
      expect(screen.getByTestId('loading').textContent).toBe('false')
    )
    expect(screen.getByTestId('count').textContent).toBe('3')
    expect(screen.getByTestId('hasNext').textContent).toBe('false')
  })

  it('handles non-ok fetch with text body, sets error and clears list', async () => {
    queueFetchResponses([{ ok: false, status: 500, text: 'boom' }])

    render(<Harness />)
    await waitFor(() =>
      expect(screen.getByTestId('loading').textContent).toBe('false')
    )
    expect(screen.getByTestId('error').textContent).toMatch(
      /Failed to load media \(500\): boom/
    )
    expect(screen.getByTestId('count').textContent).toBe('0')
    expect(screen.getByTestId('hasNext').textContent).toBe('false')
  })

  it('nextPage, prevPage, and reload work correctly', async () => {
    queueFetchResponses([
      { json: { items: makeItems(PAGE_SIZE), hasNext: true } },
      { json: { items: makeItems(2, PAGE_SIZE), hasNext: false } },
      { json: { items: makeItems(PAGE_SIZE), hasNext: true } },
      { json: { items: makeItems(PAGE_SIZE), hasNext: true } },
    ])

    render(<Harness />)
    await waitFor(() =>
      expect(screen.getByTestId('loading').textContent).toBe('false')
    )
    expect(screen.getByTestId('page').textContent).toBe('1')

    act(() => {
      ;(globalThis as any).__hook.nextPage()
    })
    await waitFor(() =>
      expect(screen.getByTestId('page').textContent).toBe('2')
    )
    expect(screen.getByTestId('count').textContent).toBe('2')
    expect(screen.getByTestId('hasNext').textContent).toBe('false')

    act(() => {
      ;(globalThis as any).__hook.prevPage()
    })
    await waitFor(() =>
      expect(screen.getByTestId('page').textContent).toBe('1')
    )
    expect(screen.getByTestId('count').textContent).toBe(String(PAGE_SIZE))

    act(() => {
      ;(globalThis as any).__hook.reload()
    })
    await waitFor(() =>
      expect(screen.getByTestId('loading').textContent).toBe('false')
    )
    expect(screen.getByTestId('page').textContent).toBe('1')
    expect(screen.getByTestId('count').textContent).toBe(String(PAGE_SIZE))
  })

  it('gracefully handles unexpected JSON shape (non-object, non-array)', async () => {
    queueFetchResponses([{ json: 42 }])
    render(<Harness />)
    await waitFor(() =>
      expect(screen.getByTestId('loading').textContent).toBe('false')
    )
    expect(screen.getByTestId('count').textContent).toBe('0')
    expect(screen.getByTestId('hasNext').textContent).toBe('false')
    expect(screen.getByTestId('error').textContent).toBe('')
  })
})
