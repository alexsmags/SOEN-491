import React, { useEffect, useMemo, useState } from "react";
import Sidebar from "../../components/Layout/Sidebar";
import Topbar from "../../components/Layout/Topbar";
import Footer from "../../components/Layout/Footer";

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

type Props = {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
};

export default function AuthLayout({ title, subtitle, children }: Props) {
  const view = useView();

  const [collapsed, setCollapsed] = useState<boolean>(() => {
    const saved =
      typeof window !== "undefined" ? localStorage.getItem("sidebar-collapsed") : null;
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
      style={{ "--sidebar-w": sidebarWidth } as React.CSSProperties}
    >
      {/* Sidebar */}
      <Sidebar
        mode={isOverlay ? "overlay" : "docked"}
        open={isOverlay ? mobileOpen : true}
        collapsed={isOverlay ? false : collapsed}
        onToggle={() =>
          isOverlay ? setMobileOpen((o) => !o) : setCollapsed((v) => !v)
        }
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
          onMobileToggle={() => setMobileOpen((o) => !o)}
        />

        {/* Centered auth container on lg+, unchanged on mobile */}
        <main
          className="
            flex-grow pt-14 px-4 md:px-10 pb-32
            lg:flex lg:items-center lg:justify-center
          "
        >
          <section className="mt-8 lg:mt-0 w-full">
            <div className="mx-auto w-full max-w-[1100px]">
              <div className="rounded-2xl bg-white/[0.04] border border-white/10 p-6 md:p-10">
                {/* Header */}
                <div className="mb-6 md:mb-8">
                  <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight">{title}</h1>
                  {subtitle && (
                    <p className="mt-2 text-white/70 text-sm md:text-base">{subtitle}</p>
                  )}
                </div>

                {/* Two-column wide card: form on the left, brand/cta panel on the right */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-10">
                  {/* Form (children) */}
                  <div className="max-w-[720px]">{children}</div>

                  {/* Right panel */}
                  <div className="hidden lg:block">
                    <div className="h-full rounded-xl bg-white/[0.03] border border-white/10 p-6 flex flex-col justify-center">
                      <h3 className="text-xl font-semibold">Why CaptoPic?</h3>
                      <ul className="mt-4 space-y-3 text-white/80 text-sm">
                        <li>• AI-powered captions tailored for every platform</li>
                        <li>• Batch upload, edit, and export workflows</li>
                        <li>• Shareable workspaces for quick collaboration</li>
                        <li>• Lightning-fast generation with beautiful UX</li>
                      </ul>
                      <p className="mt-6 text-white/60 text-xs">
                        Tip: You can always toggle the sidebar; this page respects your
                        collapsed preference and mobile overlay behavior.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>
        </main>

        <Footer />
      </div>
    </div>
  );
}
