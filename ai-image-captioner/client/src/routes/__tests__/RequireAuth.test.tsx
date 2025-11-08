import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import RequireAuth from "../RequireAuth";

vi.mock("../FullscreenLoader", () => ({
  __esModule: true,
  default: () => <div data-testid="fullscreen-loader">Loading...</div>,
}));

const mockUseSession = vi.fn();
vi.mock("../../session/useSession", () => ({
  useSession: () => mockUseSession(),
}));

function renderWithRoutes(initialEntries: any[]) {
  return render(
    <MemoryRouter initialEntries={initialEntries}>
      <Routes>
        <Route
          path="/login"
          element={<div data-testid="login-page">Login Page</div>}
        />
        <Route
          path="/workspace"
          element={
            <RequireAuth>
              <div data-testid="workspace-page">Workspace Page</div>
            </RequireAuth>
          }
        />
        <Route
          path="/editor"
          element={
            <RequireAuth>
              <div data-testid="editor-page">Editor Page</div>
            </RequireAuth>
          }
        />
      </Routes>
    </MemoryRouter>
  );
}

describe("RequireAuth", () => {
  it("renders FullscreenLoader when session is still hydrating", () => {
    mockUseSession.mockReturnValue({
      user: null,
      loading: true,
      hydrated: false,
    });

    renderWithRoutes(["/workspace"]);
    expect(screen.getByTestId("fullscreen-loader")).toBeInTheDocument();
  });

  it("renders children when user is logged in and hydrated", () => {
    mockUseSession.mockReturnValue({
      user: { id: "123", email: "user@example.com" },
      loading: false,
      hydrated: true,
    });

    renderWithRoutes(["/workspace"]);
    expect(screen.getByTestId("workspace-page")).toBeInTheDocument();
  });

  it("redirects to login page when user is not logged in", () => {
    mockUseSession.mockReturnValue({
      user: null,
      loading: false,
      hydrated: true,
    });

    renderWithRoutes(["/workspace"]);
    expect(screen.getByTestId("login-page")).toBeInTheDocument();
  });

  it("redirects to login if user is not authenticated and route is protected", () => {
    mockUseSession.mockReturnValue({
      user: null,
      loading: false,
      hydrated: true,
    });

    renderWithRoutes(["/editor"]);
    expect(screen.getByTestId("login-page")).toBeInTheDocument();
  });

  it("redirects to the 'from' location when provided", () => {
    mockUseSession.mockReturnValue({
      user: null,
      loading: false,
      hydrated: true,
    });

    const location = { pathname: "/editor" };
    renderWithRoutes([{ pathname: "/workspace", state: { from: location } }]);
    expect(screen.getByTestId("login-page")).toBeInTheDocument();
  });
});
