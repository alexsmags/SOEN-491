import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";

const assignSpy = vi.fn();

Object.defineProperty(window, "location", {
  value: {
    assign: assignSpy,
    href: "",
  },
  writable: true,
});

type AxiosResp<T = any> = { status: number; data?: T };
const apiGet = vi.fn<(path: string) => Promise<AxiosResp>>();
const apiPost = vi.fn<(path: string, body: any, config?: any) => Promise<AxiosResp>>();

vi.mock("axios", () => {
  const create = vi.fn(() => ({
    get: apiGet,
    post: apiPost,
  }));
  const isAxiosError = (e: any) => !!e?.isAxiosError;
  class AxiosErrorMock extends Error {
    isAxiosError = true;
    response?: { data?: any; status?: number };
    constructor(message: string, resp?: any) {
      super(message);
      this.response = resp;
    }
  }
  return {
    default: { create, isAxiosError, AxiosError: AxiosErrorMock },
    create,
    isAxiosError,
    AxiosError: AxiosErrorMock,
  };
});

vi.mock("lucide-react", () => ({
  Mail: (p: any) => <svg aria-label="mail" {...p} />,
  Lock: (p: any) => <svg aria-label="lock" {...p} />,
  Eye: (p: any) => <svg aria-label="eye" {...p} />,
  EyeOff: (p: any) => <svg aria-label="eyeoff" {...p} />,
}));

vi.mock("../../components/Auth/AuthLayout", () => ({
  default: (props: any) => (
    <div data-testid="auth-layout">
      <h1>{props.title}</h1>
      <h2>{props.subtitle}</h2>
      <div>{props.children}</div>
    </div>
  ),
}));

vi.mock("../../components/Auth/SocialButtons", () => ({
  default: ({ onOAuth }: { onOAuth: (p: "google" | "github" | "twitter" | "linkedin") => void }) => (
    <div data-testid="socials">
      <button onClick={() => onOAuth("google")} data-testid="oauth-google">Google</button>
      <button onClick={() => onOAuth("github")} data-testid="oauth-github">GitHub</button>
      <button onClick={() => onOAuth("twitter")} data-testid="oauth-twitter">Twitter</button>
      <button onClick={() => onOAuth("linkedin")} data-testid="oauth-linkedin">LinkedIn</button>
    </div>
  ),
}));

beforeEach(() => {
  vi.clearAllMocks();
  assignSpy.mockImplementation(() => {});
});

afterEach(() => {});

async function loadPage() {
  const LoginPage = (await import("../LoginPage")).default;
  return LoginPage;
}

describe("LoginPage", () => {
  it("renders fields and submit button", async () => {
    const Page = await loadPage();
    render(
      <MemoryRouter>
        <Page />
      </MemoryRouter>
    );

    expect(screen.getByText(/Welcome back/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/you@example\.com/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/•+/)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Sign in/i })).toBeInTheDocument();
  });

  it("toggles show/hide password", async () => {
    const Page = await loadPage();
    render(
      <MemoryRouter>
        <Page />
      </MemoryRouter>
    );

    const pw = screen.getByPlaceholderText(/•+/) as HTMLInputElement;
    expect(pw.type).toBe("password");

    fireEvent.click(screen.getByRole("button", { name: /Show password/i }));
    expect((screen.getByPlaceholderText(/•+/) as HTMLInputElement).type).toBe("text");

    fireEvent.click(screen.getByRole("button", { name: /Hide password/i }));
    expect((screen.getByPlaceholderText(/•+/) as HTMLInputElement).type).toBe("password");
  });

  it("successful email login: fetches csrf, posts credentials, then redirects", async () => {
    (apiGet as any).mockImplementation(async (path: string) => {
      if (path === "/auth/csrf") return { status: 200, data: { csrfToken: "token123" } };
      throw new Error("unexpected GET");
    });
    (apiPost as any).mockImplementation(async (path: string) => {
      if (path.startsWith("/auth/callback/credentials")) {
        return { status: 200, data: { ok: true, error: null } };
      }
      throw new Error("unexpected POST");
    });

    const Page = await loadPage();
    render(
      <MemoryRouter>
        <Page />
      </MemoryRouter>
    );

    fireEvent.change(screen.getByPlaceholderText(/you@example\.com/i), { target: { value: "USER@Example.com" } });
    fireEvent.change(screen.getByPlaceholderText(/•+/), { target: { value: "secret" } });

    fireEvent.click(screen.getByRole("button", { name: /Sign in/i }));

    await waitFor(() => expect(apiGet).toHaveBeenCalledWith("/auth/csrf"));
    await waitFor(() => expect(apiPost).toHaveBeenCalled());
    await waitFor(() => expect(assignSpy).toHaveBeenCalledWith(expect.stringMatching(/http:\/\/localhost:5173\/$/)));

    const [, form] = (apiPost.mock.calls[0] as any[]);
    const params = new URLSearchParams(form);
    expect(params.get("email")).toBe("user@example.com");
    expect(params.get("password")).toBe("secret");
    expect(params.get("csrfToken")).toBe("token123");
    expect(params.get("redirect")).toBe("false");
  });

  it("email error mapping: CredentialsSignin shows invalid message", async () => {
    (apiGet as any).mockResolvedValue({ status: 200, data: { csrfToken: "t" } });
    (apiPost as any).mockResolvedValue({ status: 401, data: { ok: false, error: "CredentialsSignin" } });

    const Page = await loadPage();
    render(
      <MemoryRouter>
        <Page />
      </MemoryRouter>
    );

    fireEvent.change(screen.getByPlaceholderText(/you@example\.com/i), { target: { value: "a@b.c" } });
    fireEvent.change(screen.getByPlaceholderText(/•+/), { target: { value: "x" } });
    fireEvent.click(screen.getByRole("button", { name: /Sign in/i }));

    await waitFor(() => {
      expect(screen.getByText(/invalid email or password/i)).toBeInTheDocument();
    });
    expect(assignSpy).not.toHaveBeenCalled();
  });

  it("email error mapping: CallbackRouteError shows generic completion error", async () => {
    (apiGet as any).mockResolvedValue({ status: 200, data: { csrfToken: "t" } });
    (apiPost as any).mockResolvedValue({ status: 400, data: { ok: false, error: "CallbackRouteError" } });

    const Page = await loadPage();
    render(
      <MemoryRouter>
        <Page />
      </MemoryRouter>
    );

    fireEvent.change(screen.getByPlaceholderText(/you@example\.com/i), { target: { value: "a@b.c" } });
    fireEvent.change(screen.getByPlaceholderText(/•+/), { target: { value: "x" } });
    fireEvent.click(screen.getByRole("button", { name: /Sign in/i }));

    await waitFor(() => {
      expect(screen.getByText(/could not be completed/i)).toBeInTheDocument();
    });
    expect(assignSpy).not.toHaveBeenCalled();
  });

  it("email error: thrown error then /api/me succeeds triggers redirect", async () => {
    const AxiosErr = (await import("axios")).AxiosError as any;
    (apiGet as any).mockResolvedValueOnce({ status: 200, data: { csrfToken: "t" } });
    (apiPost as any).mockRejectedValueOnce(new AxiosErr("boom", { data: { message: "boom" } }));
    (apiGet as any).mockResolvedValueOnce({ status: 200, data: { user: { id: "u1" } } });

    const Page = await loadPage();
    render(
      <MemoryRouter>
        <Page />
      </MemoryRouter>
    );

    fireEvent.change(screen.getByPlaceholderText(/you@example\.com/i), { target: { value: "a@b.c" } });
    fireEvent.change(screen.getByPlaceholderText(/•+/), { target: { value: "x" } });
    fireEvent.click(screen.getByRole("button", { name: /Sign in/i }));

    await waitFor(() => {
      expect(assignSpy).toHaveBeenCalledWith(expect.stringMatching(/http:\/\/localhost:5173\/$/));
    });
  });

  it("email error: thrown error and /api/me fails shows message", async () => {
    const AxiosErr = (await import("axios")).AxiosError as any;
    (apiGet as any).mockResolvedValueOnce({ status: 200, data: { csrfToken: "t" } });
    (apiPost as any).mockRejectedValueOnce(new AxiosErr("boom", { data: { message: "boom" } }));
    (apiGet as any).mockRejectedValueOnce(new Error("nope"));

    const Page = await loadPage();
    render(
      <MemoryRouter>
        <Page />
      </MemoryRouter>
    );

    fireEvent.change(screen.getByPlaceholderText(/you@example\.com/i), { target: { value: "a@b.c" } });
    fireEvent.change(screen.getByPlaceholderText(/•+/), { target: { value: "x" } });
    fireEvent.click(screen.getByRole("button", { name: /Sign in/i }));

    await waitFor(() => {
      expect(screen.getByText(/boom/i)).toBeInTheDocument();
    });
    expect(assignSpy).not.toHaveBeenCalled();
  });

  it("OAuth buttons redirect to provider with callback", async () => {
    const Page = await loadPage();
    render(
      <MemoryRouter>
        <Page />
      </MemoryRouter>
    );

    fireEvent.click(screen.getByTestId("oauth-google"));
    expect(window.location.href).toMatch(/^http:\/\/localhost:5000\/auth\/signin\/google\?callbackUrl=http%3A%2F%2Flocalhost%3A5173%2F$/);

    fireEvent.click(screen.getByTestId("oauth-github"));
    expect(window.location.href).toMatch(/^http:\/\/localhost:5000\/auth\/signin\/github\?callbackUrl=http%3A%2F%2Flocalhost%3A5173%2F$/);

    fireEvent.click(screen.getByTestId("oauth-twitter"));
    expect(window.location.href).toMatch(/^http:\/\/localhost:5000\/auth\/signin\/twitter\?callbackUrl=http%3A%2F%2Flocalhost%3A5173%2F$/);

    fireEvent.click(screen.getByTestId("oauth-linkedin"));
    expect(window.location.href).toMatch(/^http:\/\/localhost:5000\/auth\/signin\/linkedin\?callbackUrl=http%3A%2F%2Flocalhost%3A5173%2F$/);
  });
});
