import { useEffect, useRef, useState } from "react";
import { User, Settings, LogIn, UserPlus, LogOut } from "lucide-react";

type UserMenuProps = {
  isAuthenticated?: boolean;
  onSignIn?: () => void;
  onSignUp?: () => void;
  onSignOut?: () => void;
  onProfile?: () => void;
  onSettings?: () => void;
};

export default function UserMenu({
  isAuthenticated = false,
  onSignIn,
  onSignUp,
  onSignOut,
  onProfile,
  onSettings,
}: UserMenuProps) {
  const [open, setOpen] = useState(false);
  const btnRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

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
    icon: any;
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
      <button
        ref={btnRef}
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className="w-8 h-8 inline-flex items-center justify-center rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 transition
                   focus:outline-none focus:ring-0"
        title="Account"
      >
        <User size={16} className="opacity-85" />
      </button>

      {/* Dropdown panel */}
      <div
        ref={panelRef}
        role="menu"
        aria-label="User menu"
        className={`absolute right-0 mt-2 w-56 rounded-xl border border-white/10 bg-black shadow-xl shadow-black/30 p-2
                    transition transform origin-top-right
                    ${open ? "opacity-100 scale-100" : "pointer-events-none opacity-0 scale-95"}`}
      >
        {isAuthenticated ? (
          <>
            <Item icon={User} onClick={onProfile}>
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
            <Item icon={LogIn} onClick={onSignIn}>
              Sign in
            </Item>
            <Item icon={UserPlus} onClick={onSignUp}>
              Create account
            </Item>
          </>
        )}
      </div>
    </div>
  );
}
