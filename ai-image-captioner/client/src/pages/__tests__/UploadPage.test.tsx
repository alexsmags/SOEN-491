import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";

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

const navigateMock = vi.fn();
vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual<any>("react-router-dom");
  return { ...actual, useNavigate: () => navigateMock };
});

vi.stubGlobal("ResizeObserver", class {
  observe() {}
  unobserve() {}
  disconnect() {}
} as any);

vi.stubGlobal("FormData", class {
  private map = new Map<string, any>();
  append(k: string, v: any) {
    this.map.set(k, v);
  }
  get(k: string) {
    return this.map.get(k);
  }
} as any);

const sidebarSpy = vi.fn();
vi.mock("../../components/Layout/Sidebar", () => ({
  __esModule: true,
  default: (props: any) => {
    sidebarSpy(props);
    return <aside data-testid="sidebar" data-mode={props.mode} data-open={props.open} data-collapsed={props.collapsed} />;
  },
}));

vi.mock("../../components/Layout/Topbar", () => ({
  __esModule: true,
  default: ({ isOverlay, mobileOpen, onMobileToggle }: any) => (
    <header>
      <button onClick={onMobileToggle} aria-label={mobileOpen ? "close menu" : "open menu"}>
        {isOverlay ? "overlay" : "docked"}
      </button>
    </header>
  ),
}));

vi.mock("../../components/Layout/Footer", () => ({
  __esModule: true,
  default: () => <footer>f</footer>,
}));

let uploadCb: ((f: File) => void) | null = null;
let uploadErrCb: ((m: string) => void) | null = null;
vi.mock("../../components/Upload/UploadDropzone", () => ({
  __esModule: true,
  default: ({ onUpload, onError, className }: any) => {
    uploadCb = onUpload;
    uploadErrCb = onError;
    return (
      <div>
        <div data-testid="dropzone" className={className} />
        <button onClick={() => onUpload(new File(["a"], "x.png", { type: "image/png" }))}>mock upload</button>
        <button onClick={() => onError("bad file")}>mock upload error</button>
      </div>
    );
  },
}));

vi.mock("../../components/Upload/ToneSelect", () => ({ __esModule: true, default: () => null }));
vi.mock("../../components/Upload/KeywordsInput", () => ({ __esModule: true, default: () => null }));
vi.mock("../../components/Upload/StyleSelection", () => ({ __esModule: true, default: () => <div data-testid="style" /> }));
vi.mock("../../components/Upload/HashtagsSelection", () => ({ __esModule: true, default: () => <div data-testid="hashtags" /> }));
vi.mock("../../components/Upload/MentionsLocationSection", () => ({ __esModule: true, default: () => <div data-testid="mentions" /> }));
vi.mock("../../components/Upload/EmojisSection", () => ({ __esModule: true, default: () => <div data-testid="emojis" /> }));

let lastCaptionResultProps: any = null;
vi.mock("../../components/Upload/CaptionResult", () => ({
  __esModule: true,
  default: (props: any) => {
    lastCaptionResultProps = props;
    return (
      <div>
        <div data-testid="caption-text">{props.caption}</div>
        <button onClick={props.onRegenerate}>regenerate</button>
        <button onClick={props.onUse}>use</button>
        <button onClick={props.onSave} disabled={!props.canSave || props.saveBusy}>save</button>
        {props.saveError ? <div data-testid="save-error">{props.saveError}</div> : null}
        {props.saveDone ? <div data-testid="save-done">saved</div> : null}
      </div>
    );
  },
}));

let lastModalOpen = false;
let lastModalMsg: string | null = null;
vi.mock("../../components/Upload/Modals/UploadErrorModal.tsx", () => ({
  __esModule: true,
  default: ({ open, message, onClose }: any) => {
    lastModalOpen = open;
    lastModalMsg = message ?? null;
    return open ? (
      <div role="dialog">
        <div>{message}</div>
        <button onClick={onClose}>close</button>
      </div>
    ) : null;
  },
}));

const gen = vi.fn();
vi.mock("../../lib/caption", () => ({
  __esModule: true,
  generateCaption: (...args: any[]) => gen(...args),
}));

function clickMockUpload() {
  const btn = screen.getAllByRole("button", { name: /mock upload/i })[0];
  fireEvent.click(btn);
}
function clickMockUploadError() {
  const btn = screen.getAllByRole("button", { name: /mock upload error/i })[0];
  fireEvent.click(btn);
}

describe("UploadPage", () => {
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
    document.body.innerHTML = "";
    navigateMock.mockReset();
    gen.mockReset();
    uploadCb = null;
    uploadErrCb = null;
    lastCaptionResultProps = null;
    lastModalOpen = false;
    lastModalMsg = null;
    global.fetch = vi.fn(async () => ({ ok: true, json: async () => ({ id: "123" }) })) as any;
  });

  it("renders layout and disabled generate button initially", async () => {
    const UploadPage = (await import("../UploadPage")).default;
    render(
      <MemoryRouter>
        <UploadPage />
      </MemoryRouter>
    );
    expect(screen.getByTestId("upload-page")).toBeInTheDocument();
    const btn = screen.getByTestId("generate-btn") as HTMLButtonElement;
    expect(btn.disabled).toBe(true);
    expect(screen.getByTestId("sidebar")).toHaveAttribute("data-mode", "docked");
  });

  it("mobile view sets overlay sidebar and allows toggling", async () => {
    updateView("mobile");
    const UploadPage = (await import("../UploadPage")).default;
    render(
      <MemoryRouter>
        <UploadPage />
      </MemoryRouter>
    );
    expect(screen.getByTestId("sidebar")).toHaveAttribute("data-mode", "overlay");
    const toggle = screen.getByRole("button", { name: /open menu/i });
    fireEvent.click(toggle);
    expect(screen.getByRole("button", { name: /close menu/i })).toBeInTheDocument();
  });

  it("tablet view defaults collapsed when no saved state", async () => {
    updateView("tablet");
    const UploadPage = (await import("../UploadPage")).default;
    render(
      <MemoryRouter>
        <UploadPage />
      </MemoryRouter>
    );
    expect(screen.getByTestId("sidebar")).toHaveAttribute("data-collapsed", "false");
  });

  it("uploads a file, enables generate, and shows caption on success", async () => {
    const UploadPage = (await import("../UploadPage")).default;
    gen.mockResolvedValue("hello caption");
    render(
      <MemoryRouter>
        <UploadPage />
      </MemoryRouter>
    );
    expect(screen.getByTestId("generate-btn")).toBeDisabled();
    clickMockUpload();
    await waitFor(() => expect(screen.getByTestId("generate-btn")).not.toBeDisabled());
    fireEvent.click(screen.getByTestId("generate-btn"));
    await screen.findByText("hello caption");
    expect(gen).toHaveBeenCalledTimes(1);
  });

  it("shows error message when generation fails", async () => {
    const UploadPage = (await import("../UploadPage")).default;
    gen.mockRejectedValue(new Error("nope"));
    render(
      <MemoryRouter>
        <UploadPage />
      </MemoryRouter>
    );
    clickMockUpload();
    fireEvent.click(screen.getByTestId("generate-btn"));
    expect(await screen.findByTestId("error-text")).toHaveTextContent(/nope/i);
  });

  it("clear image resets state and hides caption", async () => {
    const UploadPage = (await import("../UploadPage")).default;
    gen.mockResolvedValue("cap");
    render(
      <MemoryRouter>
        <UploadPage />
      </MemoryRouter>
    );
    clickMockUpload();
    fireEvent.click(screen.getByTestId("generate-btn"));
    await screen.findByText("cap");
    const clearBtn = screen.getByRole("button", { name: /clear image/i });
    fireEvent.click(clearBtn);
    await waitFor(() => expect(screen.queryByTestId("caption-text")).toBeNull());
  });

  it("passes correct options to generateCaption", async () => {
    const UploadPage = (await import("../UploadPage")).default;
    gen.mockResolvedValue("x");
    render(
      <MemoryRouter>
        <UploadPage />
      </MemoryRouter>
    );
    clickMockUpload();
    fireEvent.click(screen.getByTestId("generate-btn"));
    await screen.findByText("x");
    const call = gen.mock.calls[0];
    expect(call[1]).toBe("casual");
    expect(call[2]).toEqual([]);
    expect(call[3]).toMatchObject({
      includeHashtags: true,
      includeMentions: false,
      voice: "neutral",
      length: "medium",
      includeEmojis: true,
    });
  });

  it("save to workspace posts FormData and marks saved", async () => {
    const UploadPage = (await import("../UploadPage")).default;
    gen.mockResolvedValue("cap");
    render(
      <MemoryRouter>
        <UploadPage />
      </MemoryRouter>
    );
    clickMockUpload();
    fireEvent.click(screen.getByTestId("generate-btn"));
    await screen.findByText("cap");
    fireEvent.click(screen.getByText("save"));
    await screen.findByTestId("save-done");
    expect(global.fetch).toHaveBeenCalledWith(expect.stringContaining("/api/media"), expect.objectContaining({ method: "POST" }));
  });

  it("save error shows message", async () => {
    const UploadPage = (await import("../UploadPage")).default;
    gen.mockResolvedValue("cap");
    (global.fetch as any).mockResolvedValueOnce({ ok: false, status: 500, text: async () => "boom" });
    render(
      <MemoryRouter>
        <UploadPage />
      </MemoryRouter>
    );
    clickMockUpload();
    fireEvent.click(screen.getByTestId("generate-btn"));
    await screen.findByText("cap");
    fireEvent.click(screen.getByText("save"));
    await screen.findByTestId("save-error");
    expect(screen.getByTestId("save-error")).toHaveTextContent(/boom|Save failed/i);
  });

  it("use opens editor with state when no saved id", async () => {
    const UploadPage = (await import("../UploadPage")).default;
    gen.mockResolvedValue("cap");
    render(
      <MemoryRouter>
        <UploadPage />
      </MemoryRouter>
    );
    clickMockUpload();
    fireEvent.click(screen.getByTestId("generate-btn"));
    await screen.findByText("cap");
    fireEvent.click(screen.getByText("use"));
    expect(navigateMock).toHaveBeenCalledWith("/editor", expect.objectContaining({ state: expect.any(Object) }));
  });

  it("upload error opens modal", async () => {
    const UploadPage = (await import("../UploadPage")).default;
    render(
      <MemoryRouter>
        <UploadPage />
      </MemoryRouter>
    );
    clickMockUploadError();
    await waitFor(() => expect(lastModalOpen).toBe(true));
    expect(lastModalMsg).toBe("bad file");
  });
});
