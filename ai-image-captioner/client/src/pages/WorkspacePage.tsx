import { useEffect, useMemo, useState } from "react";
import Sidebar from "../components/Sidebar";
import Topbar from "../components/Topbar";
import Footer from "../components/Footer";
import MediaCard from "../components/Workspace/MediaCard";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { ITEMS } from "../data/workspaceData";

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
    mqs.forEach(mq => mq.addEventListener("change", onChange));
    return () => mqs.forEach(mq => mq.removeEventListener("change", onChange));
  }, []);

  return view;
}

export default function WorkspacePage() {
  const view = useView();

  const [collapsed, setCollapsed] = useState<boolean>(() => {
    const saved = typeof window !== "undefined" ? localStorage.getItem("sidebar-collapsed") : null;
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

  const isOverlay = view === "mobile";

  return (
    <div
      className="bg-[#0C0F14] text-white overflow-x-hidden"
      style={{ ["--sidebar-w" as string]: sidebarWidth }}
    >
      {/* Sidebar */}
      <Sidebar
        mode={isOverlay ? "overlay" : "docked"}
        open={isOverlay ? mobileOpen : true}
        collapsed={isOverlay ? false : collapsed}
        onToggle={() => (isOverlay ? setMobileOpen(o => !o) : setCollapsed(v => !v))}
        onClose={() => setMobileOpen(false)}
      />

      {/* Content wrapper */}
      <div
        className="
          min-h-screen flex flex-col
          will-change-[padding-left]
          transition-[padding-left] duration-500 ease-[cubic-bezier(0.25,0.8,0.25,1)]
        "
        style={{ paddingLeft: isOverlay ? 0 : "var(--sidebar-w)" }}
      >
        <Topbar
          isOverlay={isOverlay}
          mobileOpen={mobileOpen}
          onMobileToggle={() => setMobileOpen(o => !o)}
        />

        {/* Pure page */}
        <main className="flex-grow pt-14 px-6 md:px-10 pb-32 bg-black">
          <section className="mt-6 md:mt-10">
            <h1 className="text-2xl md:text-4xl font-extrabold tracking-tight">My Workspace</h1>

            {/* Grid of items */}
            <div className="mt-8 grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {ITEMS.map((item) => (
                <MediaCard
                  key={item.id}
                  item={item}
                  onEdit={(id) => console.log("Edit", id)}
                  onMore={(id) => console.log("More", id)}
                />
              ))}
            </div>

            {/* Pagination */}
            <div className="mt-8 flex items-center justify-center gap-4">
              <button
                className="inline-flex items-center gap-1 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 px-3 py-1.5 text-sm transition"
                aria-label="Previous page"
              >
                <ChevronLeft size={16} className="opacity-85" />
                <span className="hidden sm:inline">Previous</span>
              </button>

              <div className="h-8 min-w-8 px-2 inline-flex items-center justify-center rounded-lg border border-white/10 bg-black/40 text-sm">
                1
              </div>

              <button
                className="inline-flex items-center gap-1 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 px-3 py-1.5 text-sm transition"
                aria-label="Next page"
              >
                <span className="hidden sm:inline">Next</span>
                <ChevronRight size={16} className="opacity-85" />
              </button>
            </div>
          </section>
        </main>
      </div>

      <Footer />
    </div>
  );
}