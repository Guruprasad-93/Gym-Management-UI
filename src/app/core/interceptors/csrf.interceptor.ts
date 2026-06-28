import { HttpInterceptorFn } from '@angular/common/http';
import { environment } from '../../../environments/environment';

const MUTATING_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);

function readCookie(name: string): string | null {
  const escaped = name.replace(/([.$?*|{}()[\]\\/+^])/g, '\\$1');
  const match = document.cookie.match(new RegExp(`(?:^|; )${escaped}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : null;
}

function isAuthExempt(url: string): boolean {
  return (
    url.includes('/auth/csrf') ||
    url.includes('/auth/login') ||
    url.includes('/auth/forgot-password') ||
    url.includes('/auth/reset-password')
  );
}

/** Ensures mutating cookie-auth requests include X-XSRF-TOKEN (backend CSRF middleware). */
export const csrfInterceptor: HttpInterceptorFn = (req, next) => {
  if (!environment.useCookieAuth || !MUTATING_METHODS.has(req.method) || isAuthExempt(req.url)) {
    return next(req);
  }

  if (req.headers.has('X-XSRF-TOKEN')) {
    return next(req);
  }

  const token = readCookie('XSRF-TOKEN');
  if (!token) {
    return next(req);
  }

  return next(req.clone({ setHeaders: { 'X-XSRF-TOKEN': token } }));
};
