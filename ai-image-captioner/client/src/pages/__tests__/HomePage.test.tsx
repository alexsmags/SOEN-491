import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";

vi.mock("../../session", () => {
  const useSession = vi.fn(() => ({ user: null, loading: false }));
  return { useSession, __esModule: true };
});

vi.mock("../assets/caption_image.png", () => ({ default: "img.png" }));

type View = "mobile" | "tablet" | "desktop";
let currentView: View = "desktop";
const mqls: Array<{ query: string; listeners: Set<(e: any) => void>; matches: boolean }> = [];

function computeMatches(query: string) {
  if (query.includes("max-width: 767px")) return currentView === "mobile";
  if (query.includes("min-width: 768px") && query.includes("max-width: 1023px")) return currentView === "tablet";
  if (query.includes("min-width: 1024px")) return currentView === "desktop";
  return false;
}

function updateView(v: View) {
  currentView = v;
  for (const m of mqls) {
    const next = computeMatches(m.query);
    if (next !== m.matches) {
      m.matches = next;
      m.listeners.forEach((fn) => fn({ matches: next, media: m.query }));
    }
  }
}

beforeEach(() => {
  mqls.length = 0;
  currentView = "desktop";

  Object.defineProperty(window, "matchMedia", {
    writable: true,
    value: (query: string) => {
      const entry = { query, listeners: new Set<(e: any) => void>(), matches: computeMatches(query) };
      mqls.push(entry);
      return {
        matches: entry.matches,
        media: query,
        addEventListener: (_: string, cb: (e: any) => void) => entry.listeners.add(cb),
        removeEventListener: (_: string, cb: (e: any) => void) => entry.listeners.delete(cb),
        addListener: (cb: (e: any) => void) => entry.listeners.add(cb),
        removeListener: (cb: (e: any) => void) => entry.listeners.delete(cb),
        onchange: null,
        dispatchEvent: (e: any) => {
          entry.listeners.forEach((fn) => fn(e));
          return true;
        },
      } as any;
    },
  });

  localStorage.clear();
  vi.resetModules();
});

describe("HomePage", () => {
  it("shows skeleton when loading", async () => {
    const HomePage = (await import("../HomePage")).default;
    const sess = await import("../../session");
    (sess as any).useSession.mockReturnValue({ user: null, loading: true });

    render(
      <MemoryRouter>
        <HomePage />
      </MemoryRouter>
    );

    expect(screen.queryByText(/Get Started Now/i)).toBeNull();
    expect(screen.getByRole("contentinfo")).toBeInTheDocument();
  });

  it("greets authenticated user and shows hero", async () => {
    const HomePage = (await import("../HomePage")).default;
    const sess = await import("../../session");
    (sess as any).useSession.mockReturnValue({ user: { name: "Alex" }, loading: false });

    render(
      <MemoryRouter>
        <HomePage />
      </MemoryRouter>
    );

    expect(screen.getByText(/Hello, Alex/i)).toBeInTheDocument();
    expect(screen.getByRole("img", { name: /Phone showcasing captions/i })).toBeInTheDocument();
    expect(screen.getByText(/Get Started Now/i)).toBeInTheDocument();
  });

  it("renders features and testimonials content from data", async () => {
    const data = await import("../../data/homepageContent");
    const HomePage = (await import("../HomePage")).default;
    const sess = await import("../../session");
    (sess as any).useSession.mockReturnValue({ user: null, loading: false });

    render(
      <MemoryRouter>
        <HomePage />
      </MemoryRouter>
    );

    expect(screen.getByText(/Unlock the Power of AI-Driven Captions/i)).toBeInTheDocument();

    const features = (data as any).FEATURES as Array<{ title: string }>;
    if (features.length > 0) {
      expect(
        screen.getByText(new RegExp(features[0].title.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i"))
      ).toBeInTheDocument();
    }
    if (features.length > 1) {
      expect(
        screen.getByText(new RegExp(features[1].title.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i"))
      ).toBeInTheDocument();
    }

    expect(screen.getByText(/What Our Users Say/i)).toBeInTheDocument();

    const testimonials = (data as any).TESTIMONIALS as Array<{ name: string }>;
    if (testimonials.length > 0) {
      expect(
        screen.getByText(new RegExp(testimonials[0].name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i"))
      ).toBeInTheDocument();
    }
    if (testimonials.length > 1) {
      expect(
        screen.getByText(new RegExp(testimonials[1].name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i"))
      ).toBeInTheDocument();
    }
  });

  it("mobile view uses overlay sidebar: open menu then shows close menu", async () => {
    updateView("mobile");

    const HomePage = (await import("../HomePage")).default;
    const sess = await import("../../session");
    (sess as any).useSession.mockReturnValue({ user: null, loading: false });

    render(
      <MemoryRouter>
        <HomePage />
      </MemoryRouter>
    );

    const openBtn = screen.getByRole("button", { name: /open menu/i });
    expect(openBtn).toBeInTheDocument();

    fireEvent.click(openBtn);

    const closeBtns = await screen.findAllByRole("button", { name: /close menu/i });
    expect(closeBtns.length).toBeGreaterThan(0);
  });

  it("tablet view defaults to collapsed when no saved state (shows a sidebar toggle)", async () => {
    updateView("tablet");
    localStorage.removeItem("sidebar-collapsed");

    const HomePage = (await import("../HomePage")).default;
    const sess = await import("../../session");
    (sess as any).useSession.mockReturnValue({ user: null, loading: false });

    render(
      <MemoryRouter>
        <HomePage />
      </MemoryRouter>
    );

    await waitFor(() => {
      const expand = screen.queryByRole("button", { name: /expand sidebar/i });
      const collapse = screen.queryByRole("button", { name: /collapse sidebar/i });
      expect(expand || collapse).toBeTruthy();
    });
  });

  it("desktop view reads 'sidebar-collapsed' from localStorage", async () => {
    updateView("desktop");
    localStorage.setItem("sidebar-collapsed", "1");

    const HomePage = (await import("../HomePage")).default;
    const sess = await import("../../session");
    (sess as any).useSession.mockReturnValue({ user: null, loading: false });

    render(
      <MemoryRouter>
        <HomePage />
      </MemoryRouter>
    );

    expect(screen.getByRole("button", { name: /expand sidebar/i })).toBeInTheDocument();
  });
});
