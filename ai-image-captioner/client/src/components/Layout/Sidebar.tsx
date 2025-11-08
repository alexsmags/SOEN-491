import {
  Home,
  Upload,
  Edit3,
  Images,
  Share2,
  ChevronLeft,
  ChevronRight,
  X,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import logo from "../../assets/CaptoPic_Logo.png";
import { NavLink, Link, type To } from "react-router-dom";
import { useSession } from "../../session/useSession";

type NavItemProps = {
  label: string;
  Icon: LucideIcon;
  to: To;
  collapsed?: boolean;
  state?: unknown;
  onPreNavigate?: (toPathname: string) => boolean;
  onCloseOverlay?: () => void;
};

const NavItem = ({ label, Icon, to, collapsed, state, onPreNavigate, onCloseOverlay }: NavItemProps) => {
  const linkTo = typeof to === "string" ? (to === "/workspace" ? { pathname: "/workspace", search: "?page=1" } : to) : to;
  const targetPathname = typeof to === "string" ? to : (to as any).pathname || "/";

  return (
    <NavLink
      to={linkTo}
      state={state}
      end
      onClick={(e) => {
        const allow = onPreNavigate ? onPreNavigate(targetPathname) : true;
        if (!allow) {
          e.preventDefault();
          return;
        }
        if (onCloseOverlay) onCloseOverlay();
      }}
      className={({ isActive }) =>
        [
          "group w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm transition",
          isActive
            ? "bg-white/10 text-white shadow"
            : "text-white/70 hover:text-white hover:bg-white/5",
          collapsed ? "justify-center" : "",
        ].join(" ")
      }
      title={collapsed ? label : undefined}
    >
      <Icon size={18} className="shrink-0 opacity-90" />
      <span className={collapsed ? "hidden" : "truncate"}>{label}</span>
    </NavLink>
  );
};

const links: Array<{
  label: string;
  Icon: LucideIcon;
  to: To;
  requiresAuth?: boolean;
  state?: unknown;
}> = [
  { label: "Homepage", Icon: Home, to: "/" },
  { label: "Upload & Generate", Icon: Upload, to: "/upload", requiresAuth: true },
  { label: "Editor", Icon: Edit3, to: "/editor", state: { from: "sidebar" }, requiresAuth: true },
  { label: "My Workspace", Icon: Images, to: "/workspace", requiresAuth: true },
  { label: "Share", Icon: Share2, to: "/share", requiresAuth: true },
];

type SidebarProps = {
  mode: "overlay" | "docked";
  open: boolean;
  collapsed: boolean;
  onToggle: () => void;
  onClose: () => void;
  confirmNavigate?: (toPathname: string) => boolean;
};

export default function Sidebar({
  mode,
  open,
  collapsed,
  onToggle,
  onClose,
  confirmNavigate,
}: SidebarProps) {
  const isOverlay = mode === "overlay";
  const width = isOverlay ? "16rem" : "var(--sidebar-w)";
  const { user } = useSession();
  const visibleLinks = links.filter((l) => !l.requiresAuth || Boolean(user));

  return (
    <>
      {isOverlay && (
        <div
          className={[
            "fixed inset-0 z-40 bg-black/50 backdrop-blur-[2px]",
            "transition-opacity duration-300 ease-out",
            open
              ? "opacity-100 pointer-events-auto"
              : "opacity-0 pointer-events-none",
          ].join(" ")}
          role="presentation"
          onClick={onClose}
          aria-hidden={!open}
        />
      )}
      <aside
        className={[
          "fixed left-0 top-0 h-screen z-50 bg-black border-r border-white/10 p-3",
          "transform-gpu will-change-transform backface-hidden",
          isOverlay
            ? "transition-transform duration-500 ease-[cubic-bezier(0.25,0.8,0.25,1)]"
            : "transition-[width] duration-500 ease-[cubic-bezier(0.25,0.8,0.25,1)]",
          isOverlay
            ? open
              ? "translate-x-0"
              : "-translate-x-full"
            : "translate-x-0",
        ].join(" ")}
        style={{ width }}
        aria-label="Sidebar"
      >
        <div
          className={[
            "mb-6",
            collapsed
              ? "flex items-center justify-center"
              : "flex items-center gap-2 px-3",
          ].join(" ")}
        >
          <Link
            to="/"
            className="flex items-center gap-2 focus:outline-none focus:ring-2 focus:ring-white/30 rounded-lg"
            title="Go to homepage"
            onClick={(e) => {
              const allow = confirmNavigate ? confirmNavigate("/") : true;
              if (!allow) {
                e.preventDefault();
                return;
              }
              if (isOverlay) onClose();
            }}
          >
            <img
              src={logo}
              alt="CaptoPic"
              className={collapsed ? "h-8 w-8 rounded-lg" : "h-9 w-9 rounded-lg"}
            />
            <span
              className={[
                "font-semibold tracking-tight text-white text-lg",
                collapsed ? "hidden" : "inline",
              ].join(" ")}
            >
              CaptoPic
            </span>
          </Link>
          {isOverlay && (
            <button
              onClick={onClose}
              className="ml-auto p-1 rounded-lg border border-white/10 hover:bg-white/10"
              aria-label="Close menu"
              title="Close menu"
            >
              <X size={18} className="opacity-80" />
            </button>
          )}
        </div>
        <nav className="space-y-1 mt-1">
          {visibleLinks.map(({ label, Icon, to, state }) => (
            <NavItem
              key={label}
              label={label}
              Icon={Icon}
              to={to}
              state={state}
              collapsed={isOverlay ? false : collapsed}
              onPreNavigate={confirmNavigate}
              onCloseOverlay={isOverlay ? onClose : undefined}
            />
          ))}
        </nav>
      </aside>
      {!isOverlay && (
        <button
          onClick={onToggle}
          style={{
            left: "calc(var(--sidebar-w) - 1rem)",
            transition: "left 0.5s cubic-bezier(0.25, 0.8, 0.25, 1)",
          }}
          className={[
            "fixed top-1/2 -translate-y-1/2 z-[60] flex items-center justify-center w-8 h-8 rounded-full",
            "border border-white/10 bg-black hover:bg-white/10 shadow-md shadow-black/20",
          ].join(" ")}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? (
            <ChevronRight size={18} className="opacity-80" />
          ) : (
            <ChevronLeft size={18} className="opacity-80" />
          )}
        </button>
      )}
    </>
  );
}
