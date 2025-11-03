import { useEffect, useLayoutEffect, useMemo, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "../components/Layout/Sidebar";
import Topbar from "../components/Layout/Topbar";
import Footer from "../components/Layout/Footer";
import UploadDropzone from "../components/Upload/UploadDropzone";
import ToneSelect, { type ToneOption } from "../components/Upload/ToneSelect";
import KeywordsInput from "../components/Upload/KeywordsInput";
import CaptionResult from "../components/Upload/CaptionResult";
import { generateCaption } from "../lib/caption";

import StyleSection from "../components/Upload/StyleSelection";
import HashtagsSection from "../components/Upload/HashtagsSelection";
import MentionsLocationSection from "../components/Upload/MentionsLocationSection";
import EmojisSection from "../components/Upload/EmojisSection";
import UploadErrorModal from "../components/Upload/Modals/UploadErrorModal.tsx";
import type { Placement, Voice, LengthPref } from "../components/Upload/types";

type View = "mobile" | "tablet" | "desktop";

function useView(): View {
  const getView = () => {
    if (typeof window === "undefined") return "desktop" as View;
    if (window.matchMedia("(max-width: 767px)").matches) return "mobile";
    if (window.matchMedia("(min-width: 768px) and (max-width: 1023px)").matches) return "tablet";
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

const SERVER_URL =
  import.meta.env.VITE_SERVER_URL ??
  import.meta.env.VITE_API_BASE ??
  "";

function offsetTopWithin(container: HTMLElement, target: HTMLElement): number {
  let top = 0;
  let node: HTMLElement | null = target;
  while (node && node !== container) {
    top += node.offsetTop;
    node = node.offsetParent as HTMLElement | null;
  }
  return top;
}

function isScrollable(el: HTMLElement) {
  return el.scrollHeight > el.clientHeight;
}

function isInView(container: HTMLElement | Window, target: HTMLElement, margin = 24) {
  const tRect = target.getBoundingClientRect();
  const cTop = container instanceof Window ? 0 : (container as HTMLElement).getBoundingClientRect().top;
  const cBottom =
    container instanceof Window
      ? window.innerHeight
      : (container as HTMLElement).getBoundingClientRect().bottom;

  return tRect.top >= cTop + margin && tRect.bottom <= cBottom - margin;
}

export default function UploadPage() {
  const view = useView();
  const navigate = useNavigate();

  const [collapsed, setCollapsed] = useState<boolean>(() => {
    const saved = typeof window !== "undefined" ? localStorage.getItem("sidebar-collapsed") : null;
    return saved ? saved === "1" : false;
  });

  useEffect(() => {
    localStorage.setItem("sidebar-collapsed", collapsed ? "1" : "0");
  }, [collapsed]);

  const [mobileOpen, setMobileOpen] = useState(false);
  useEffect(() => {
    if (view === "mobile") setMobileOpen(false);
    else if (view === "tablet" && localStorage.getItem("sidebar-collapsed") == null) setCollapsed(true);
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
  const [genError, setGenError] = useState<string | null>(null);

  const [saveBusy, setSaveBusy] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveDone, setSaveDone] = useState(false);

  const [savedMediaId, setSavedMediaId] = useState<string | null>(null);

  const [usedTone, setUsedTone] = useState<ToneOption | null>(null);
  const [usedKeywords, setUsedKeywords] = useState<string[] | null>(null);

  const [includeHashtags, setIncludeHashtags] = useState(true);
  const [includeMentions, setIncludeMentions] = useState(false);
  const [location, setLocation] = useState("");

  const [hashtags, setHashtags] = useState<string[]>([]);

  const [handles, setHandles] = useState<string[]>([]);

  const [includeEmojis, setIncludeEmojis] = useState(true);
  const [emojiCount, setEmojiCount] = useState<number>(2);

  const [hashtagsPlacement, setHashtagsPlacement] = useState<Placement>("end");
  const [mentionsPlacement, setMentionsPlacement] = useState<Placement>("end");
  const [emojiPlacement, setEmojiPlacement] = useState<Placement>("end");

  const [voice, setVoice] = useState<Voice>("neutral");
  const [lengthPref, setLengthPref] = useState<LengthPref>("medium");

  const [footerH, setFooterH] = useState(0);
  const [dropzoneKey, setDropzoneKey] = useState(0);

  const mainRef = useRef<HTMLDivElement | null>(null);
  const captionRef = useRef<HTMLDivElement | null>(null);

  const [scrollKey, setScrollKey] = useState(0);

  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadModalOpen, setUploadModalOpen] = useState(false);

  const openUploadError = (msg: string) => {
    setUploadError(msg);
    setUploadModalOpen(true);
  };

  useLayoutEffect(() => {
    if (typeof window === "undefined") return;
    const footer = document.querySelector("footer");
    const update = () => setFooterH(footer ? footer.getBoundingClientRect().height : 0);
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

  const scrollToCaption = () => {
    const containerEl = mainRef.current as HTMLElement | null;
    const target = captionRef.current as HTMLElement | null;
    if (!target) return;

    const HEADER_OFFSET = 16 /* pt-16 */ + 12 /* comfy gap */;

    if (containerEl && isScrollable(containerEl)) {
      if (!isInView(containerEl, target, 12)) {
        const topWithin = offsetTopWithin(containerEl, target);
        containerEl.scrollTo({ top: Math.max(0, topWithin - HEADER_OFFSET), behavior: "smooth" });
      }
    } else {
      if (!isInView(window, target, 12)) {
        const rect = target.getBoundingClientRect();
        const absoluteTop = rect.top + window.scrollY;
        window.scrollTo({ top: Math.max(0, absoluteTop - HEADER_OFFSET), behavior: "smooth" });
      }
    }
  };

  useEffect(() => {
    if (!caption) return;
    scrollToCaption();
    const t1 = setTimeout(scrollToCaption, 50);
    const t2 = setTimeout(scrollToCaption, 200);
    const t3 = setTimeout(scrollToCaption, 400);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, [scrollKey, caption]);

  async function onGenerate() {
    if (!file) return;
    setLoading(true);
    try {
      const keywordsToSend = keywords.map((k) => k.replace(/^#/, ""));
      const hashtagsToSend = hashtags.map((h) => h.replace(/^#/, ""));

      const text = await generateCaption(file, tone, keywordsToSend, {
        includeHashtags,
        includeMentions,
        location: location.trim(),
        handles: handles.map((h) => h.replace(/^@+/, "")),
        voice,
        length: lengthPref,
        hashtags: hashtagsToSend,

        includeEmojis,
        emojiCount,
        emojiPlacement,
        hashtagsPlacement,
        mentionsPlacement,
      });

      setCaption(text);
      setUsedTone(tone);
      setUsedKeywords(keywordsToSend);
      setSaveDone(false);
      setSaveError(null);
      setGenError(null);
      setScrollKey((k) => k + 1);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Caption failed";
      setGenError(msg);
      setCaption(null);
    } finally {
      setLoading(false);
    }
  }

  const onRegenerate = async () => {
    await onGenerate();
  };

  async function onSaveToWorkspace() {
    if (!file || !caption) return;

    if (saveDone || savedMediaId) {
      setSaveError("Already saved");
      return;
    }

    setSaveBusy(true);
    setSaveError(null);
    setSaveDone(false);
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("caption", caption);
      if (usedTone) fd.append("tone", usedTone);
      if (usedKeywords?.length) fd.append("keywords", JSON.stringify(usedKeywords));

      const res = await fetch(`${SERVER_URL}/api/media`, {
        method: "POST",
        body: fd,
        credentials: "include",
      });

      if (!res.ok) {
        const msg = await res.text().catch(() => "");
        throw new Error(msg || `Save failed (${res.status})`);
      }

      const data = await res.json();
      const newId: string | undefined = data?.id || data?.item?.id || data?._id;

      if (newId) setSavedMediaId(newId);
      setSaveDone(true);
    } catch (err: unknown) {
      setSaveError(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSaveBusy(false);
    }
  }

  const onOpenEditor = () => {
    if (!file && !savedMediaId) return;

    if (savedMediaId) {
      navigate(`/editor?id=${encodeURIComponent(savedMediaId)}`);
      return;
    }

    navigate("/editor", {
      state: {
        tempMedia: {
          file: file!,
          caption: caption ?? "",
          tone: usedTone ?? tone,
          keywords: usedKeywords ?? keywords,
        },
      },
    });
  };

  const clearSelection = () => {
    setFile(null);
    setCaption(null);
    setUsedTone(null);
    setUsedKeywords(null);
    setSaveDone(false);
    setSaveError(null);
    setSavedMediaId(null);
    setHashtags([]);
    setHandles([]);
    setGenError(null);
    setDropzoneKey((k) => k + 1);
  };

  return (
    <div
      className="bg-[#0C0F14] text-white overflow-x-hidden"
      style={{ "--sidebar-w": sidebarWidth } as React.CSSProperties}
      data-testid="upload-page"
    >
      <Sidebar
        mode={isOverlay ? "overlay" : "docked"}
        open={isOverlay ? mobileOpen : true}
        collapsed={isOverlay ? false : collapsed}
        onToggle={() => (isOverlay ? setMobileOpen((o) => !o) : setCollapsed((v) => !v))}
        onClose={() => setMobileOpen(false)}
      />

      <div
        className="min-h-screen flex flex-col transition-[padding-left] duration-500 ease-[cubic-bezier(0.25,0.8,0.25,1)]"
        style={{ paddingLeft: isOverlay ? 0 : "var(--sidebar-w)" }}
      >
        <Topbar isOverlay={isOverlay} mobileOpen={mobileOpen} onMobileToggle={() => setMobileOpen((o) => !o)} />

        <main
          ref={mainRef}
          className="flex-grow pt-16 px-0 bg-black overflow-y-auto"
          style={{ paddingBottom: `calc(${footerH}px + env(safe-area-inset-bottom))` }}
        >
          <div className="w-full">
            <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight mb-6 px-4 md:px-6">
              Upload & Generate Caption
            </h1>

            <div className="grid md:grid-cols-2 gap-0 md:gap-6 min-h-[80vh] items-stretch">
              <section className="flex flex-col h-full min-h-[60vh] md:minh-[70vh] bg-white/[0.04] border border-white/10">
                <div className="flex-1 min-h-0 p-6 md:p-8">
                  <div className="h-full min-h-[420px] md:min-h-[560px] relative">
                    {file && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          clearSelection();
                        }}
                        aria-label="Clear image"
                        title="Clear image"
                        className="absolute right-3 top-3 z-20 h-8 w-8 rounded-full bg-black/60 hover:bg-black/80 border border-white/20 flex items-center justify-center text-white"
                        data-testid="clear-image"
                      >
                        <span className="text-lg leading-none">×</span>
                      </button>
                    )}

                    {/* Dropzone */}
                    <UploadDropzone
                      key={dropzoneKey}
                      className={`h-full ${file ? "pointer-events-none" : ""}`}
                      onUpload={(f /* file */) => {
                        if (!f) return;
                        setFile(f);
                        setCaption(null);
                        setUsedTone(null);
                        setUsedKeywords(null);
                        setSaveDone(false);
                        setSaveError(null);
                        setSavedMediaId(null);
                        setGenError(null);
                      }}
                      onError={(msg) => openUploadError(msg)}
                    />
                  </div>
                </div>
              </section>

              <aside className="self-stretch bg-white/[0.04] border border-white/10 p-6 md:p-8">
                <h3 className="text-lg font-semibold mb-4">Parameters</h3>

                <div className="space-y-6">
                  {/* Style */}
                  <StyleSection
                    tone={tone}
                    onToneChange={setTone}
                    voice={voice}
                    onVoiceChange={setVoice}
                    lengthPref={lengthPref}
                    onLengthPrefChange={setLengthPref}
                    keywords={keywords}
                    onKeywordsChange={setKeywords}
                    ToneSelect={ToneSelect}
                    KeywordsInput={KeywordsInput}
                  />

                  {/* Hashtags */}
                  <HashtagsSection
                    hashtags={hashtags}
                    onHashtagsChange={setHashtags}
                    includeHashtags={includeHashtags}
                    onIncludeHashtagsChange={setIncludeHashtags}
                    placement={hashtagsPlacement}
                    onPlacementChange={setHashtagsPlacement}
                    KeywordsInput={KeywordsInput}
                  />

                  {/* Mentions & Location */}
                  <MentionsLocationSection
                    includeMentions={includeMentions}
                    onIncludeMentionsChange={setIncludeMentions}
                    handles={handles}
                    onHandlesChange={setHandles}
                    location={location}
                    onLocationChange={setLocation}
                    placement={mentionsPlacement}
                    onPlacementChange={setMentionsPlacement}
                    KeywordsInput={KeywordsInput}
                  />

                  {/* Emojis */}
                  <EmojisSection
                    includeEmojis={includeEmojis}
                    onIncludeEmojisChange={setIncludeEmojis}
                    emojiCount={emojiCount}
                    onEmojiCountChange={setEmojiCount}
                    placement={emojiPlacement}
                    onPlacementChange={setEmojiPlacement}
                  />

                  {/* Actions */}
                  <section className="space-y-2">
                    <button
                      onClick={onGenerate}
                      disabled={!file || loading}
                      className="w-full rounded-xl px-4 py-3 border border-white/15 bg-[#364881] hover:bg-[#4d5ca1] transition shadow-sm disabled:opacity-50"
                      data-testid="generate-btn"
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

                    {genError && <p className="text-xs text-red-400" data-testid="error-text">{genError}</p>}
                    <p className="text-xs text-white/60">Supported: PNG, JPG, JPEG. One image only.</p>
                  </section>
                </div>
              </aside>
            </div>

            {caption && (
              <div
                ref={captionRef}
                className="mt-6 px-4 md:px-6"
                data-testid="caption-output"
                aria-live="polite"
              >
                <CaptionResult
                  caption={caption}
                  tone={(usedTone ?? tone) as string}
                  onRegenerate={onRegenerate}
                  onUse={onOpenEditor}
                  onSave={onSaveToWorkspace}
                  canSave={Boolean(file && caption)}
                  saveBusy={saveBusy}
                  saveDone={saveDone}
                  saveError={saveError}
                />
              </div>
            )}
          </div>
        </main>

        <Footer />
      </div>

      {/* Upload error modal */}
      <UploadErrorModal
        open={uploadModalOpen}
        message={uploadError}
        onClose={() => setUploadModalOpen(false)}
      />
    </div>
  );
}
