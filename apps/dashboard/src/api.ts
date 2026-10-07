export class Unauthorized extends Error {}

export async function api<T>(path: string, init: RequestInit = {}): Promise<T> {
  const res = await fetch(path, {
    ...init,
    credentials: "same-origin",
    headers: { "content-type": "application/json", ...init.headers },
  });
  if (res.status === 401) throw new Unauthorized((await res.json().catch(() => ({}))).error ?? "Sign in to continue.");
  if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error ?? `Request failed (${res.status})`);
  return res.json();
}

export interface PublicStats {
  audited: number;
  qualified: number;
  cities: number;
  showcase: { id: string; name: string; category: string; city: string; country: string; score: number }[];
}

export const CATEGORY_LABELS: Record<string, string> = {
  restaurant: "Restaurant",
  gym: "Gym",
  import_export: "Import & export",
  healthcare: "Healthcare",
  accounting: "Accounting",
};

const regionNames = (() => {
  try {
    return new Intl.DisplayNames(["en"], { type: "region" });
  } catch {
    return null;
  }
})();
export const countryName = (code: string) => regionNames?.of(code) ?? code;
