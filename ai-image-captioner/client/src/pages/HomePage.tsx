import { useEffect, useMemo, useState } from "react";
import Sidebar from "../components/Sidebar";
import Topbar from "../components/Topbar";
import Footer from "../components/Footer";
import FeatureCard from "../components/HomePage/FeatureCard";
import TestimonialCard from "../components/HomePage/TestimonialCard";
import caption_image from "../assets/caption_image.png";
import { FEATURES, TESTIMONIALS } from "../data/homepageContent";
import { useSession } from "../session";

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

function SkeletonLine({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse bg-white/10 rounded ${className}`} />;
}

function SkeletonHero() {
  return (
    <section className="rounded-2xl bg-white/[0.04] border border-white/10 p-6 md:p-10">
      <div className="grid md:grid-cols-2 gap-8 items-center">
        <div>
          <SkeletonLine className="h-10 md:h-14 w-4/5" />
          <SkeletonLine className="h-10 md:h-14 w-3/5 mt-3" />
          <SkeletonLine className="h-10 md:h-14 w-2/5 mt-3" />
          <SkeletonLine className="h-4 w-full mt-6" />
          <SkeletonLine className="h-4 w-5/6 mt-2" />
          <SkeletonLine className="h-10 w-44 mt-6 rounded-xl" />
        </div>
        <div className="aspect-[4/3] rounded-xl bg-white/[0.03] border border-white/10 flex items-center justify-center">
          <SkeletonLine className="h-full w-full rounded-lg" />
        </div>
      </div>
    </section>
  );
}

function SkeletonFeatures() {
  return (
    <section className="mt-10">
      <div className="text-center mb-8">
        <SkeletonLine className="h-8 md:h-10 w-2/3 mx-auto" />
        <SkeletonLine className="h-4 w-5/6 mx-auto mt-3" />
      </div>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="rounded-2xl bg-white/[0.04] border border-white/10 p-5"
          >
            <SkeletonLine className="h-10 w-10 rounded-xl" />
            <SkeletonLine className="h-5 w-3/4 mt-4" />
            <SkeletonLine className="h-4 w-full mt-2" />
            <SkeletonLine className="h-4 w-5/6 mt-2" />
          </div>
        ))}
      </div>
    </section>
  );
}

function SkeletonTestimonials() {
  return (
    <section className="mt-16 rounded-2xl bg-white/[0.04] border border-white/10 p-6 md:p-10">
      <SkeletonLine className="h-8 md:h-10 w-1/2 mx-auto" />
      <div className="mt-8 grid md:grid-cols-2 gap-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="rounded-2xl bg-white/[0.03] border border-white/10 p-6"
          >
            <div className="flex items-center gap-3">
              <SkeletonLine className="h-10 w-10 rounded-full" />
              <div className="flex-1">
                <SkeletonLine className="h-4 w-1/2" />
                <SkeletonLine className="h-3 w-1/3 mt-2" />
              </div>
            </div>
            <SkeletonLine className="h-4 w-full mt-5" />
            <SkeletonLine className="h-4 w-11/12 mt-2" />
            <SkeletonLine className="h-4 w-10/12 mt-2" />
          </div>
        ))}
      </div>
    </section>
  );
}
/** ---------------------------------------- */

export default function HomePage() {
  const view = useView();
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

  const isOverlay = view === "mobile";

  const { user, loading } = useSession();
  const isAuthenticated = !!user;
  const userName = user?.name ?? user?.email?.split("@")[0] ?? undefined;

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

      {/* Main content wrapper */}
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

        <main className="flex-grow pt-14 px-6 md:px-10 pb-32 black-bg">
          {loading ? (
            <>
              {/* Optional: placeholder for greeting spacing */}
              <SkeletonLine className="h-10 w-60 mt-10 mb-4 rounded" />
              <SkeletonHero />
              <SkeletonFeatures />
              <SkeletonTestimonials />
            </>
          ) : (
            <>
              {isAuthenticated && (
                <h1 className="text-5xl md:text-5xl font-extrabold leading-tight tracking-tight mb-2 mt-10">
                  Hello, {userName}
                </h1>
              )}

              {/* Hero section */}
              <section className="rounded-2xl bg-white/[0.04] border border-white/10 p-6 md:p-10">
                <div className="grid md:grid-cols-2 gap-8 items-center">
                  <div>
                    <h1 className="text-3xl md:text-5xl font-extrabold leading-tight tracking-tight">
                      Unleash Your <br /> Images with <br /> Perfect <br />{" "}
                      AI-Powered <br /> Captions
                    </h1>
                    <p className="mt-4 text-sm md:text-base text-white/70 max-w-prose">
                      Generate engaging, tailor-made captions in seconds for all
                      your social media, marketing, and product needs. Boost your
                      engagement and tell your story effortlessly.
                    </p>
                    <button
                      disabled={loading}
                      className={`mt-6 rounded-xl px-4 py-2 border border-white/15 transition shadow-sm ${
                        loading ? "opacity-50 cursor-not-allowed" : ""
                      }`}
                      style={{ backgroundColor: "#364881" }}
                    >
                      {loading ? "Please wait..." : "Get Started Now"}
                    </button>
                  </div>

                  <div className="aspect-[4/3] rounded-xl bg-white/[0.03] border border-white/10 flex items-center justify-center">
                    <img
                      src={caption_image}
                      alt="Phone showcasing captions"
                      className="w-full h-full object-cover rounded-lg"
                    />
                  </div>
                </div>
              </section>

              {/* Features */}
              <section className="mt-10">
                <div className="text-center mb-8">
                  <h2 className="text-2xl md:text-4xl font-bold">
                    Unlock the Power of AI-Driven Captions
                  </h2>
                  <p className="mt-3 text-white/70 max-w-2xl mx-auto">
                    Elevate your content with engaging, personalized captions
                    crafted instantly for any platform.
                  </p>
                </div>

                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
                  {FEATURES.map((f) => (
                    <FeatureCard
                      key={f.title}
                      icon={f.icon}
                      title={f.title}
                      desc={f.desc}
                    />
                  ))}
                </div>
              </section>

              {/* Testimonials */}
              <section className="mt-16 rounded-2xl bg-white/[0.04] border border-white/10 p-6 md:p-10">
                <h2 className="text-center text-2xl md:text-4xl font-bold">
                  What Our Users Say
                </h2>

                <div className="mt-8 grid md:grid-cols-2 gap-6">
                  {TESTIMONIALS.map((t) => (
                    <TestimonialCard
                      key={t.name}
                      quote={t.quote}
                      name={t.name}
                      title={t.title}
                      avatarSrc={t.avatarSrc}
                    />
                  ))}
                </div>
              </section>
            </>
          )}
        </main>
      </div>

      <Footer />
    </div>
  );
}
