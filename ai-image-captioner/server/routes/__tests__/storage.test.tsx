import type { Request, Response } from "express";

const mockGetSignedUrl = jest.fn().mockResolvedValue("https://signed.example.com");
const mockPutObjectCommand = jest.fn();

jest.doMock("@aws-sdk/client-s3", () => ({
  S3Client: jest.fn().mockImplementation(() => ({ region: "mock-region" })),
  PutObjectCommand: function (input: any) {
    mockPutObjectCommand(input);
    return input;
  },
}));
jest.doMock("@aws-sdk/s3-request-presigner", () => ({
  getSignedUrl: mockGetSignedUrl,
}));

jest.doMock("crypto", () => ({
  randomUUID: jest.fn(() => "uuid-1234"),
}));

process.env.AWS_REGION = "us-east-1";
process.env.S3_BUCKET = "my-bucket";
process.env.S3_ENDPOINT = "https://mock-endpoint";
process.env.S3_ACCESS_KEY_ID = "AKIA_TEST";
process.env.S3_SECRET_ACCESS_KEY = "SECRET_TEST";

import { storage } from "../../routes/storage";

function getPostHandler() {
  const stack: any[] = (storage as any).stack;
  const layer = stack.find(
    (l) => l.route && l.route.path === "/presign" && l.route.methods.post
  );
  if (!layer) throw new Error("POST /presign handler not found");
  const handlers = layer.route.stack.map((s: any) => s.handle);
  return handlers[handlers.length - 1];
}

function mockReqRes(body: any) {
  const req = { body } as unknown as Request;
  let statusCode: number | undefined;
  let jsonBody: any;
  const res = {
    status(code: number) {
      statusCode = code;
      return this as any;
    },
    json(payload: any) {
      jsonBody = payload;
      return this as any;
    },
  } as unknown as Response;
  return {
    req,
    res,
    getStatus: () => statusCode,
    getJson: () => jsonBody,
  };
}

describe("storage POST /presign", () => {
  const handler = getPostHandler();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("400 on invalid input", async () => {
    const { req, res, getStatus, getJson } = mockReqRes({
      userId: 123,
      mimeType: "image/jpeg",
      size: 123,
    });
    await handler(req, res);
    expect(getStatus()).toBe(400);
    expect(getJson()).toEqual({ error: "invalid_input" });
    expect(mockGetSignedUrl).not.toHaveBeenCalled();
  });

  it("200 on valid input, returns presigned URL", async () => {
    const { req, res, getStatus, getJson } = mockReqRes({
      userId: "user-abc",
      mimeType: "image/png",
      size: 4567,
    });

    await handler(req, res);

    expect(mockPutObjectCommand).toHaveBeenCalledWith({
      Bucket: "my-bucket",
      Key: "user-abc/uuid-1234",
      ContentType: "image/png",
    });
    expect(mockGetSignedUrl).toHaveBeenCalled();
    expect(getStatus()).toBeUndefined();
    expect(getJson()).toEqual({
      url: "https://signed.example.com",
      bucket: "my-bucket",
      key: "user-abc/uuid-1234",
    });
  });
});
