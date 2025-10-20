import { useEffect, useMemo, useState } from "react";
import Sidebar from "../components/Sidebar";
import Topbar from "../components/Topbar";
import Footer from "../components/Footer";
import FeatureCard from "../components/HomePage/FeatureCard";
import TestimonialCard from "../components/HomePage/TestimonialCard";
import caption_image from "../assets/caption_image.png";
import { FEATURES, TESTIMONIALS } from "../data/homepageContent";

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

        <main className="flex-grow pt-14 px-6 md:px-10 pb-32 black-bg">
          {/* Hero */}
          <section className="mt-6 md:mt-10 rounded-2xl bg-white/[0.04] border border-white/10 p-6 md:p-10">
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
                  className="mt-6 rounded-xl px-4 py-2 border border-white/15 transition shadow-sm"
                  style={{ backgroundColor: "#364881" }}
                >
                  Get Started Now
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

          {/* FEATURES */}
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
        </main>
      </div>

      <Footer />
    </div>
  );
}
