import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { generateCSRFToken, validateCSRFToken, requiresCSRFProtection } from '@/lib/csrf';

// Rate limiting using a simple in-memory store
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

// Clean up old entries periodically
setInterval(() => {
  const now = Date.now();
  const entries = Array.from(rateLimitStore.entries());
  for (const [key, value] of entries) {
    if (value.resetTime < now) {
      rateLimitStore.delete(key);
    }
  }
}, 60000); // Clean up every minute

export async function middleware(request: NextRequest) {
  const response = NextResponse.next();
  
  // Security Headers
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-XSS-Protection', '1; mode=block');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  
  // Content Security Policy
  const csp = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval'", // Note: unsafe-inline and unsafe-eval are needed for Next.js
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob: https:",
    "font-src 'self' data:",
    "connect-src 'self'",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'"
  ].join('; ');
  
  response.headers.set('Content-Security-Policy', csp);
  
  // CORS Headers for API routes
  if (request.nextUrl.pathname.startsWith('/api/')) {
    // Configure allowed origins - update this based on your deployment
    const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'];
    const origin = request.headers.get('origin');
    
    if (origin && allowedOrigins.includes(origin)) {
      response.headers.set('Access-Control-Allow-Origin', origin);
    }
    
    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-CSRF-Token');
    response.headers.set('Access-Control-Max-Age', '86400');
    
    // Handle preflight requests
    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 200, headers: response.headers });
    }
    
    // CSRF Protection for state-changing operations
    if (requiresCSRFProtection(request.method)) {
      const csrfToken = request.headers.get('x-csrf-token');
      
      const isValidToken = await validateCSRFToken(csrfToken);
      if (!isValidToken) {
        return new Response(JSON.stringify({ error: 'Invalid or missing CSRF token' }), {
          status: 403,
          headers: {
            'Content-Type': 'application/json',
            ...Object.fromEntries(response.headers.entries())
          }
        });
      }
    }
    
    // Rate Limiting for API routes
    const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'anonymous';
    const rateLimitKey = `${ip}:${request.nextUrl.pathname}`;
    const now = Date.now();
    const windowMs = 60 * 1000; // 1 minute window
    const maxRequests = 60; // 60 requests per minute
    
    let rateLimitInfo = rateLimitStore.get(rateLimitKey);
    
    if (!rateLimitInfo || rateLimitInfo.resetTime < now) {
      rateLimitInfo = {
        count: 1,
        resetTime: now + windowMs
      };
    } else {
      rateLimitInfo.count++;
    }
    
    rateLimitStore.set(rateLimitKey, rateLimitInfo);
    
    // Add rate limit headers
    response.headers.set('X-RateLimit-Limit', maxRequests.toString());
    response.headers.set('X-RateLimit-Remaining', Math.max(0, maxRequests - rateLimitInfo.count).toString());
    response.headers.set('X-RateLimit-Reset', new Date(rateLimitInfo.resetTime).toISOString());
    
    if (rateLimitInfo.count > maxRequests) {
      return new Response(JSON.stringify({ error: 'Too many requests' }), {
        status: 429,
        headers: {
          'Content-Type': 'application/json',
          ...Object.fromEntries(response.headers.entries())
        }
      });
    }
  }
  
  return response;
}

export const config = {
  matcher: [
    // Match all routes except static files
    '/((?!_next/static|_next/image|favicon.ico|images|robots.txt|sitemap.xml).*)',
  ],
};
