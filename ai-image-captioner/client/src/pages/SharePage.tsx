import { useEffect, useMemo, useState } from "react";
import Sidebar from "../components/Sidebar";
import Topbar from "../components/Topbar";
import Footer from "../components/Footer";
import { ImagePicker } from "../components/Share/ImagePicker";
import { PreviewWithShare } from "../components/Share/PreviewWithShare";
import { ShareModal } from "../components/Share/ShareModal";
import { buildShareUrl } from "../lib/shareUrls";
import { SHARE_TARGETS } from "../data/shareTargets";
import type { ShareTarget, SharePayload } from "../data/shareTargets";

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

export default function SharePage() {
  const view = useView();
  const isOverlay = view === "mobile";

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
    if (view === "mobile") {
      setMobileOpen(false);
    } else if (view === "tablet") {
      const saved = localStorage.getItem("sidebar-collapsed");
      if (saved == null) setCollapsed(true);
    }
  }, [view]);
  const sidebarWidth = useMemo(() => {
    if (view === "mobile") return mobileOpen ? "16rem" : "0rem";
    return collapsed ? "4rem" : "16rem";
  }, [view, collapsed, mobileOpen]);

  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [shareOpen, setShareOpen] = useState(false);

  const payload: SharePayload = useMemo(
    () => ({
      url: window.location.origin,
      text:
        "Coffee and a good book: the perfect escape from the daily grind. ☕️📚",
      hashtags: ["CafeVibes", "Bookworm"],
      image: selectedImage || undefined,
    }),
    [selectedImage]
  );

const onShareTo = (id: ShareTarget["id"]) => {
  const target = SHARE_TARGETS.find((t) => t.id === id);
  if (!target) return;

  if (id === "system" && navigator.share) {
    navigator
      .share({
        title: "CaptoPic",
        text: payload.text,
        url: payload.url,
      })
      .catch(() => {});
    return;
  }

  const href = buildShareUrl(target.id, payload);
  if (!href) return;

  const w = 680;
  const h = 560;
  const left = window.screenX + (window.outerWidth - w) / 2;
  const top = window.screenY + (window.outerHeight - h) / 2;
  window.open(
    href,
    "_blank",
    `popup=yes,width=${w},height=${h},left=${left},top=${top}`
  );
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

        <main className="flex-grow pt-14 px-6 md:px-10 pb-32 bg-black">
          <h1 className="mt-6 md:mt-10 text-3xl md:text-5xl font-extrabold leading-tight tracking-tight text-[#3b477e]">
            Social Media Integration
          </h1>
          <p className="mt-3 text-white/70 max-w-prose">
            Pick your image. The Share button appears inside the preview, then click it to share to your friends!
          </p>

          <div className="mt-8 grid lg:grid-cols-2 gap-8 items-start">
            <section className="rounded-2xl bg-white/[0.04] border border-white/10 p-5 md:p-6">
              <h2 className="text-lg md:text-xl font-semibold">Image Preview</h2>
              <p className="text-xs md:text-sm text-white/60 mt-1">
                This is how your captioned image will appear on social media.
              </p>

              <PreviewWithShare
                imageSrc={selectedImage}
                caption="Coffee and a good book: the perfect escape from the daily grind."
                hashtags={["#CafeVibes", "#Bookworm"]}
                onShare={() => setShareOpen(true)}
              />
            </section>

            <section className="rounded-2xl bg-white/[0.04] border border-white/10 p-5 md:p-6">
              <h2 className="text-lg md:text-xl font-semibold">Choose Captioned Image</h2>
              <p className="text-xs md:text-sm text-white/60 mt-1">
                Pick from your creations in your workspace.
              </p>
              <ImagePicker
                value={selectedImage}
                onChange={(src) => {
                  setSelectedImage(src);
                  setShareOpen(false);
                }}
              />
            </section>
          </div>
        </main>

        <Footer />
      </div>

      <ShareModal
        open={shareOpen}
        onClose={() => setShareOpen(false)}
        targets={SHARE_TARGETS}
        onShare={onShareTo}
      />
    </div>
  );
}
