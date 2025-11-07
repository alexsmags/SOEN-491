import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { vi, beforeEach, describe, it, expect } from "vitest";

if (!window.matchMedia) {
  (window as any).matchMedia = (q: string) => ({
    matches: false,
    media: q,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  });
}

const fetchMediaFileAsFile = vi.fn(
  async (_id: string, _mime: string, _scope: string) =>
    new Blob(["mock"], { type: "image/png" })
);
const fetchMediaMeta = vi.fn(async (id: string) => ({
  id,
  caption: "Server caption",
  keywords: ["tag1", "tag2"],
  mime: "image/png",
  imageUrl: "https://example.com/img.png",
  fontFamily: "Inter",
  fontSize: 24,
  textColor: "#ffffff",
  align: "center",
  showBg: true,
  bgColor: "#000000",
  bgOpacity: 0.5,
  posX: 10,
  posY: 20,
}));
vi.mock("../../services/media", () => ({
  fetchMediaFileAsFile,
  fetchMediaMeta,
}));

const composeCaptionedPNG = vi.fn(
  async (_file: File | Blob, _opts: Record<string, unknown>) =>
    new Blob(["png"], { type: "image/png" })
);
vi.mock("../../lib/captionCompose", () => ({
  composeCaptionedPNG,
}));

vi.mock("../../hooks/useView", () => ({
  useView: () => "desktop",
}));

const imagesMock = [
  {
    id: "img-1",
    imageUrl: "https://example.com/a.png",
    mime: "image/png",
    caption: "Local caption",
    keywords: ["k1", "k2"],
    fontFamily: "Inter",
    fontSize: 18,
    textColor: "#fff",
    align: "center",
    showBg: true,
    bgColor: "#000",
    bgOpacity: 0.4,
    posX: 0,
    posY: 0,
  },
];
vi.mock("../../hooks/useWorkspaceImages", () => ({
  useWorkspaceImages: () => ({
    images: imagesMock,
    loading: false,
    error: null,
    page: 1,
    hasNext: false,
    prevPage: vi.fn(),
    nextPage: vi.fn(),
    reload: vi.fn(),
  }),
}));

vi.mock("../../hooks/useComposedPreview", () => ({
  useComposedPreview: () => ({ url: "blob://preview", composing: false }),
}));

vi.mock("../../components/Layout/Sidebar", () => ({
  default: (props: any) => (
    <div data-testid="sidebar">
      <button
        data-testid="sidebar-toggle"
        onClick={() => props.onToggle?.()}
        aria-label="toggle-sidebar"
      >
        Toggle
      </button>
    </div>
  ),
}));
vi.mock("../../components/Layout/Topbar", () => ({
  default: () => <div data-testid="topbar">Topbar</div>,
}));
vi.mock("../../components/Layout/Footer", () => ({
  default: () => <div data-testid="footer">Footer</div>,
}));

let externalOnSelect: ((id: string | null) => void) | null = null;
vi.mock("../../components/Share/WorkspaceImagePicker", () => ({
  __esModule: true,
  default: (props: any) => {
    externalOnSelect = props.onChange;
    return (
      <div data-testid="picker">
        <button
          data-testid="pick-first"
          onClick={() => props.onChange?.("img-1")}
        >
          Pick
        </button>
      </div>
    );
  },
}));

let openShareFn: (() => void) | null = null;
vi.mock("../../components/Share/PreviewWithShare", () => ({
  __esModule: true,
  default: (props: any) => {
    openShareFn = props.onShare;
    return (
      <div data-testid="preview">
        <button data-testid="open-share" onClick={() => props.onShare?.()}>
          Open Share
        </button>
        {props.isLoading ? <span>Loading…</span> : <span>Ready</span>}
      </div>
    );
  },
}));

let shareSystemHandler: (() => void) | null = null;
vi.mock("../../components/Share/Modals/ShareModal", () => ({
  ShareModal: (props: any) => {
    shareSystemHandler = props.onShareSystem;
    return props.open ? (
      <div data-testid="share-modal">
        <button
          data-testid="system-share"
          onClick={() => props.onShareSystem?.()}
        >
          System Share
        </button>
        <button data-testid="close-share" onClick={() => props.onClose?.()}>
          Close
        </button>
      </div>
    ) : null;
  },
}));

const RealAlert = window.alert;
const RealLocation = window.location;
const RealNavigator = window.navigator;

beforeEach(() => {
  vi.resetAllMocks();
  window.alert = vi.fn() as any;
  Object.defineProperty(window, "location", {
    value: { assign: vi.fn(), href: "" },
    writable: true,
  });
  Object.assign(window.navigator, {
    canShare: vi.fn(() => true),
    share: vi.fn(async () => {}),
  });
  externalOnSelect = null;
  openShareFn = null;
  shareSystemHandler = null;
});

afterAll(() => {
  window.alert = RealAlert;
  Object.defineProperty(window, "location", { value: RealLocation });
  Object.assign(window.navigator, RealNavigator);
});

async function renderSharePage() {
  const mod = await import("../SharePage");
  const SharePage = mod.default;
  return render(
    <MemoryRouter>
      <SharePage />
    </MemoryRouter>
  );
}

describe("SharePage", () => {
  it("renders and shows layout parts", async () => {
    await renderSharePage();
    expect(screen.getByTestId("sidebar")).toBeInTheDocument();
    expect(screen.getByTestId("topbar")).toBeInTheDocument();
    expect(screen.getByTestId("footer")).toBeInTheDocument();
    expect(screen.getByTestId("preview")).toBeInTheDocument();
    expect(screen.getByTestId("picker")).toBeInTheDocument();
  });

  it("picks an image, opens share, and completes system share", async () => {
    await renderSharePage();
    fireEvent.click(screen.getByTestId("pick-first"));
    await waitFor(() => expect(externalOnSelect).not.toBeNull());
    fireEvent.click(screen.getByTestId("open-share"));
    await waitFor(() => expect(shareSystemHandler).not.toBeNull());
    fireEvent.click(screen.getByTestId("system-share"));
    await waitFor(() => {
      expect(fetchMediaMeta).toHaveBeenCalledWith("img-1");
      expect(fetchMediaFileAsFile).toHaveBeenCalledWith(
        "img-1",
        "image/png",
        "workspace-image"
      );
      expect(composeCaptionedPNG).toHaveBeenCalled();
      expect((navigator as any).share).toHaveBeenCalled();
    });
  });

  it("falls back with alert when navigator.share is unavailable", async () => {
    (navigator as any).canShare = vi.fn(() => false);
    (navigator as any).share = undefined;
    await renderSharePage();
    fireEvent.click(screen.getByTestId("pick-first"));
    fireEvent.click(screen.getByTestId("open-share"));
    await waitFor(() => expect(shareSystemHandler).not.toBeNull());
    fireEvent.click(screen.getByTestId("system-share"));
    await waitFor(() => {
      expect(window.alert).toHaveBeenCalled();
      expect(composeCaptionedPNG).toHaveBeenCalled();
    });
  });
});
