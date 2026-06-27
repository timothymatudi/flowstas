import 'server-only'
import crypto from 'node:crypto'

// Shared AES-256-GCM encryption for secrets we keep at rest (GitHub clone tokens,
// GitHub OAuth connection tokens). The key lives ONLY in the APP_TOKEN_ENC_KEY env
// var (32 bytes, base64) — never in the DB — so a DB leak alone can't decrypt them.

function tokenEncKey(): Buffer {
  const raw = process.env.APP_TOKEN_ENC_KEY
  if (!raw) throw new Error('APP_TOKEN_ENC_KEY is not set — cannot encrypt tokens.')
  const key = Buffer.from(raw, 'base64')
  if (key.length !== 32) throw new Error('APP_TOKEN_ENC_KEY must decode to 32 bytes (base64).')
  return key
}

// Returns base64(iv[12] | authTag[16] | ciphertext).
export function encryptSecret(plain: string): string {
  const iv = crypto.randomBytes(12)
  const cipher = crypto.createCipheriv('aes-256-gcm', tokenEncKey(), iv)
  const ct = Buffer.concat([cipher.update(plain, 'utf8'), cipher.final()])
  const tag = cipher.getAuthTag()
  return Buffer.concat([iv, tag, ct]).toString('base64')
}

export function decryptSecret(stored: string): string {
  const buf = Buffer.from(stored, 'base64')
  const iv = buf.subarray(0, 12)
  const tag = buf.subarray(12, 28)
  const ct = buf.subarray(28)
  const decipher = crypto.createDecipheriv('aes-256-gcm', tokenEncKey(), iv)
  decipher.setAuthTag(tag)
  return Buffer.concat([decipher.update(ct), decipher.final()]).toString('utf8')
}
