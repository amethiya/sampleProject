import { useEffect, useState } from "react";

export function navigate(to: string) {
  if (to === location.pathname) return;
  history.pushState(null, "", to);
  dispatchEvent(new PopStateEvent("popstate"));
  scrollTo(0, 0);
}

export function usePath(): string {
  const [path, setPath] = useState(location.pathname);
  useEffect(() => {
    const on = () => setPath(location.pathname);
    addEventListener("popstate", on);
    return () => removeEventListener("popstate", on);
  }, []);
  return path;
}

/** Internal link that navigates without a full reload. */
export function linkProps(to: string) {
  return {
    href: to,
    onClick: (e: { preventDefault(): void; metaKey: boolean; ctrlKey: boolean }) => {
      if (e.metaKey || e.ctrlKey) return;
      e.preventDefault();
      navigate(to);
    },
  };
}
