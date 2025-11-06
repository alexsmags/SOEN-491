import { useCallback, useEffect, useState } from "react";

export type WorkspaceImage = {
  id: string;
  imageUrl?: string;
  caption?: string | null;
  mime?: string | null;
  width?: number | null;
  height?: number | null;
  createdAt?: string;
  keywords?: string[] | null;
  fontFamily?: string | null;
  fontSize?: number | null;
  textColor?: string | null;
  align?: "left" | "center" | "right" | null;
  showBg?: boolean | null;
  bgColor?: string | null;
  bgOpacity?: number | null;
  posX?: number | null;
  posY?: number | null;
};

const SERVER_URL = import.meta.env.VITE_SERVER_URL ?? "";
const PAGE_SIZE = 12;

function getDevHeaders(): Record<string, string> {
  if (typeof window === "undefined") return {};
  const id = localStorage.getItem("dev-user-id");
  return id ? { "x-user-id": id } : {};
}

type PagedResp = {
  items: WorkspaceImage[];
  total?: number;
  hasNext?: boolean;
  page?: number;
  pageSize?: number;
};

function isObject(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null;
}

function isPagedResp(v: unknown): v is PagedResp {
  if (!isObject(v)) return false;
  const items = (v as Record<string, unknown>).items;
  return Array.isArray(items);
}

export function useWorkspaceImages() {
  const [images, setImages] = useState<WorkspaceImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState<number>(1);
  const [hasNext, setHasNext] = useState<boolean>(false);

  const fetchPage = useCallback(async (p: number) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(
        `${SERVER_URL}/api/media?page=${p}&pageSize=${PAGE_SIZE}`,
        {
          method: "GET",
          headers: { ...getDevHeaders() },
          credentials: "include",
        }
      );
      if (!res.ok) {
        const txt = await res.text().catch(() => "");
        throw new Error(`Failed to load media (${res.status}): ${txt}`);
      }

      const data: unknown = await res.json();
      let list: WorkspaceImage[] = [];
      let next = false;

      if (isPagedResp(data)) {
        list = data.items;
        if (typeof data.hasNext === "boolean") {
          next = data.hasNext;
        } else if (typeof data.total === "number") {
          const total = Math.max(0, Number(data.total));
          next = p * PAGE_SIZE < total;
        } else {
          next = list.length === PAGE_SIZE;
        }
      } else if (Array.isArray(data)) {
        list = data as WorkspaceImage[];
        next = list.length === PAGE_SIZE;
      } else if (isObject(data) && Array.isArray(data.items)) {
        list = data.items as WorkspaceImage[];
        next = list.length === PAGE_SIZE;
      } else {
        list = [];
        next = false;
      }

      setImages(list);
      setHasNext(next);
      setPage(p);
    } catch (e) {
      const message = e instanceof Error ? e.message : "Failed to load images";
      setError(message);
      setImages([]);
      setHasNext(false);
    } finally {
      setLoading(false);
    }
  }, []);

  const reload = useCallback(() => {
    return fetchPage(page);
  }, [fetchPage, page]);

  const nextPage = useCallback(() => {
    if (!loading && hasNext) fetchPage(page + 1);
  }, [fetchPage, page, hasNext, loading]);

  const prevPage = useCallback(() => {
    if (!loading && page > 1) fetchPage(page - 1);
  }, [fetchPage, page, loading]);

  useEffect(() => {
    fetchPage(1);
  }, [fetchPage]);

  return {
    images,
    loading,
    error,
    page,
    hasNext,
    nextPage,
    prevPage,
    reload,
    pageSize: PAGE_SIZE,
  };
}
