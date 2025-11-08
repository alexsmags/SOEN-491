import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";

vi.mock("lucide-react", async () => {
  const React = await import("react");
  const Icon = (props: any) => React.createElement("span", props);
  const names = [
    "Home",
    "User",
    "Mail",
    "Lock",
    "Eye",
    "EyeOff",
    "CheckCircle2",
    "Menu",
    "X",
    "ChevronRight",
    "ChevronLeft",
    "Github",
    "Twitter",
    "Linkedin",
    "Google",
  ];
  const out: any = { __esModule: true, default: Icon };
  for (const n of names) out[n] = Icon;
  return out;
});

vi.mock("../../components/Auth/AuthLayout", () => {
  return {
    __esModule: true,
    default: ({ children, title, subtitle }: any) => (
      <div>
        <h1>{title}</h1>
        <p>{subtitle}</p>
        {children}
      </div>
    ),
  };
});

vi.mock("../../components/Auth/SocialButtons", () => {
  return {
    __esModule: true,
    default: ({ onOAuth }: { onOAuth: (p: "google" | "github" | "twitter" | "linkedin") => void }) => (
      <div>
        <button onClick={() => onOAuth("google")}>Continue with Google</button>
        <button onClick={() => onOAuth("github")}>Continue with GitHub</button>
        <button onClick={() => onOAuth("twitter")}>Continue with Twitter</button>
        <button onClick={() => onOAuth("linkedin")}>Continue with LinkedIn</button>
      </div>
    ),
  };
});

const __api = { post: vi.fn(), get: vi.fn() };

class MockAxiosError extends Error {
  isAxiosError = true;
  response?: any;
  constructor(message: string, response?: any) {
    super(message);
    this.response = response;
  }
}

vi.mock("axios", () => {
  return {
    __esModule: true,
    default: {
      create: vi.fn(() => __api),
      isAxiosError: (e: any) => !!e?.isAxiosError || !!e?.isAxios,
    },
    AxiosError: MockAxiosError,
  };
});

function fillForm({ name, email, pw, pw2, agree }: { name?: string; email?: string; pw?: string; pw2?: string; agree?: boolean }) {
  if (name !== undefined) fireEvent.change(screen.getByLabelText(/name/i), { target: { value: name } });
  if (email !== undefined) fireEvent.change(screen.getByLabelText(/email/i), { target: { value: email } });
  if (pw !== undefined) fireEvent.change(screen.getByLabelText(/^password$/i), { target: { value: pw } });
  if (pw2 !== undefined) fireEvent.change(screen.getByLabelText(/confirm password/i), { target: { value: pw2 } });
  if (agree !== undefined) {
    const cb = screen.getByRole("checkbox");
    if (cb instanceof HTMLInputElement && cb.checked !== agree) {
      fireEvent.click(cb);
    }
  }
}

beforeEach(() => {
  vi.restoreAllMocks();
  __api.post.mockReset();
  __api.get.mockReset();
  document.body.innerHTML = "";
});

describe("SignupPage", () => {
  it("renders fields and submit button", async () => {
    const SignupPage = (await import("../SignupPage")).default;
    render(
      <MemoryRouter>
        <SignupPage />
      </MemoryRouter>
    );
    expect(screen.getByText(/Create your account/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^password$/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/confirm password/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /create account/i })).toBeInTheDocument();
  });

  it("validates that Terms must be accepted", async () => {
    const SignupPage = (await import("../SignupPage")).default;
    render(
      <MemoryRouter>
        <SignupPage />
      </MemoryRouter>
    );
    fillForm({ name: "Alex", email: "alex@example.com", pw: "password123", pw2: "password123", agree: false });
    fireEvent.click(screen.getByRole("button", { name: /create account/i }));
    expect(await screen.findByText(/Please accept the Terms and Privacy Policy/i)).toBeInTheDocument();
    expect(__api.post).not.toHaveBeenCalled();
  });

  it("validates minimum password length", async () => {
    const SignupPage = (await import("../SignupPage")).default;
    render(
      <MemoryRouter>
        <SignupPage />
      </MemoryRouter>
    );
    fillForm({ name: "Alex", email: "alex@example.com", pw: "short", pw2: "short", agree: true });
    fireEvent.click(screen.getByRole("button", { name: /create account/i }));
    expect(await screen.findByText(/Password must be at least 8 characters/i)).toBeInTheDocument();
    expect(__api.post).not.toHaveBeenCalled();
  });

  it("validates matching passwords", async () => {
    const SignupPage = (await import("../SignupPage")).default;
    render(
      <MemoryRouter>
        <SignupPage />
      </MemoryRouter>
    );
    fillForm({ name: "Alex", email: "alex@example.com", pw: "password123", pw2: "password124", agree: true });
    fireEvent.click(screen.getByRole("button", { name: /create account/i }));
    expect(await screen.findByText(/Passwords do not match/i)).toBeInTheDocument();
    expect(__api.post).not.toHaveBeenCalled();
  });

  it("handles server error: email already in use", async () => {
    const SignupPage = (await import("../SignupPage")).default;
    __api.post.mockRejectedValue(new MockAxiosError("bad", { data: { error: "email_in_use" } }));
    render(
      <MemoryRouter>
        <SignupPage />
      </MemoryRouter>
    );
    fillForm({ name: "Alex", email: "alex@example.com", pw: "password123", pw2: "password123", agree: true });
    fireEvent.click(screen.getByRole("button", { name: /create account/i }));
    expect(await screen.findByText(/already registered/i)).toBeInTheDocument();
  });

  it("handles server error: invalid_input", async () => {
    const SignupPage = (await import("../SignupPage")).default;
    __api.post.mockRejectedValue(new MockAxiosError("bad", { data: { error: "invalid_input" } }));
    render(
      <MemoryRouter>
        <SignupPage />
      </MemoryRouter>
    );
    fillForm({ name: "Alex", email: "alex@example.com", pw: "password123", pw2: "password123", agree: true });
    fireEvent.click(screen.getByRole("button", { name: /create account/i }));
    expect(await screen.findByText(/check your details/i)).toBeInTheDocument();
  });

  it("handles generic server error shows message", async () => {
    const SignupPage = (await import("../SignupPage")).default;
    __api.post.mockRejectedValue(new Error("Network down"));
    render(
      <MemoryRouter>
        <SignupPage />
      </MemoryRouter>
    );
    fillForm({ name: "Alex", email: "alex@example.com", pw: "password123", pw2: "password123", agree: true });
    fireEvent.click(screen.getByRole("button", { name: /create account/i }));
    expect(await screen.findByText(/Network down|Sign-up failed/i)).toBeInTheDocument();
  });

  it("successful sign up posts, fetches csrf, builds form and submits", async () => {
    const SignupPage = (await import("../SignupPage")).default;
    __api.post.mockResolvedValue({ data: {} });
    __api.get.mockResolvedValue({ data: { csrfToken: "csrf-123" } });
    const submitSpy = vi.spyOn(HTMLFormElement.prototype, "submit").mockImplementation(function () {});
    render(
      <MemoryRouter>
        <SignupPage />
      </MemoryRouter>
    );
    fillForm({ name: "Alex", email: "USER@Example.com", pw: "password123", pw2: "password123", agree: true });
    fireEvent.click(screen.getByRole("button", { name: /create account/i }));
    expect(await screen.findByText(/Account created! Signing you in/i)).toBeInTheDocument();
    await waitFor(() => expect(__api.post).toHaveBeenCalledWith("/api/signup", { name: "Alex", email: "user@example.com", password: "password123" }));
    await waitFor(() => expect(__api.get).toHaveBeenCalledWith("/auth/csrf"));
    await waitFor(() => expect(submitSpy).toHaveBeenCalled());
    const createdForm = Array.from(document.querySelectorAll("form")).find((f) =>
      (f as HTMLFormElement).action.includes("http://localhost:5000/auth/callback/credentials")
    ) as HTMLFormElement | undefined;
    expect(createdForm).toBeTruthy();
    const inputs = createdForm ? (Array.from(createdForm.querySelectorAll("input")) as HTMLInputElement[]) : [];
    const getVal = (name: string) => inputs.find((i) => i.name === name)?.value;
    expect(getVal("csrfToken")).toBe("csrf-123");
    expect(getVal("email")).toBe("user@example.com");
    expect(getVal("password")).toBe("password123");
    expect(getVal("callbackUrl")).toBe("http://localhost:5173/");
  });

  it("OAuth buttons redirect to provider with callback", async () => {
    const originalLoc = window.location;
    Object.defineProperty(window, "location", {
      value: { href: "" },
      writable: true,
      configurable: true,
    });
    const SignupPage = (await import("../SignupPage")).default;
    render(
      <MemoryRouter>
        <SignupPage />
      </MemoryRouter>
    );
    fireEvent.click(screen.getByText(/Continue with Google/i));
    expect((window.location as any).href).toContain("http://localhost:5000/auth/signin/google");
    expect((window.location as any).href).toContain("callbackUrl=http%3A%2F%2Flocalhost%3A5173%2Fupload");
    Object.defineProperty(window, "location", { value: originalLoc, configurable: true });
  });

  it("toggle show/hide password changes input types", async () => {
    const SignupPage = (await import("../SignupPage")).default;
    render(
      <MemoryRouter>
        <SignupPage />
      </MemoryRouter>
    );
    const pw = screen.getByLabelText(/^password$/i) as HTMLInputElement;
    const pw2 = screen.getByLabelText(/confirm password/i) as HTMLInputElement;
    expect(pw.type).toBe("password");
    expect(pw2.type).toBe("password");
    const toggles = screen.getAllByRole("button").filter((b) => /show password|hide password/i.test(b.getAttribute("aria-label") || ""));
    fireEvent.click(toggles[0]);
    expect((screen.getByLabelText(/^password$/i) as HTMLInputElement).type).toBe("text");
    expect((screen.getByLabelText(/confirm password/i) as HTMLInputElement).type).toBe("text");
    fireEvent.click(toggles[0]);
    expect((screen.getByLabelText(/^password$/i) as HTMLInputElement).type).toBe("password");
    expect((screen.getByLabelText(/confirm password/i) as HTMLInputElement).type).toBe("password");
  });

  it("disables submit button while processing success path", async () => {
    const SignupPage = (await import("../SignupPage")).default;
    __api.post.mockResolvedValue({ data: {} });
    __api.get.mockResolvedValue({ data: { csrfToken: "t" } });
    vi.spyOn(HTMLFormElement.prototype, "submit").mockImplementation(function () {});
    render(
      <MemoryRouter>
        <SignupPage />
      </MemoryRouter>
    );
    fillForm({ name: "Alex", email: "a@b.com", pw: "password123", pw2: "password123", agree: true });
    const btn = screen.getByRole("button", { name: /create account/i });
    fireEvent.click(btn);
    await screen.findByText(/Account created! Signing you in/i);
    expect((btn as HTMLButtonElement).disabled).toBe(true);
  });
});
