import dotenv from "dotenv";
dotenv.config();

const PORT = Number(process.env.PORT ?? 5000);
const BASE_URL = (process.env.BASE_URL ?? `http://localhost:${PORT}`).replace(/\/$/, "");

export const openapiSpec = {
  openapi: "3.0.3",
  info: {
    title: "Media API",
    version: "1.0.0",
    description:
      "Endpoints for uploading images and managing caption + style metadata.",
  },
  servers: [{ url: BASE_URL }],
  tags: [
    { name: "health", description: "Health & debug" },
    { name: "media", description: "Upload, list, read, update, delete media" },
    { name: "auth", description: "Session utilities" },
  ],
  components: {
    securitySchemes: {
      DevUserId: {
        type: "apiKey",
        in: "header",
        name: "x-user-id",
        description:
          "Development shim. Provide a user id (e.g. `dev-user-1`). In production, omit and rely on session cookies.",
      },
    },
    schemas: {
      Media: {
        type: "object",
        required: [
          "id",
          "imageUrl",
          "caption",
          "createdAt",
          "updatedAt",
          "fontFamily",
          "fontSize",
          "textColor",
          "align",
          "showBg",
          "bgColor",
          "bgOpacity",
          "posX",
          "posY",
        ],
        properties: {
          id: { type: "string", example: "clz1abc234" },
          imageUrl: { type: "string", format: "uri" },
          caption: { type: "string" },
          tone: { type: "string", nullable: true },
          keywords: {
            type: "array",
            items: { type: "string" },
            nullable: true,
          },
          fontFamily: { type: "string", example: "Arial" },
          fontSize: { type: "number", example: 24 },
          textColor: { type: "string", example: "#FFFFFF" },
          align: { type: "string", enum: ["left", "center", "right"] },
          showBg: { type: "boolean" },
          bgColor: { type: "string", example: "#3B3F4A" },
          bgOpacity: { type: "number", example: 0.8 },
          posX: { type: "number", example: 120 },
          posY: { type: "number", example: 120 },
          createdAt: { type: "string", format: "date-time" },
          updatedAt: { type: "string", format: "date-time" },
        },
      },
      MediaList: {
        type: "object",
        required: ["items", "total", "page", "pageSize"],
        properties: {
          items: { type: "array", items: { $ref: "#/components/schemas/Media" } },
          total: { type: "integer", example: 42 },
          page: { type: "integer", example: 1 },
          pageSize: { type: "integer", example: 24 },
        },
      },
      Error: {
        type: "object",
        properties: {
          error: { type: "string" },
          path: { type: "string", nullable: true },
        },
      },
    },
  },
  security: [{ DevUserId: [] }],
  paths: {
    "/health": {
      get: {
        tags: ["health"],
        summary: "Health check",
        responses: {
          "200": {
            description: "OK",
            content: {
              "application/json": {
                schema: { type: "object", properties: { ok: { type: "boolean" } } },
                example: { ok: true },
              },
            },
          },
        },
      },
    },

    "/api/me": {
      get: {
        tags: ["auth"],
        summary: "Get current session user",
        responses: {
          "200": {
            description: "Authenticated",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: { user: { type: "object" } },
                },
              },
            },
          },
          "401": {
            description: "Unauthorized",
            content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } },
          },
        },
      },
    },

    "/api/media": {
      post: {
        tags: ["media"],
        summary: "Upload an image and create Media",
        description:
          "Multipart upload. Stores file on disk and persists caption and style metadata.",
        requestBody: {
          required: true,
          content: {
            "multipart/form-data": {
              schema: {
                type: "object",
                required: ["file"],
                properties: {
                  file: { type: "string", format: "binary" },
                  caption: { type: "string", default: "" },
                  tone: { type: "string", nullable: true },
                  keywords: {
                    type: "string",
                    description: "JSON-encoded array of strings (e.g. [\"sale\",\"promo\"])",
                  },
                  fontFamily: { type: "string", default: "Arial" },
                  fontSize: { type: "number", default: 24 },
                  textColor: { type: "string", default: "#FFFFFF" },
                  align: { type: "string", default: "center", enum: ["left", "center", "right"] },
                  showBg: { type: "string", description: "true/false", default: "true" },
                  bgColor: { type: "string", default: "#3B3F4A" },
                  bgOpacity: { type: "number", default: 0.8 },
                  posX: { type: "number", default: 120 },
                  posY: { type: "number", default: 120 },
                },
              },
            },
          },
        },
        responses: {
          "200": {
            description: "Created Media",
            content: { "application/json": { schema: { $ref: "#/components/schemas/Media" } } },
          },
          "400": { description: "Bad request (e.g. file missing)" },
          "401": { description: "Unauthorized" },
        },
      },
      get: {
        tags: ["media"],
        summary: "List media for current user",
        parameters: [
          { in: "query", name: "tone", schema: { type: "string" } },
          {
            in: "query",
            name: "keyword",
            schema: { type: "string" },
            description: "Search term applied to caption (alias: q)",
          },
          { in: "query", name: "q", schema: { type: "string" } },
          { in: "query", name: "from", schema: { type: "string", format: "date-time" } },
          { in: "query", name: "to", schema: { type: "string", format: "date-time" } },
          { in: "query", name: "page", schema: { type: "integer", default: 1 } },
          { in: "query", name: "pageSize", schema: { type: "integer", default: 24, maximum: 100 } },
        ],
        responses: {
          "200": {
            description: "Paged results",
            content: { "application/json": { schema: { $ref: "#/components/schemas/MediaList" } } },
          },
          "401": { description: "Unauthorized" },
        },
      },
    },

    "/api/media/{id}": {
      get: {
        tags: ["media"],
        summary: "Get a single media item",
        parameters: [{ in: "path", name: "id", required: true, schema: { type: "string" } }],
        responses: {
          "200": {
            description: "Media",
            content: { "application/json": { schema: { $ref: "#/components/schemas/Media" } } },
          },
          "401": { description: "Unauthorized" },
          "404": { description: "Not found" },
        },
      },
      put: {
        tags: ["media"],
        summary: "Update caption and/or style",
        parameters: [{ in: "path", name: "id", required: true, schema: { type: "string" } }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  caption: { type: "string" },
                  tone: { type: "string", nullable: true },
                  keywords: {
                    oneOf: [
                      { type: "array", items: { type: "string" } },
                      { type: "string", description: "JSON-encoded array of strings" },
                      { type: "null" },
                    ],
                  },
                  fontFamily: { type: "string" },
                  fontSize: { type: "number" },
                  textColor: { type: "string" },
                  align: { type: "string", enum: ["left", "center", "right"] },
                  showBg: { type: "boolean" },
                  bgColor: { type: "string" },
                  bgOpacity: { type: "number" },
                  posX: { type: "number" },
                  posY: { type: "number" },
                },
              },
            },
          },
        },
        responses: {
          "200": { description: "Updated Media", content: { "application/json": { schema: { $ref: "#/components/schemas/Media" } } } },
          "401": { description: "Unauthorized" },
          "404": { description: "Not found" },
        },
      },
      delete: {
        tags: ["media"],
        summary: "Delete media (and remove uploaded file)",
        parameters: [{ in: "path", name: "id", required: true, schema: { type: "string" } }],
        responses: {
          "200": {
            description: "Deleted",
            content: { "application/json": { schema: { type: "object", properties: { ok: { type: "boolean" } } } } },
          },
          "401": { description: "Unauthorized" },
          "404": { description: "Not found" },
        },
      },
    },
  },
};
