import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import Sidebar from "../components/Layout/Sidebar";
import Topbar from "../components/Layout/Topbar";
import Footer from "../components/Layout/Footer";
import WorkspaceGrid from "../components/Workspace/WorkspaceGrid";
import SkeletonGrid from "../components/UI/SkeletonGrid";
import Pagination from "../components/UI/Pagination";
import { useView } from "../hooks/useView";
import { SHARE_TARGETS } from "../data/shareTargets";
import type { MediaItem } from "../types/media";
import { RefreshCcw } from "lucide-react";

const SERVER_URL = import.meta.env.VITE_SERVER_URL ?? "";
const PAGE_SIZE = 12;

const PICKER_KEY = "workspace-picker";
const PICKER_MAX_AGE_MS = 10 * 60 * 1000;

function hasValidPickerFlag(): boolean {
  if (typeof window === "undefined") return false;
  const raw = sessionStorage.getItem(PICKER_KEY);
  if (!raw) return false;
  try {
    const obj = JSON.parse(raw) as { from?: string; ts?: number };
    if (obj?.from !== "editor" || typeof obj?.ts !== "number") return false;
    return Date.now() - obj.ts < PICKER_MAX_AGE_MS;
  } catch {
    return false;
  }
}

function clearPickerFlag() {
  if (typeof window === "undefined") return;
  sessionStorage.removeItem(PICKER_KEY);
}

function getDevHeaders(): Record<string, string> {
  if (typeof window === "undefined") return {};
  const id = localStorage.getItem("dev-user-id");
  return id ? { "x-user-id": id } : {};
}

export default function WorkspacePage() {
  const view = useView();

  const [searchParams, setSearchParams] = useSearchParams();
  const qpPicker = searchParams.get("picker") === "1";
  const returnTo = searchParams.get("return") || "/editor";

  const [pickerActive, setPickerActive] = useState<boolean>(false);
  useEffect(() => {
    setPickerActive(qpPicker && hasValidPickerFlag());
  }, [qpPicker]);

  useEffect(() => {
    return () => {
      if (!qpPicker) clearPickerFlag();
    };
  }, [qpPicker]);

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

  const isOverlay = view === "mobile";

  const readPageFromUrl = useCallback(() => {
    const raw = searchParams.get("page");
    const parsed = raw ? parseInt(raw, 10) : 1;
    return Number.isFinite(parsed) && parsed > 0 ? parsed : 1;
  }, [searchParams]);

  const [page, setPage] = useState<number>(readPageFromUrl());
  const [hasNext, setHasNext] = useState(false);

  useEffect(() => {
    const urlPage = readPageFromUrl();
    if (urlPage !== page) setPage(urlPage);
  }, [searchParams, page, readPageFromUrl]);

  const [items, setItems] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  const requestIdRef = useRef(0);

  const fetchItems = useCallback(async (p: number) => {
    const myRequestId = ++requestIdRef.current;
    setLoading(true);
    setErr(null);

    try {
      const res = await fetch(
        `${SERVER_URL}/api/media?page=${p}&pageSize=${PAGE_SIZE}`,
        {
          credentials: "include",
          headers: { ...getDevHeaders() },
        }
      );
      if (!res.ok) throw new Error(`Failed to load (${res.status})`);
      const data = await res.json();

      if (myRequestId !== requestIdRef.current) return;

      const list: MediaItem[] = Array.isArray(data?.items)
        ? data.items
        : Array.isArray(data)
        ? data
        : [];

      if (typeof data?.hasNext === "boolean") {
        setHasNext(data.hasNext);
      } else if (typeof data?.total === "number") {
        setHasNext(p * PAGE_SIZE < data.total);
      } else {
        setHasNext(list.length === PAGE_SIZE);
      }

      if (list.length === 0 && p > 1) {
        let targetPage = Math.max(1, p - 1);

        if (typeof data?.total === "number") {
          const total = Math.max(0, data.total as number);
          const lastPage = Math.max(1, Math.ceil(total / PAGE_SIZE));
          targetPage = Math.min(targetPage, lastPage);
          if (p > lastPage) targetPage = lastPage;
        }

        if (targetPage !== p) {
          setPage(targetPage);
          return;
        }
      }

      setItems(list);
    } catch (e: unknown) {
      if (myRequestId !== requestIdRef.current) return;
      setErr(e instanceof Error ? e.message : "Failed to load");
      setItems([]);
      setHasNext(false);
    } finally {
      if (myRequestId === requestIdRef.current) {
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    setSearchParams((prev) => {
      const currentFromUrl = (() => {
        const raw = prev.get("page");
        const parsed = raw ? parseInt(raw, 10) : 1;
        return Number.isFinite(parsed) && parsed > 0 ? parsed : 1;
      })();

      if (currentFromUrl !== page) {
        const next = new URLSearchParams(prev);
        next.set("page", String(page));
        return next;
      }
      return prev;
    });

    fetchItems(page);

    if (typeof window !== "undefined")
      window.scrollTo({ top: 0, behavior: "smooth" });
  }, [page, setSearchParams, fetchItems]);

  const onDelete = async (id: string) => {
    try {
      const res = await fetch(`${SERVER_URL}/api/media/${id}`, {
        method: "DELETE",
        credentials: "include",
        headers: { ...getDevHeaders() },
      });
      if (!res.ok) {
        const body = await res.text().catch(() => "");
        console.error("DELETE failed", res.status, body);
        throw new Error(`Delete failed (${res.status})`);
      }

      setItems((prev) => prev.filter((x) => x.id !== id));

      if (items.length === 1 && page > 1) {
        setPage((p) => Math.max(1, p - 1));
      } else {
        fetchItems(page);
      }
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : "Delete failed");
    }
  };

  const handleSelect = (id: string) => {
    clearPickerFlag();
    try {
      const u = new URL(returnTo, window.location.origin);
      const params = new URLSearchParams(u.search);
      params.set("id", id);
      u.search = params.toString();
      window.location.href = u.pathname + u.search + u.hash;
    } catch {
      window.location.href = `/editor?id=${encodeURIComponent(id)}`;
    }
  };

  return (
    <div
      className="bg-[#0C0F14] text-white overflow-x-hidden"
      style={{
        ["--sidebar-w" as string]: useMemo(() => {
          if (view === "mobile") return mobileOpen ? "16rem" : "0rem";
          return collapsed ? "4rem" : "16rem";
        }, [view, collapsed, mobileOpen]),
      }}
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

        <main className="flex-grow pt-14 px-6 md:px-10 pb-32 bg-black">
          <section className="mt-6 md:mt-10">
            <div className="flex items-center justify-between">
              <h1 className="text-2xl md:text-4xl font-extrabold tracking-tight">
                {pickerActive ? "Select an Image" : "My Workspace"}
              </h1>
              <button
                onClick={() => fetchItems(page)}
                className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 px-3 py-1.5 text-sm transition disabled:opacity-50"
                disabled={loading}
                aria-busy={loading}
                aria-live="polite"
              >
                <RefreshCcw
                  className={`h-4 w-4 ${loading ? "animate-spin" : ""}`}
                  aria-hidden="true"
                />
                <span>{loading ? "Refreshing…" : "Refresh"}</span>
              </button>
            </div>

            {loading ? (
              <SkeletonGrid count={PAGE_SIZE} />
            ) : err ? (
              <div className="mt-12 text-sm text-red-400">{err}</div>
            ) : items.length === 0 ? (
              <div className="mt-12 text-sm text-white/60">
                No items yet. Save from the Upload page.
              </div>
            ) : (
              <WorkspaceGrid
                items={items}
                shareTargets={SHARE_TARGETS}
                selectionMode={pickerActive}
                onSelect={(item) => handleSelect(item.id)}
                onShareTarget={
                  !pickerActive
                    ? (targetId, item) => {
                        console.log("Share to:", targetId, "item:", item.id);
                      }
                    : undefined
                }
                onEdit={
                  !pickerActive
                    ? (item) => {
                        window.location.href = `/editor?id=${encodeURIComponent(
                          item.id
                        )}`;
                      }
                    : undefined
                }
                onDelete={!pickerActive ? (item) => onDelete(item.id) : undefined}
              />
            )}

            {!loading && items.length > 0 && (
              <Pagination
                page={page}
                hasNext={hasNext}
                loading={loading}
                onPrev={() => setPage((p) => Math.max(1, p - 1))}
                onNext={() => setPage((p) => p + 1)}
              />
            )}
          </section>
        </main>
      </div>

      <Footer />
    </div>
  );
}
