import { Router } from "express"
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3"
import { getSignedUrl } from "@aws-sdk/s3-request-presigner"
import { z } from "zod"
import crypto from "crypto"

export const storage = Router()

const s3 = new S3Client({
  region: process.env.AWS_REGION!,
  endpoint: process.env.S3_ENDPOINT,
  credentials: {
    accessKeyId: process.env.S3_ACCESS_KEY_ID!,
    secretAccessKey: process.env.S3_SECRET_ACCESS_KEY!,
  },
})

storage.post("/presign", async (req, res) => {
  const parsed = z.object({
    userId: z.string(),
    mimeType: z.string(),
    size: z.number().int().positive(),
  }).safeParse(req.body)
  if (!parsed.success) return res.status(400).json({ error: "invalid_input" })

  const key = `${parsed.data.userId}/${crypto.randomUUID()}`
  const cmd = new PutObjectCommand({
    Bucket: process.env.S3_BUCKET!,
    Key: key,
    ContentType: parsed.data.mimeType,
  })
  const url = await getSignedUrl(s3, cmd, { expiresIn: 60 })
  res.json({ url, bucket: process.env.S3_BUCKET!, key })
})
