// gtag wrapper matching the xmas/lib/analytics.ts pattern used by /abc-ga.
// When NEXT_PUBLIC_GA_ID is set (G-XXXXXXXXXX), the GA snippet is injected
// in app/layout.tsx and gtag() calls become no-ops when not loaded.

export const GA_ID = process.env.NEXT_PUBLIC_GA_ID ?? "";

export function isAnalyticsEnabled(): boolean {
  return GA_ID.startsWith("G-");
}

type GtagArgs =
  | ["config", string, Record<string, unknown>?]
  | ["event", string, Record<string, unknown>?]
  | ["set", Record<string, unknown>]
  | ["consent", "default" | "update", Record<string, unknown>];

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: GtagArgs) => void;
  }
}

export function track(event: string, params?: Record<string, unknown>) {
  if (typeof window === "undefined" || !window.gtag) return;
  window.gtag("event", event, params);
}

export function pageview(path: string) {
  if (typeof window === "undefined" || !window.gtag) return;
  window.gtag("event", "page_view", { page_path: path });
}
