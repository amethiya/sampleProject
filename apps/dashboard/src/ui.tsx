/** Shared bits of the portal UI. */
export function Icon({ d, size = 18 }: { d: string; size?: number }) {
  return (
    <svg className="icon" viewBox="0 0 24 24" width={size} height={size} aria-hidden="true">
      <path d={d} />
    </svg>
  );
}
export const I = {
  search: "M11 18a7 7 0 1 0 0-14a7 7 0 0 0 0 14zM20 20l-4-4",
  radar: "M12 21a9 9 0 1 0 0-18a9 9 0 0 0 0 18zM12 16a4 4 0 1 0 0-8a4 4 0 0 0 0 8zM12 12l6-4",
  plus: "M12 5v14M5 12h14",
  sheet: "M4 4h16v16H4zM4 9h16M4 14h16M10 4v16",
  download: "M12 4v11M7 10l5 5l5-5M5 20h14",
  external: "M14 4h6v6M20 4l-9 9M18 14v6H4V6h6",
  back: "M19 12H5M11 6l-6 6l6 6",
  close: "M6 6l12 12M18 6L6 18",
  menu: "M4 7h16M4 12h16M4 17h16",
  leads: "M4 6h16M4 12h16M4 18h10",
  logout: "M15 4h4v16h-4M10 8l-4 4l4 4M6 12h10",
  copy: "M8 8h11v11H8zM5 16V5h11",
  check: "M5 12l5 5L20 7",
  sun: "M12 17a5 5 0 1 0 0-10a5 5 0 0 0 0 10zM12 1v2M12 21v2M4.2 4.2l1.4 1.4M18.4 18.4l1.4 1.4M1 12h2M21 12h2M4.2 19.8l1.4-1.4M18.4 5.6l1.4-1.4",
  moon: "M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z",
  monitor: "M3 4h18v12H3zM8 20h8M12 16v4",
  queue: "M4 5h16M4 10h16M4 15h10M4 20h6M18 14l3 3l-3 3",
  next: "M5 12h14M13 6l6 6l-6 6",
};
