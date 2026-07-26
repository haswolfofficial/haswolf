export const AUTH_RETURN_KEY = "haswolf_auth_return_to_v1";

export function sanitizeReturnTo(value: string | null | undefined) {
  if (!value || !value.startsWith("/") || value.startsWith("//")) return "/";
  return value;
}

export function rememberReturnTo(value?: string | null) {
  if (typeof window === "undefined") return;
  const target = sanitizeReturnTo(value || `${window.location.pathname}${window.location.search}${window.location.hash}`);
  sessionStorage.setItem(AUTH_RETURN_KEY, target);
}

export function consumeReturnTo(fallback = "/") {
  if (typeof window === "undefined") return fallback;
  const target = sanitizeReturnTo(sessionStorage.getItem(AUTH_RETURN_KEY) || fallback);
  sessionStorage.removeItem(AUTH_RETURN_KEY);
  return target;
}
