import { useEffect, useLayoutEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import Topbar from "../components/Topbar";
import Footer from "../components/Footer";
import UploadDropzone from "../components/Upload/UploadDropzone";
import ToneSelect from "../components/Upload/ToneSelect";
import type { ToneOption } from "../components/Upload/ToneSelect";
import KeywordsInput from "../components/Upload/KeywordsInput";
import CaptionResult from "../components/Upload/CaptionResult";
import { generateCaption } from "../lib/caption";

type View = "mobile" | "tablet" | "desktop";
function useView(): View {
  const getView = () => {
    if (typeof window === "undefined") return "desktop" as View;
    if (window.matchMedia("(max-width: 767px)").matches) return "mobile";
    if (window.matchMedia("(min-width: 768px) and (max-width: 1023px)").matches)
      return "tablet";
    return "desktop";
  };
  const [view, setView] = useState<View>(getView);
  useEffect(() => {
    if (typeof window === "undefined") return;
    const mqs = [
      window.matchMedia("(max-width: 767px)"),
      window.matchMedia("(min-width: 768px) and (max-width: 1023px)"),
      window.matchMedia("(min-width: 1024px)"),
    ];
    const onChange = () => setView(getView());
    mqs.forEach((mq) => mq.addEventListener("change", onChange));
    return () => mqs.forEach((mq) => mq.removeEventListener("change", onChange));
  }, []);
  return view;
}

export default function UploadPage() {
  const view = useView();
  const navigate = useNavigate();

  const [collapsed, setCollapsed] = useState<boolean>(() => {
    const saved =
      typeof window !== "undefined"
        ? localStorage.getItem("sidebar-collapsed")
        : null;
    return saved ? saved === "1" : false;
  });
  useEffect(() => {
    localStorage.setItem("sidebar-collapsed", collapsed ? "1" : "0");
  }, [collapsed]);

  const [mobileOpen, setMobileOpen] = useState(false);
  useEffect(() => {
    if (view === "mobile") setMobileOpen(false);
    else if (view === "tablet" && localStorage.getItem("sidebar-collapsed") == null)
      setCollapsed(true);
  }, [view]);

  const sidebarWidth = useMemo(() => {
    if (view === "mobile") return mobileOpen ? "16rem" : "0rem";
    return collapsed ? "4rem" : "16rem";
  }, [view, collapsed, mobileOpen]);

  const isOverlay = view === "mobile";

  const [file, setFile] = useState<File | null>(null);
  const [tone, setTone] = useState<ToneOption>("casual");
  const [keywords, setKeywords] = useState<string[]>([]);
  const [caption, setCaption] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const [usedTone, setUsedTone] = useState<ToneOption | null>(null);
  const [usedKeywords, setUsedKeywords] = useState<string[] | null>(null);

  const [footerH, setFooterH] = useState(0);

  // measure footer height dynamically
  useLayoutEffect(() => {
    if (typeof window === "undefined") return;
    const footer = document.querySelector("footer");
    const update = () =>
      setFooterH(footer ? footer.getBoundingClientRect().height : 0);
    update();

    let ro: ResizeObserver | null = null;
    if (footer && "ResizeObserver" in window) {
      ro = new ResizeObserver(update);
      ro.observe(footer);
    }
    window.addEventListener("resize", update);
    return () => {
      window.removeEventListener("resize", update);
      if (ro && footer) ro.disconnect();
    };
  }, []);

  async function onGenerate() {
    if (!file) return;
    setLoading(true);
    try {
      const text = await generateCaption(tone, keywords);
      setCaption(text);
      setUsedTone(tone);
      setUsedKeywords(keywords);
    } finally {
      setLoading(false);
    }
  }

  const onRegenerate = async () => {
    await onGenerate();
  };

  const onUse = () => {
    navigate("/editor", { state: { caption, tone: usedTone, keywords: usedKeywords } });
  };

  return (
    <div
      className="bg-[#0C0F14] text-white overflow-x-hidden"
      style={{ "--sidebar-w": sidebarWidth } as React.CSSProperties}
    >
      <Sidebar
        mode={isOverlay ? "overlay" : "docked"}
        open={isOverlay ? mobileOpen : true}
        collapsed={isOverlay ? false : collapsed}
        onToggle={() =>
          isOverlay ? setMobileOpen((o) => !o) : setCollapsed((v) => !v)
        }
        onClose={() => setMobileOpen(false)}
      />

      <div
        className="min-h-screen flex flex-col transition-[padding-left] duration-500 ease-[cubic-bezier(0.25,0.8,0.25,1)]"
        style={{ paddingLeft: isOverlay ? 0 : "var(--sidebar-w)" }}
      >
        <Topbar
          isOverlay={isOverlay}
          mobileOpen={mobileOpen}
          onMobileToggle={() => setMobileOpen((o) => !o)}
        />

        {/* scrollable main area with bottom padding for footer */}
        <main
          className="flex-grow pt-16 px-0 bg-black overflow-y-auto"
          style={{
            paddingBottom: `calc(${footerH}px + env(safe-area-inset-bottom))`,
          }}
        >
          <div className="w-full">
            <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight mb-6 px-4 md:px-6">
              Upload & Generate Caption
            </h1>

            <div className="grid md:grid-cols-2 gap-0 md:gap-6 min-h-[80vh] items-stretch">
              <section className="flex flex-col h-full min-h-[60vh] md:min-h-[70vh] bg-white/[0.04] border border-white/10">
                <div className="flex-1 min-h-0 p-6 md:p-8">
                  <div className="h-full min-h-[420px] md:min-h-[560px]">
                    <UploadDropzone
                      className="h-full"
                      onUpload={(f, previewUrl) => {
                        setFile(f);
                        setCaption(null);
                        setUsedTone(null);
                        setUsedKeywords(null);
                        void previewUrl;
                      }}
                    />
                  </div>
                </div>
              </section>

              <aside className="self-stretch bg-white/[0.04] border border-white/10 p-6 md:p-8">
                <h3 className="text-lg font-semibold mb-4">Parameters</h3>
                <div className="space-y-5">
                  <ToneSelect value={tone} onChange={setTone} />
                  <KeywordsInput value={keywords} onChange={setKeywords} max={8} />
                </div>

                <button
                  onClick={onGenerate}
                  disabled={!file || loading}
                  className="mt-6 w-full rounded-xl px-4 py-3 border border-white/15 bg-[#364881] hover:bg-[#4d5ca1] transition shadow-sm disabled:opacity-50"
                >
                  {loading ? (
                    <span className="inline-flex items-center gap-2">
                      <span className="h-4 w-4 rounded-full border-2 border-white/40 border-t-transparent animate-spin" />
                      Generating…
                    </span>
                  ) : (
                    "Generate Caption"
                  )}
                </button>

                <p className="mt-3 text-xs text-white/60">
                  Supported: PNG, JPG, JPEG. One image only.
                </p>
              </aside>
            </div>

            {caption && (
              <div className="mt-6">
                <CaptionResult
                  caption={caption}
                  tone={(usedTone ?? tone) as string}
                  onRegenerate={onRegenerate}
                  onUse={onUse}
                />
              </div>
            )}
          </div>
        </main>

        <Footer />
      </div>
    </div>
  );
}
