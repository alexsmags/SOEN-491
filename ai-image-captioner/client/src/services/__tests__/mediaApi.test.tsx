import { vi } from 'vitest';
import { fetchMedia, saveMedia, type MediaItem } from '../mediaApi'; 

describe("Media API functions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test("fetchMedia should return media item", async () => {
    const mockMedia: MediaItem = {
      id: "123",
      imageUrl: "https://example.com/image.jpg",
      caption: "Test Caption",
      fontFamily: "Arial",
      fontSize: 14,
      textColor: "black",
      align: "center",
      showBg: true,
      bgColor: "white",
      bgOpacity: 0.8,
      posX: 10,
      posY: 20,
    };

    vi.stubGlobal('fetch', vi.fn().mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockMedia),
    }));

    const mediaId = "123";
    const result = await fetchMedia(mediaId);

    expect(result).toEqual(mockMedia);
    expect(fetch).toHaveBeenCalledWith(
      `${import.meta.env.VITE_SERVER_URL}/api/media/${encodeURIComponent(mediaId)}`,
      expect.objectContaining({
        credentials: "include",
      })
    );
  });

  test("saveMedia should update and return updated media item", async () => {
    const mockUpdatedMedia: MediaItem = {
      id: "123",
      imageUrl: "https://example.com/image.jpg",
      caption: "Updated Caption",
      fontFamily: "Arial",
      fontSize: 16,
      textColor: "blue",
      align: "right",
      showBg: false,
      bgColor: "black",
      bgOpacity: 0.5,
      posX: 30,
      posY: 40,
    };

    vi.stubGlobal('fetch', vi.fn().mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockUpdatedMedia),
    }));

    const mediaId = "123";
    const data: Partial<MediaItem> = { caption: "Updated Caption", fontSize: 16 };

    const result = await saveMedia(mediaId, data);

    expect(result).toEqual(mockUpdatedMedia);
    expect(fetch).toHaveBeenCalledWith(
      `${import.meta.env.VITE_SERVER_URL}/api/media/${encodeURIComponent(mediaId)}`,
      expect.objectContaining({
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
        credentials: "include",
      })
    );
  });

  test("fetchMedia should throw an error when the response is not ok", async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValueOnce({
      ok: false,
      status: 404,
      text: () => Promise.resolve("Not found"),
    }));

    const mediaId = "123";

    await expect(fetchMedia(mediaId)).rejects.toThrow(
      `Failed to load media (404)`
    );
  });

  test("saveMedia should throw an error when the response is not ok", async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValueOnce({
      ok: false,
      status: 500,
      text: () => Promise.resolve("Server error"),
    }));

    const mediaId = "123";
    const data: Partial<MediaItem> = { caption: "Updated Caption" };

    await expect(saveMedia(mediaId, data)).rejects.toThrow(
      `Save failed (500)`
    );
  });
});
