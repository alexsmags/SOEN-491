import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";

vi.mock("../RequireAuth", () => ({
  __esModule: true,
  default: ({ children }: any) => <div data-testid="require-auth">{children}</div>,
}));
vi.mock("../GuestOnly", () => ({
  __esModule: true,
  default: ({ children }: any) => <div data-testid="guest-only">{children}</div>,
}));

vi.mock("../../pages/HomePage", () => ({ __esModule: true, default: () => <div>Home Page</div> }));
vi.mock("../../pages/WorkspacePage", () => ({ __esModule: true, default: () => <div>Workspace Page</div> }));
vi.mock("../../pages/EditorPage", () => ({ __esModule: true, default: () => <div>Editor Page</div> }));
vi.mock("../../pages/SharePage", () => ({ __esModule: true, default: () => <div>Share Page</div> }));
vi.mock("../../pages/UploadPage", () => ({ __esModule: true, default: () => <div>Upload Page</div> }));
vi.mock("../../pages/LoginPage", () => ({ __esModule: true, default: () => <div>Login Page</div> }));
vi.mock("../../pages/SignupPage", () => ({ __esModule: true, default: () => <div>Signup Page</div> }));

import AppRoutes from "../AppRoutes";

describe("AppRoutes", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders HomePage on root path", () => {
    render(
      <MemoryRouter initialEntries={["/"]}>
        <AppRoutes />
      </MemoryRouter>
    );
    expect(screen.getByText(/Home Page/i)).toBeInTheDocument();
  });

  it("renders LoginPage wrapped in GuestOnly", () => {
    render(
      <MemoryRouter initialEntries={["/login"]}>
        <AppRoutes />
      </MemoryRouter>
    );
    expect(screen.getByTestId("guest-only")).toBeInTheDocument();
    expect(screen.getByText(/Login Page/i)).toBeInTheDocument();
  });

  it("renders SignupPage wrapped in GuestOnly", () => {
    render(
      <MemoryRouter initialEntries={["/signup"]}>
        <AppRoutes />
      </MemoryRouter>
    );
    expect(screen.getByTestId("guest-only")).toBeInTheDocument();
    expect(screen.getByText(/Signup Page/i)).toBeInTheDocument();
  });

  it("renders WorkspacePage wrapped in RequireAuth", () => {
    render(
      <MemoryRouter initialEntries={["/workspace"]}>
        <AppRoutes />
      </MemoryRouter>
    );
    expect(screen.getByTestId("require-auth")).toBeInTheDocument();
    expect(screen.getByText(/Workspace Page/i)).toBeInTheDocument();
  });

  it("renders UploadPage wrapped in RequireAuth", () => {
    render(
      <MemoryRouter initialEntries={["/upload"]}>
        <AppRoutes />
      </MemoryRouter>
    );
    expect(screen.getByTestId("require-auth")).toBeInTheDocument();
    expect(screen.getByText(/Upload Page/i)).toBeInTheDocument();
  });

  it("renders EditorPage wrapped in RequireAuth", () => {
    render(
      <MemoryRouter initialEntries={["/editor"]}>
        <AppRoutes />
      </MemoryRouter>
    );
    expect(screen.getByTestId("require-auth")).toBeInTheDocument();
    expect(screen.getByText(/Editor Page/i)).toBeInTheDocument();
  });

  it("renders SharePage wrapped in RequireAuth", () => {
    render(
      <MemoryRouter initialEntries={["/share"]}>
        <AppRoutes />
      </MemoryRouter>
    );
    expect(screen.getByTestId("require-auth")).toBeInTheDocument();
    expect(screen.getByText(/Share Page/i)).toBeInTheDocument();
  });

  it("redirects unknown routes to HomePage", () => {
    render(
      <MemoryRouter initialEntries={["/something-random"]}>
        <AppRoutes />
      </MemoryRouter>
    );
    expect(screen.getByText(/Home Page/i)).toBeInTheDocument();
  });
});
