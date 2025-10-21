import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  User2,
  Settings,
  LogIn,
  UserPlus,
  LogOut,
  type LucideIcon,
} from "lucide-react";

type UserMenuProps = {
  isAuthenticated?: boolean;
  userName?: string | null;
  email?: string | null;
  onSignIn?: () => void;
  onSignUp?: () => void;
  onSignOut?: () => void;
  onProfile?: () => void;
  onSettings?: () => void;
};

export default function UserMenu({
  isAuthenticated = false,
  email,
  onSignIn,
  onSignUp,
  onSignOut,
  onProfile,
  onSettings,
}: UserMenuProps) {
  const [open, setOpen] = useState(false);
  const btnRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (
        open &&
        panelRef.current &&
        !panelRef.current.contains(e.target as Node) &&
        btnRef.current &&
        !btnRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onDocClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDocClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const Item = ({
    icon: Icon,
    children,
    onClick,
  }: {
    icon: LucideIcon;
    children: React.ReactNode;
    onClick?: () => void;
  }) => (
    <button
      onClick={() => {
        onClick?.();
        setOpen(false);
      }}
      className="w-full flex items-center gap-3 px-3 py-2.5 text-sm rounded-lg hover:bg-white/10 text-white/90
                 focus:outline-none focus:ring-0"
      role="menuitem"
    >
      <Icon size={16} className="opacity-85" />
      <span className="truncate">{children}</span>
    </button>
  );

  return (
    <div className="relative">
      {/* trigger button */}
      <button
        ref={btnRef}
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className="w-8 h-8 inline-flex items-center justify-center rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 transition
                   focus:outline-none focus:ring-0"
        title="Account"
      >
        <User2 size={16} className="opacity-85" />
      </button>

      {/* Dropdown panel */}
      <div
        ref={panelRef}
        role="menu"
        aria-label="User menu"
        className={`absolute right-0 mt-2 w-60 rounded-xl border border-white/10 bg-[#1e2128] shadow-xl shadow-black/30 p-2
                    transition transform origin-top-right
                    ${open ? "opacity-100 scale-100" : "pointer-events-none opacity-0 scale-95"}`}
      >
        {isAuthenticated ? (
          <>
            {/* Signed-in header */}
            <div className="px-2 py-2 text-xs text-white/60">
              <span className="text-white/90">{email ?? "User"}</span>
            </div>
            <div className="my-1 h-px bg-white/10" />

            <Item icon={User2} onClick={onProfile}>
              Profile
            </Item>
            <Item icon={Settings} onClick={onSettings}>
              Account settings
            </Item>
            <div className="my-1 h-px bg-white/10" />
            <Item icon={LogOut} onClick={onSignOut}>
              Log out
            </Item>
          </>
        ) : (
          <>
            <Item
              icon={LogIn}
              onClick={() => {
                onSignIn?.();
                navigate("/login");
              }}
            >
              Sign in
            </Item>
            <Item
              icon={UserPlus}
              onClick={() => {
                onSignUp?.();
                navigate("/signup");
              }}
            >
              Create account
            </Item>
          </>
        )}
      </div>
    </div>
  );
}
