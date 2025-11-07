import { vi } from "vitest";  // Ensure this is imported correctly
import { fetchShareLink, fetchMediaFileAsFile, fetchMediaMeta } from "../media";  // Adjust the import path as needed

// Mocking the fetch API globally
global.fetch = vi.fn();

describe("API functions tests", () => {
  beforeEach(() => {
    // Clear mock data before each test
    vi.clearAllMocks();
  });

  test("fetchShareLink should return a valid link", async () => {
    const mockResponse = { url: "https://example.com/share-link" };

    // Mock fetch to return a resolved promise with the mockResponse
    (fetch as vi.Mock).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockResponse),
    });

    const mediaId = "123";
    const result = await fetchShareLink(mediaId);

    expect(result).toBe(mockResponse.url);
    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining(`/api/media/${mediaId}/share`),
      expect.objectContaining({
        method: "POST",
        headers: expect.any(Object),
        body: "{}", // Mocked empty body
        credentials: "include",
      })
    );
  });

  test("fetchMediaFileAsFile should return a valid file", async () => {
    const mockBlob = new Blob(["file-content"], { type: "image/png" });

    // Mock fetch to return a resolved promise with the file blob
    (fetch as vi.Mock).mockResolvedValueOnce({
      ok: true,
      blob: () => Promise.resolve(mockBlob),
    });

    const mediaId = "123";
    const mimeType = "image/png";
    const file = await fetchMediaFileAsFile(mediaId, mimeType);

    expect(file).toBeInstanceOf(File);
    expect(file.type).toBe(mimeType);
    expect(file.name).toBe("image.png");
  });

  test("fetchMediaMeta should return media meta data", async () => {
    const mockMeta = {
      id: "123",
      caption: "Test caption",
      keywords: ["test"],
    };

    // Mock fetch to return a resolved promise with the mockMeta
    (fetch as vi.Mock).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockMeta),
    });

    const mediaId = "123";
    const meta = await fetchMediaMeta(mediaId);

    expect(meta).toEqual(mockMeta);
    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining(`/api/media/${mediaId}`),
      expect.objectContaining({
        method: "GET",
        headers: expect.any(Object),
        credentials: "include",
      })
    );
  });
});
