import { useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { CheckCircle } from "lucide-react";

import Sidebar from "../components/Sidebar";
import Topbar from "../components/Topbar";
import Footer from "../components/Footer";
import EditorPreview from "../components/Editor/EditorPreview";
import EditorControls from "../components/Editor/EditorControls";

import { useView } from "../hooks/useView";
import { useCanvasFrame } from "../hooks/useCanvasFrame";
import { computeBubbleStyle } from "../utils/computeBubbleStyle";
import { PALETTE } from "../constants/color";
import { fetchMedia, saveMedia, type MediaItem } from "../services/mediaApi";

const SERVER_URL = import.meta.env.VITE_SERVER_URL ?? "";

const PICKER_KEY = "workspace-picker";
function setPickerFlag() {
  if (typeof window === "undefined") return;
  const payload = { from: "editor", ts: Date.now() };
  sessionStorage.setItem(PICKER_KEY, JSON.stringify(payload));
}

type TempMediaState = {
  file: File;
  caption?: string;
  tone?: string;
  keywords?: string[];
};

export default function EditorPage() {
  const view = useView();
  const [search, setSearch] = useSearchParams();
  const navigate = useNavigate();
  const location = useLocation();

  const mediaId = search.get("id");

  const tempMedia =
    (location.state as { tempMedia?: TempMediaState } | null | undefined)?.tempMedia;

  const [collapsed, setCollapsed] = useState<boolean>(() => {
    const saved =
      typeof window !== "undefined"
        ? localStorage.getItem("sidebar-collapsed")
        : null;
    return saved ? saved === "1" : false;
  });
  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("sidebar-collapsed", collapsed ? "1" : "0");
    }
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

  const {
    nat,
    setNat,
    box,
    scale,
    frameRef,
    bubbleRef,
    posFrame,
    setPosFrame,
    clampPosition,
    onBubblePointerDown,
    onBubblePointerMove,
    onBubblePointerUp,
  } = useCanvasFrame();

  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [caption, setCaption] = useState<string>("");

  const [fontFamily, setFontFamily] = useState("Arial");
  const [fontSize, setFontSize] = useState(24);
  const [textColor, setTextColor] = useState("#FFFFFF");
  const [align, setAlign] = useState<"left" | "center" | "right">("center");

  const [showBg, setShowBg] = useState(true);
  const [bgColor, setBgColor] = useState("#3B3F4A");
  const [bgOpacity, setBgOpacity] = useState(0.8);

  const nudge = (dx: number, dy: number) =>
    setPosFrame((p) => clampPosition(p.x + dx, p.y + dy));

  const applyAlign = (a: "left" | "center" | "right") => {
    const frame = frameRef.current;
    const bubble = bubbleRef.current;
    if (!frame || !bubble) {
      setAlign(a);
      return;
    }
    const frameRect = frame.getBoundingClientRect();
    const bubbleRect = bubble.getBoundingClientRect();
    const pad = 12;
    let x = posFrame.x;
    if (a === "left") x = pad;
    if (a === "center") x = Math.max(pad, (frameRect.width - bubbleRect.width) / 2);
    if (a === "right") x = Math.max(pad, frameRect.width - bubbleRect.width - pad);
    setPosFrame(clampPosition(x, posFrame.y));
    setAlign(a);
  };

  const centerPosition = () => {
    const frame = frameRef.current;
    const bubble = bubbleRef.current;
    if (!frame || !bubble) return;
    const frameRect = frame.getBoundingClientRect();
    const bubbleRect = bubble.getBoundingClientRect();
    const pad = 12;
    const x = Math.max(pad, (frameRect.width - bubbleRect.width) / 2);
    const y = Math.max(pad, (frameRect.height - bubbleRect.height) / 2);
    setPosFrame(clampPosition(x, y));
  };

  const pendingNatPosRef = useRef<{ x: number; y: number } | null>(null);

  const tempObjectUrlRef = useRef<string | null>(null);
  useEffect(() => {
    return () => {
      if (tempObjectUrlRef.current) {
        URL.revokeObjectURL(tempObjectUrlRef.current);
        tempObjectUrlRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (mediaId) {
        try {
          const m: MediaItem = await fetchMedia(mediaId);
          if (cancelled) return;
          setImageUrl(m.imageUrl);
          setCaption(m.caption || "");
          if (m.fontFamily) setFontFamily(m.fontFamily);
          if (typeof m.fontSize === "number") setFontSize(m.fontSize);
          if (m.textColor) setTextColor(m.textColor);
          if (m.align === "left" || m.align === "center" || m.align === "right") {
            setAlign(m.align);
          }
          if (typeof m.showBg === "boolean") setShowBg(m.showBg);
          if (m.bgColor) setBgColor(m.bgColor);
          if (typeof m.bgOpacity === "number") setBgOpacity(m.bgOpacity);

          if (typeof m.posX === "number" || typeof m.posY === "number") {
            pendingNatPosRef.current = { x: m.posX ?? 0, y: m.posY ?? 0 };
          }
        } catch (err) {
          console.error(err);
        }
      } else if (tempMedia?.file) {
        const url = URL.createObjectURL(tempMedia.file);
        tempObjectUrlRef.current = url;
        setImageUrl(url);
        setCaption(tempMedia.caption || "");
        setFontFamily("Arial");
        setFontSize(24);
        setTextColor("#FFFFFF");
        setAlign("center");
        setShowBg(true);
        setBgColor("#3B3F4A");
        setBgOpacity(0.8);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [mediaId, tempMedia]);

  useEffect(() => {
    if (!nat || !scale) return;
    if (pendingNatPosRef.current) {
      const { x, y } = pendingNatPosRef.current;
      setPosFrame(clampPosition(x * scale, y * scale));
      pendingNatPosRef.current = null;
    } else {
      requestAnimationFrame(() =>
        setPosFrame((p) => clampPosition(p.x, p.y))
      );
    }
  }, [nat, scale, clampPosition, setPosFrame]);

  useEffect(() => {
    if (!imageUrl) return;
    const img = new Image();
    img.decoding = "async";
    img.src = imageUrl;
    const done = () => {
      if (img.naturalWidth && img.naturalHeight) {
        setNat({ w: img.naturalWidth, h: img.naturalHeight });
      }
    };
    if (img.complete) done();
    else img.onload = done;
    return () => {
      img.onload = null;
    };
  }, [imageUrl, setNat]);

  const bubbleStyle = computeBubbleStyle({
    scale,
    posFrame,
    textColor,
    fontFamily,
    fontSize,
    align,
    showBg,
    bgColor,
    bgOpacity,
    frameWidth: box.w,
  });

  const [saving, setSaving] = useState(false);
  const [savedMsg, setSavedMsg] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const saveChanges = async () => {
    if (!mediaId || !imageUrl) return;
    setSaving(true);
    setSaveSuccess(false);
    setSavedMsg(null);
    try {
      const natPosX = Math.round(posFrame.x / (scale || 1));
      const natPosY = Math.round(posFrame.y / (scale || 1));

      const updated = await saveMedia(mediaId, {
        caption,
        fontFamily,
        fontSize,
        textColor,
        align,
        showBg,
        bgColor,
        bgOpacity,
        posX: natPosX,
        posY: natPosY,
      });

      setCaption(updated.caption ?? caption);
      setSavedMsg("Saved successfully!");
      setSaveSuccess(true);
      setTimeout(() => {
        setSavedMsg(null);
        setSaveSuccess(false);
      }, 2500);
    } catch (e) {
      console.error(e);
      setSavedMsg("Save failed");
      setSaveSuccess(false);
    } finally {
      setSaving(false);
    }
  };

  const [savingImage, setSavingImage] = useState(false);
  const [hasSavedImage, setHasSavedImage] = useState<boolean>(!!mediaId);

  const [saveImageJustSucceeded, setSaveImageJustSucceeded] = useState<boolean>(
    search.get("justSaved") === "1"
  );

  useEffect(() => {
    if (!saveImageJustSucceeded) return;
    const t = setTimeout(() => {
      setSaveImageJustSucceeded(false);
      if (search.get("justSaved") === "1") {
        const next = new URLSearchParams(search);
        next.delete("justSaved");
        setSearch(next, { replace: true });
      }
    }, 2500);
    return () => clearTimeout(t);
  }, [saveImageJustSucceeded, search, setSearch]);

  const saveImageToWorkspace = async () => {
    if (!tempMedia?.file) return;
    setSavingImage(true);
    try {
      const fd = new FormData();
      fd.append("file", tempMedia.file);
      if (caption) fd.append("caption", caption);
      fd.append("fontFamily", fontFamily);
      fd.append("fontSize", String(fontSize));
      fd.append("textColor", textColor);
      fd.append("align", align);
      fd.append("showBg", String(showBg));
      fd.append("bgColor", bgColor);
      fd.append("bgOpacity", String(bgOpacity));

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

      if (newId) {
        setHasSavedImage(true);
        if (tempObjectUrlRef.current) {
          URL.revokeObjectURL(tempObjectUrlRef.current);
          tempObjectUrlRef.current = null;
        }
        navigate(`/editor?id=${encodeURIComponent(newId)}&justSaved=1`, {
          replace: true,
          state: {},
        });
      } else {
        setHasSavedImage(true);
        setSaveImageJustSucceeded(true);
      }
    } catch (e) {
      console.error(e);
      setSavedMsg("Save failed");
      setSaveSuccess(false);
      setTimeout(() => setSavedMsg(null), 2500);
    } finally {
      setSavingImage(false);
    }
  };

  const showSaveImageButton = !hasSavedImage && !!tempMedia?.file;

  return (
    <div
      className="bg-[#0C0F14] text-white overflow-x-hidden min-h-[100svh]"
      style={{
        ["--sidebar-w" as string]: sidebarWidth,
        ["--topbar-h" as string]: "48px",
        ["--footer-h" as string]: "96px",
      }}
    >
      <Sidebar
        mode={isOverlay ? "overlay" : "docked"}
        open={isOverlay ? mobileOpen : true}
        collapsed={isOverlay ? false : collapsed}
        onToggle={() => (isOverlay ? setMobileOpen((o) => !o) : setCollapsed((v) => !v))}
        onClose={() => setMobileOpen(false)}
      />

      <div
        className="grid min-h-screen grid-rows-[auto,1fr,auto] transition-[padding-left] duration-500 ease-[cubic-bezier(0.25,0.8,0.25,1)]"
        style={{ paddingLeft: isOverlay ? 0 : "var(--sidebar-w)" }}
      >
        <Topbar isOverlay={isOverlay} mobileOpen={mobileOpen} onMobileToggle={() => setMobileOpen((o) => !o)} />

        <main className="h-full min-h-0 bg-black overflow-visible lg:overflow-auto pt-[var(--topbar-h)]">
          <section className="min-h-full flex flex-col lg:flex-row">
            {/* Left (preview) */}
            <div className="flex-1 min-h-full flex items-center justify-center border-r border-white/10 bg-black pb-[var(--footer-h)]">
              <div className="w-full max-w-[820px] p-4 md:p-6">
                {imageUrl && nat ? (
                  <EditorPreview
                    image={imageUrl}
                    caption={caption}
                    bubbleStyle={bubbleStyle}
                    frameRef={frameRef}
                    bubbleRef={bubbleRef}
                    showBg={showBg}
                    aspectFromNat={`${nat.w} / ${nat.h}`}
                    bubbleProps={{
                      onPointerDown: onBubblePointerDown,
                      onPointerMove: onBubblePointerMove,
                      onPointerUp: onBubblePointerUp,
                    }}
                  />
                ) : (
                  <div className="aspect-[4/3] w-full border border-dashed border-white/20 rounded-xl grid place-items-center px-6">
                    <div className="text-center">
                      <p className="text-lg font-semibold">No image loaded</p>
                      <p className="text-sm text-white/60 mt-1">
                        Select or import an image to start editing.
                      </p>

                      {/* Choose from Workspace */}
                      <button
                        type="button"
                        onClick={() => {
                          const returnUrl = `${location.pathname}${location.search}`;
                          setPickerFlag();
                          navigate(`/workspace?picker=1&return=${encodeURIComponent(returnUrl)}`);
                        }}
                        className="mt-4 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 px-3 py-1.5 text-sm"
                      >
                        Choose from Workspace
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Right (controls) */}
            <div
              className="w-full lg:w-[400px] min-h-0 border-white/10 bg-black overflow-y-auto"
              style={{ height: "calc(100svh - var(--topbar-h) - var(--footer-h))" }}
            >
              <EditorControls
                caption={caption}
                setCaption={setCaption}
                fontFamily={fontFamily}
                setFontFamily={setFontFamily}
                fontSize={fontSize}
                setFontSize={setFontSize}
                textColor={textColor}
                setTextColor={setTextColor}
                align={align}
                applyAlign={applyAlign}
                showBg={showBg}
                setShowBg={setShowBg}
                bgColor={bgColor}
                setBgColor={setBgColor}
                bgOpacity={bgOpacity}
                setBgOpacity={setBgOpacity}
                COLORS={PALETTE}
                nudge={nudge}
                centerPosition={centerPosition}
                NUDGE={10}
                onSave={saveChanges}
                saving={saving}
                saveSuccess={saveSuccess}
                showSaveImage={showSaveImageButton}
                onSaveImage={saveImageToWorkspace}
                savingImage={savingImage}
                saveImageSuccess={saveImageJustSucceeded}
              />
            </div>
          </section>
        </main>

        <Footer />
      </div>

      {savedMsg && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 rounded-xl bg-green-600/90 px-4 py-2 text-sm font-medium shadow-lg">
          <CheckCircle size={16} />
          {savedMsg}
        </div>
      )}
    </div>
  );
}