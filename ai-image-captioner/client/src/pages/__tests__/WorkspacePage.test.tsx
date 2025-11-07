import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";

type View = "mobile" | "tablet" | "desktop";
let currentView: View = "desktop";

vi.mock("../../hooks/useView", () => ({
  useView: () => currentView,
}));

const navigateMock = vi.fn();
vi.mock("react-router-dom", async (importOriginal) => {
  const actual: typeof import("react-router-dom") = await importOriginal();
  return {
    ...actual,
    useNavigate: () => navigateMock,
  };
});

vi.mock("../../components/Layout/Sidebar", () => ({
  default: (props: any) => (
    <aside aria-label="sidebar" data-mode={props.mode} data-open={props.open} data-collapsed={props.collapsed}>
      <button aria-label={props.collapsed ? "expand sidebar" : "collapse sidebar"} onClick={props.onToggle}>
        Toggle
      </button>
      {props.open && (
        <button aria-label="close menu" onClick={props.onClose}>
          Close
        </button>
      )}
    </aside>
  ),
}));

vi.mock("../../components/Layout/Topbar", () => ({
  default: (props: any) => (
    <header>
      <button aria-label={props.mobileOpen ? "close menu" : "open menu"} onClick={props.onMobileToggle}>
        Menu
      </button>
    </header>
  ),
}));

vi.mock("../../components/Layout/Footer", () => ({
  default: () => <footer>Footer</footer>,
}));

vi.mock("../../components/UI/SkeletonGrid", () => ({
  default: ({ count }: { count: number }) => <div data-testid="skeleton" data-count={count}>Skeleton</div>,
}));

vi.mock("../../components/Workspace/WorkspaceGrid", () => ({
  default: (props: any) => (
    <div data-testid="workspace-grid">
      {(props.items ?? []).map((it: any) => (
        <div key={it.id} data-testid={`item-${it.id}`}>
          <span>{it.caption ?? it.id}</span>
          {props.selectionMode ? (
            <button data-testid={`select-${it.id}`} onClick={() => props.onSelect?.(it)}>Select</button>
          ) : (
            <>
              <button data-testid={`edit-${it.id}`} onClick={() => props.onEdit?.(it)}>Edit</button>
              <button data-testid={`delete-${it.id}`} onClick={() => props.onDelete?.(it)}>Delete</button>
            </>
          )}
        </div>
      ))}
    </div>
  ),
}));

vi.mock("../../components/UI/Pagination", () => ({
  default: (props: any) => (
    <div data-testid="pagination">
      <button data-testid="prev" disabled={props.page <= 1 || props.loading} onClick={props.onPrev}>Prev</button>
      <span data-testid="page">{props.page}</span>
      <button data-testid="next" disabled={!props.hasNext || props.loading} onClick={props.onNext}>Next</button>
    </div>
  ),
}));

vi.mock("lucide-react", () => ({
  RefreshCcw: (p: any) => <svg role="img" aria-label="refresh" {...p} />,
}));

function deferred<T>() {
  let resolve!: (v: T | PromiseLike<T>) => void;
  let reject!: (e?: any) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

const PAGE_SIZE = 12;

let fetchSpy: any;

beforeEach(() => {
  currentView = "desktop";
  sessionStorage.clear();
  localStorage.clear();
  vi.clearAllMocks();
  fetchSpy = vi.spyOn(globalThis, "fetch");
});

afterEach(() => {
  fetchSpy.mockRestore();
});

async function importPage() {
  const mod = await import("../WorkspacePage");
  return mod.default;
}

describe("WorkspacePage", () => {
  it("shows skeleton while loading then renders empty state when no items", async () => {
    const first = deferred<Response>();
    fetchSpy.mockReturnValueOnce(first.promise);

    const WorkspacePage = await importPage();
    render(
      <MemoryRouter initialEntries={["/workspace"]}>
        <WorkspacePage />
      </MemoryRouter>
    );

    expect(screen.getByTestId("skeleton-grid")).toBeInTheDocument();

    first.resolve(new Response(JSON.stringify({ items: [], hasNext: false }), { status: 200 }));

    await waitFor(() => expect(screen.getByTestId("workspace-empty")).toBeInTheDocument());
    expect(screen.queryByTestId("skeleton-grid")).toBeNull();
  });

  it("renders items, shows pagination, and refresh triggers a refetch", async () => {
    fetchSpy
      .mockResolvedValueOnce(new Response(JSON.stringify({ items: Array.from({ length: PAGE_SIZE }).map((_, i) => ({ id: `a${i+1}` })), hasNext: true }), { status: 200 }))
      .mockResolvedValueOnce(new Response(JSON.stringify({ items: Array.from({ length: PAGE_SIZE }).map((_, i) => ({ id: `a${i+1}` })), hasNext: true }), { status: 200 }));

    const WorkspacePage = await importPage();
    render(
      <MemoryRouter initialEntries={["/workspace"]}>
        <WorkspacePage />
      </MemoryRouter>
    );

    await waitFor(() => expect(screen.getByTestId("workspace-grid")).toBeInTheDocument());
    expect(screen.getByTestId("pagination")).toBeInTheDocument();
    expect(screen.getByTestId("page")).toHaveTextContent("1");

    fireEvent.click(screen.getByTestId("workspace-refresh"));
    await waitFor(() => expect(fetchSpy).toHaveBeenCalledTimes(2));
  });

  it("delete removes item and refetches", async () => {
    fetchSpy
      .mockResolvedValueOnce(new Response(JSON.stringify({ items: [{ id: "x1" }, { id: "x2" }], hasNext: false }), { status: 200 }))
      .mockResolvedValueOnce(new Response(JSON.stringify({}), { status: 200 }))
      .mockResolvedValueOnce(new Response(JSON.stringify({ items: [{ id: "x2" }], hasNext: false }), { status: 200 }));

    const WorkspacePage = await importPage();
    render(
      <MemoryRouter initialEntries={["/workspace"]}>
        <WorkspacePage />
      </MemoryRouter>
    );

    await waitFor(() => expect(screen.getByTestId("item-x1")).toBeInTheDocument());
    fireEvent.click(screen.getByTestId("delete-x1"));

    await waitFor(() => expect(fetchSpy).toHaveBeenCalledTimes(3));
    expect(screen.queryByTestId("item-x1")).toBeNull();
    expect(screen.getByTestId("item-x2")).toBeInTheDocument();
  });

  it("shows error when fetch fails", async () => {
    fetchSpy.mockResolvedValueOnce(new Response("nope", { status: 500 }));

    const WorkspacePage = await importPage();
    render(
      <MemoryRouter initialEntries={["/workspace"]}>
        <WorkspacePage />
      </MemoryRouter>
    );

    await waitFor(() => expect(screen.getByTestId("workspace-error")).toBeInTheDocument());
    expect(screen.getByTestId("workspace-error")).toHaveTextContent(/Failed to load/i);
  });

  it("picker mode title and selection navigates to returnTo with id", async () => {
    const now = Date.now();
    sessionStorage.setItem("workspace-picker", JSON.stringify({ from: "editor", ts: now }));

    fetchSpy.mockResolvedValueOnce(new Response(JSON.stringify({ items: [{ id: "pick-1" }], hasNext: false }), { status: 200 }));

    const WorkspacePage = await importPage();
    render(
      <MemoryRouter initialEntries={["/workspace?picker=1&return=%2Feditor"]}>
        <WorkspacePage />
      </MemoryRouter>
    );

    await waitFor(() => expect(screen.getByTestId("workspace-title")).toHaveTextContent("Select an Image"));
    fireEvent.click(screen.getByTestId("select-pick-1"));
    expect(navigateMock).toHaveBeenCalledWith("/editor?id=pick-1");
  });

  it("mobile view uses overlay sidebar and topbar menu toggles", async () => {
    currentView = "mobile";
    fetchSpy.mockResolvedValueOnce(new Response(JSON.stringify({ items: [], hasNext: false }), { status: 200 }));

    const WorkspacePage = await importPage();
    render(
      <MemoryRouter initialEntries={["/workspace"]}>
        <WorkspacePage />
      </MemoryRouter>
    );

    const open = screen.getByRole("button", { name: /open menu/i });
    fireEvent.click(open);
    const closeBtns = await screen.findAllByRole("button", { name: /close menu/i });
    expect(closeBtns.length).toBeGreaterThan(0);
    fireEvent.click(closeBtns[0]);
    await screen.findByRole("button", { name: /open menu/i });
  });
});
