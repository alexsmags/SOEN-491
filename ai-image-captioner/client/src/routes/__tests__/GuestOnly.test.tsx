import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { MemoryRouter, Routes, Route } from "react-router-dom";

vi.mock("../FullscreenLoader", () => ({
  __esModule: true,
  default: () => <div data-testid="fullscreen-loader">Loading...</div>,
}));

const mockUseSession = vi.fn();
vi.mock("../../session/useSession", () => ({
  useSession: () => mockUseSession(),
}));

import GuestOnly from "../GuestOnly";

function renderWithRoutes(initialEntries: any[]) {
  return render(
    <MemoryRouter initialEntries={initialEntries}>
      <Routes>
        <Route
          path="/login"
          element={
            <GuestOnly>
              <div data-testid="child">Child</div>
            </GuestOnly>
          }
        />
        <Route path="/signup" element={
          <GuestOnly>
            <div data-testid="child">Child</div>
          </GuestOnly>
        } />
        <Route path="/workspace" element={<div data-testid="workspace-landing">Workspace Landing</div>} />
        <Route path="/editor" element={<div data-testid="editor-landing">Editor Landing</div>} />
      </Routes>
    </MemoryRouter>
  );
}

describe("GuestOnly", () => {
  it("renders FullscreenLoader when session is still hydrating", () => {
    mockUseSession.mockReturnValue({
      user: null,
      loading: true,
      hydrated: false,
    });

    const { unmount } = renderWithRoutes(["/login"]);
    expect(screen.getByTestId("fullscreen-loader")).toBeInTheDocument();
    unmount();
  });

  it("renders children when no user is logged in and hydrated", () => {
    mockUseSession.mockReturnValue({
      user: null,
      loading: false,
      hydrated: true,
    });

    const { unmount } = renderWithRoutes(["/login"]);
    expect(screen.getByTestId("child")).toBeInTheDocument();
    unmount();
  });

  it("redirects to /workspace by default when user is logged in", () => {
    mockUseSession.mockReturnValue({
      user: { id: "123", email: "user@example.com" },
      loading: false,
      hydrated: true,
    });

    const { unmount } = renderWithRoutes(["/login"]);
    expect(screen.getByTestId("workspace-landing")).toBeInTheDocument();
    expect(screen.queryByTestId("child")).toBeNull();
    unmount();
  });

  it("redirects to 'from' path if provided in location.state", () => {
    mockUseSession.mockReturnValue({
      user: { id: "abc" },
      loading: false,
      hydrated: true,
    });

    const { unmount } = renderWithRoutes([{ pathname: "/signup", state: { from: { pathname: "/editor" } } }]);
    expect(screen.getByTestId("editor-landing")).toBeInTheDocument();
    expect(screen.queryByTestId("child")).toBeNull();
    unmount();
  });
});
