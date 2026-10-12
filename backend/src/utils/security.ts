import crypto from 'crypto';
import { env } from '../config/env';

const TOKEN_SECRET = process.env.JWT_SECRET || 'farmlink-strong-secret-key-salt-2025';

export interface TokenPayload {
  userId: string;
  email: string;
  role: string;
  exp: number;
}

/**
 * Hashes a plaintext password using scrypt and a cryptographic salt.
 * Output format: `salt:derivedKeyHex`
 */
export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString('hex');
  const derivedKey = crypto.scryptSync(password, salt, 64);
  return `${salt}:${derivedKey.toString('hex')}`;
}

/**
 * Verifies a plaintext password against a stored `salt:derivedKeyHex` hash.
 * Uses timingSafeEqual to guard against timing attacks.
 */
export function verifyPassword(password: string, storedHash: string | null | undefined): boolean {
  if (!storedHash || !storedHash.includes(':')) {
    return false;
  }
  try {
    const [salt, key] = storedHash.split(':');
    if (!salt || !key) return false;
    const derivedKey = crypto.scryptSync(password, salt, 64);
    const keyBuffer = Buffer.from(key, 'hex');
    if (keyBuffer.length !== derivedKey.length) {
      return false;
    }
    return crypto.timingSafeEqual(keyBuffer, derivedKey);
  } catch (error) {
    return false;
  }
}

/**
 * Asynchronously verifies password using libuv worker threadpool, avoiding event loop blocking.
 */
export async function verifyPasswordAsync(password: string, storedHash: string | null | undefined): Promise<boolean> {
  if (!storedHash || !storedHash.includes(':')) {
    return false;
  }
  try {
    const [salt, key] = storedHash.split(':');
    if (!salt || !key) return false;
    const derivedKey = await new Promise<Buffer>((resolve, reject) => {
      crypto.scrypt(password, salt, 64, (err, derived) => {
        if (err) reject(err);
        else resolve(derived as Buffer);
      });
    });
    const keyBuffer = Buffer.from(key, 'hex');
    if (keyBuffer.length !== derivedKey.length) {
      return false;
    }
    return crypto.timingSafeEqual(keyBuffer, derivedKey);
  } catch (error) {
    return false;
  }
}

/**
 * Creates a signed session token for authenticated users.
 * Valid for 30 days.
 */
export function createSessionToken(payload: Omit<TokenPayload, 'exp'>): string {
  const exp = Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60; // 30 days
  const fullPayload: TokenPayload = { ...payload, exp };
  const payloadB64 = Buffer.from(JSON.stringify(fullPayload)).toString('base64url');
  const signature = crypto
    .createHmac('sha256', TOKEN_SECRET)
    .update(payloadB64)
    .digest('base64url');

  return `fl_${payloadB64}.${signature}`;
}

/**
 * Verifies a signed session token and returns the payload if valid and not expired.
 */
export function verifySessionToken(token: string): TokenPayload | null {
  if (!token.startsWith('fl_') || !token.includes('.')) {
    return null;
  }

  try {
    const raw = token.slice(3); // Remove 'fl_'
    const [payloadB64, signature] = raw.split('.');
    if (!payloadB64 || !signature) return null;

    const expectedSignature = crypto
      .createHmac('sha256', TOKEN_SECRET)
      .update(payloadB64)
      .digest('base64url');

    const expectedBuffer = Buffer.from(expectedSignature);
    const signatureBuffer = Buffer.from(signature);

    if (
      expectedBuffer.length !== signatureBuffer.length ||
      !crypto.timingSafeEqual(expectedBuffer, signatureBuffer)
    ) {
      return null;
    }

    const payload: TokenPayload = JSON.parse(
      Buffer.from(payloadB64, 'base64url').toString('utf8')
    );

    if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) {
      return null; // Expired
    }

    return payload;
  } catch (error) {
    return null;
  }
}

/**
 * Generates a secure 6-digit numeric OTP for email verification.
 */
export function generateOtp(): string {
  return crypto.randomInt(100000, 999999).toString();
}
