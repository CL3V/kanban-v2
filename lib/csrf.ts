// Edge-compatible CSRF token generation and validation using Web Crypto API

const CSRF_SECRET = process.env.CSRF_SECRET || 'default-secret-change-in-production';

// Convert string to ArrayBuffer
function stringToArrayBuffer(str: string): ArrayBuffer {
  const encoder = new TextEncoder();
  return encoder.encode(str).buffer;
}

// Convert ArrayBuffer to hex string
function arrayBufferToHex(buffer: ArrayBuffer): string {
  return Array.from(new Uint8Array(buffer))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

// Generate random hex string
function generateRandomHex(length: number): string {
  const array = new Uint8Array(length);
  crypto.getRandomValues(array);
  return arrayBufferToHex(array.buffer);
}

// Create HMAC using Web Crypto API
async function createHMAC(key: string, data: string): Promise<string> {
  const encoder = new TextEncoder();
  const keyData = encoder.encode(key);
  const dataBuffer = encoder.encode(data);
  
  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    keyData,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  
  const signature = await crypto.subtle.sign('HMAC', cryptoKey, dataBuffer);
  return arrayBufferToHex(signature);
}

export async function generateCSRFToken(): Promise<string> {
  const token = generateRandomHex(32);
  const timestamp = Date.now().toString();
  const hash = await createHMAC(CSRF_SECRET, token + timestamp);
  
  // Return token with timestamp and hash
  const tokenString = `${token}.${timestamp}.${hash}`;
  return btoa(tokenString);
}

export async function validateCSRFToken(token: string | null): Promise<boolean> {
  if (!token) return false;
  
  try {
    const decoded = atob(token);
    const [tokenPart, timestamp, hash] = decoded.split('.');
    
    if (!tokenPart || !timestamp || !hash) return false;
    
    // Check token age (24 hours)
    const tokenAge = Date.now() - parseInt(timestamp);
    if (tokenAge > 24 * 60 * 60 * 1000) return false;
    
    // Verify hash
    const expectedHash = await createHMAC(CSRF_SECRET, tokenPart + timestamp);
    
    // Timing-safe comparison
    if (hash.length !== expectedHash.length) return false;
    
    let result = 0;
    for (let i = 0; i < hash.length; i++) {
      result |= hash.charCodeAt(i) ^ expectedHash.charCodeAt(i);
    }
    
    return result === 0;
  } catch {
    return false;
  }
}

// Check if request should be protected by CSRF
export function requiresCSRFProtection(method: string): boolean {
  const protectedMethods = ['POST', 'PUT', 'PATCH', 'DELETE'];
  return protectedMethods.includes(method.toUpperCase());
}
