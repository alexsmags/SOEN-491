import { render, screen, act, cleanup } from "@testing-library/react";
import { useView } from "../useView";

type Listener = (e: { matches: boolean; media: string }) => void;

let currentWidth = 1200;
const queries = [
  "(max-width: 767px)",
  "(min-width: 768px) and (max-width: 1023px)",
  "(min-width: 1024px)",
];

const listenersMap = new Map<string, Set<Listener>>();
const mqlCache = new Map<string, any>();

function computeMatch(q: string, w: number) {
  if (q === queries[0]) return w <= 767;
  if (q === queries[1]) return w >= 768 && w <= 1023;
  if (q === queries[2]) return w >= 1024;
  return false;
}

function getMql(query: string) {
  if (mqlCache.has(query)) return mqlCache.get(query);
  const ls = new Set<Listener>();
  listenersMap.set(query, ls);
  const mql = {
    media: query,
    get matches() {
      return computeMatch(query, currentWidth);
    },
    addEventListener: (_: "change", cb: Listener) => {
      ls.add(cb);
    },
    removeEventListener: (_: "change", cb: Listener) => {
      ls.delete(cb);
    },
    dispatch: () => {
      const e = { matches: computeMatch(query, currentWidth), media: query };
      Array.from(ls).forEach((cb) => cb(e));
    },
  };
  mqlCache.set(query, mql);
  return mql;
}

Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: (q: string) => getMql(q),
});

function setViewportWidth(w: number) {
  currentWidth = w;
  queries.forEach((q) => getMql(q).dispatch());
}

function Host() {
  const v = useView();
  return <div data-testid="view">{v}</div>;
}

describe("useView", () => {
  afterEach(() => {
    cleanup();
    listenersMap.clear();
    mqlCache.clear();
    currentWidth = 1200;
  });

  it("returns desktop/tablet/mobile and updates on media query changes", async () => {
    setViewportWidth(1200);
    render(<Host />);
    expect(screen.getByTestId("view").textContent).toBe("desktop");

    await act(async () => {
      setViewportWidth(800);
    });
    expect(screen.getByTestId("view").textContent).toBe("tablet");

    await act(async () => {
      setViewportWidth(480);
    });
    expect(screen.getByTestId("view").textContent).toBe("mobile");

    await act(async () => {
      setViewportWidth(1600);
    });
    expect(screen.getByTestId("view").textContent).toBe("desktop");
  });

  it("initializes correctly for mobile and tablet", () => {
    setViewportWidth(600);
    render(<Host />);
    expect(screen.getByTestId("view").textContent).toBe("mobile");
    cleanup();

    setViewportWidth(900);
    render(<Host />);
    expect(screen.getByTestId("view").textContent).toBe("tablet");
  });

  it("removes listeners on unmount", async () => {
    setViewportWidth(1024);
    const { unmount } = render(<Host />);
    expect(screen.getByTestId("view").textContent).toBe("desktop");
    const countsBefore = Array.from(listenersMap.values()).map((s) => s.size);
    unmount();
    const countsAfter = Array.from(listenersMap.values()).map((s) => s.size);
    countsAfter.forEach((n, i) => {
      expect(n).toBeLessThanOrEqual(countsBefore[i]);
    });
    await act(async () => {
      setViewportWidth(500);
    });
  });
});
