import { Menu } from "lucide-react";
import UserMenu from "./UserMenu";
import { useSession } from "../../session";

const SERVER_URL = import.meta.env.VITE_SERVER_URL ?? "http://localhost:5000";
const CLIENT_URL = import.meta.env.VITE_CLIENT_URL ?? "http://localhost:5173";

type TopbarProps = {
  isOverlay: boolean;
  mobileOpen: boolean;
  onMobileToggle: () => void;
};

export default function Topbar({ isOverlay, mobileOpen, onMobileToggle }: TopbarProps) {
  const { user } = useSession();
  const isAuthenticated = !!user;
  const email = user?.email;

  function logout() {
    const url = new URL("/auth/signout", SERVER_URL);
    url.searchParams.set("callbackUrl", CLIENT_URL);
    window.location.href = url.toString();
  }

  return (
    <header
      className={[
        "fixed inset-x-0 top-0",
        "z-40 bg-[#1e2128] border-b border-white/10 pt-[env(safe-area-inset-top)]",
        "transition-[padding-left] duration-500 ease-[cubic-bezier(0.25,0.8,0.25,1)]",
      ].join(" ")}
      style={{
        paddingLeft: isOverlay ? undefined : "var(--sidebar-w)",
      }}
    >
      <div className="h-12 px-3 md:px-4 flex items-center justify-between">
        {/* Mobile menu button */}
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

        {/* Right section */}
        <div className="flex items-center gap-1.5 md:gap-2.5">
          <UserMenu
            isAuthenticated={isAuthenticated}
            email={email}
            onSignIn={() => (window.location.href = "/login")}
            onSignUp={() => (window.location.href = "/signup")}
            onProfile={() => (window.location.href = "/workspace")}
            onSettings={() => (window.location.href = "/workspace")}
            onSignOut={logout}
          />
        </div>
      </div>
    </header>
  );
}
