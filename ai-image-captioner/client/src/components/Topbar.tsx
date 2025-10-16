import { useEffect, useRef, useState } from "react";
import { Search, X, Menu } from "lucide-react";
import UserMenu from "./UserMenu";

type TopbarProps = {
  isOverlay: boolean;          // true on mobile
  mobileOpen: boolean;         // current mobile sidebar state
  onMobileToggle: () => void;  // open/close mobile sidebar
};

export default function Topbar({ isOverlay, mobileOpen, onMobileToggle }: TopbarProps) {
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState("");
  const wrapperRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Close on outside click / Esc
  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (!searchOpen) return;
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setSearchOpen(false);
      }
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setSearchOpen(false);
    }
    document.addEventListener("mousedown", onDocClick);
    document.addEventListener("keydown", onKey);
    if (searchOpen) setTimeout(() => inputRef.current?.focus(), 10);
    return () => {
      document.removeEventListener("mousedown", onDocClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [searchOpen]);

  return (
    <header
      className={[
        "fixed inset-x-0 top-0",
        "z-40 bg-black/95 border-b border-white/10 pt-[env(safe-area-inset-top)]",
        "transition-[padding-left] duration-500 ease-[cubic-bezier(0.25,0.8,0.25,1)]"
      ].join(" ")}
      style={{
        paddingLeft: isOverlay ? undefined : ("var(--sidebar-w)" as unknown as number),
      }}
    >
      <div className="h-12 px-3 md:px-4 flex items-center justify-between">
        {/* Left: menu button shows only for overlay (mobile) */}
        <div className="flex items-center">
          {isOverlay && (
            <button
              aria-label={mobileOpen ? "Close menu" : "Open menu"}
              title={mobileOpen ? "Close menu" : "Open menu"}
              onClick={onMobileToggle}
              className="w-8 h-8 inline-flex items-center justify-center rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 transition"
            >
              <Menu size={16} className="opacity-85" />
              <span className="sr-only">{mobileOpen ? "Close menu" : "Open menu"}</span>
            </button>
          )}
        </div>

        <div className="flex items-center gap-1.5 md:gap-2.5" ref={wrapperRef}>
          <div
            className={`relative h-8 overflow-hidden transition-all duration-300 ease-out ${
              searchOpen ? "w-56 md:w-72 mr-1.5 md:mr-2" : "w-0 mr-0"
            }`}
          >
            <div
              className={`absolute inset-0 flex items-center transition-all duration-300 ${
                searchOpen ? "translate-x-0 opacity-100" : "translate-x-full opacity-0"
              }`}
            >
              <input
                ref={inputRef}
                type="text"
                placeholder="Search…"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="w-full h-8 rounded-lg bg-white/5 border border-white/10 px-3 pr-8 text-sm
                           outline-none focus:outline-none focus:ring-0 focus:border-white/20 placeholder-white/60
                           text-white transition"
                onKeyDown={(e) => {
                  if (e.key === "Enter") console.log("Search:", query);
                }}
              />
              {query && (
                <button
                  onClick={() => setQuery("")}
                  aria-label="Clear search"
                  className="absolute right-2 text-white/60 hover:text-white transition-opacity duration-200"
                >
                  <X size={14} />
                </button>
              )}
            </div>
          </div>

          {/* Toggle search */}
          <button
            aria-label={searchOpen ? "Close search" : "Open search"}
            title={searchOpen ? "Close search" : "Open search"}
            onClick={() => setSearchOpen((v) => !v)}
            className="w-8 h-8 inline-flex items-center justify-center rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 transition"
          >
            <Search size={16} className="opacity-85" />
          </button>

          {/* Dropdown profile menu */}
          <UserMenu
            isAuthenticated={false}
            onSignIn={() => console.log("Sign in")}
            onSignUp={() => console.log("Sign up")}
            onProfile={() => console.log("Profile")}
            onSettings={() => console.log("Settings")}
            onSignOut={() => console.log("Sign out")}
          />
        </div>
      </div>
    </header>
  );
}