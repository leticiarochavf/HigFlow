import type { ReactElement } from "react";

const ic = (d: string): ReactElement => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d={d} />
  </svg>
);

export const I = {
  home: ic("M3 11l9-7 9 7v9a1 1 0 0 1-1 1h-5v-6h-6v6H4a1 1 0 0 1-1-1z"),
  os: ic("M9 3h6v3H9zM7 4.5H5V21h14V4.5h-2M8.5 11h7M8.5 15h5"),
  users: ic("M16 20v-1a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v1M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8M22 20v-1a4 4 0 0 0-3-3.9M16 3.1a4 4 0 0 1 0 7.8"),
  repeat: ic("M17 2l4 4-4 4M3 11V9a3 3 0 0 1 3-3h15M7 22l-4-4 4-4M21 13v2a3 3 0 0 1-3 3H3"),
  cash: ic("M3 6h18v12H3zM12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6M6 9.5v.01M18 14.5v.01"),
  team: ic("M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8M4 21v-1a6 6 0 0 1 6-6h4a6 6 0 0 1 6 6v1"),
  tag: ic("M20.6 13.4l-7.2 7.2a2 2 0 0 1-2.8 0L3 13V3h10l7.6 7.6a2 2 0 0 1 0 2.8zM7.5 7.5h.01"),
  plus: ic("M12 5v14M5 12h14"),
  doc: ic("M7 3h8l4 4v14H7zM15 3v4h4M10 12h6M10 16h6"),
  more: ic("M5 12h.01M12 12h.01M19 12h.01"),
  chat: ic("M21 11.5a8.4 8.4 0 0 1-12.3 7.5L3 21l2-5.4A8.4 8.4 0 1 1 21 11.5z"),
  pin: ic("M12 21s-7-6.2-7-11a7 7 0 0 1 14 0c0 4.8-7 11-7 11zM12 12a2 2 0 1 0 0-4 2 2 0 0 0 0 4"),
  left: ic("M15 18l-6-6 6-6"),
  right: ic("M9 6l6 6-6 6"),
  x: ic("M6 6l12 12M18 6L6 18"),
  search: ic("M11 18a7 7 0 1 0 0-14 7 7 0 0 0 0 14zM21 21l-4.3-4.3"),
  check: ic("M5 12l5 5L20 7"),
  play: ic("M7 4l13 8-13 8z"),
  cal: ic("M4 6h16v15H4zM4 10h16M8 3v4M16 3v4"),
  edit: ic("M4 20h4L19 9l-4-4L4 16zM14 6l4 4"),
  trash: ic("M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3"),
  coin: ic("M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM15 9.5c-.5-1-1.6-1.5-3-1.5-1.7 0-3 .8-3 2s1.3 1.7 3 2 3 .8 3 2-1.3 2-3 2c-1.4 0-2.5-.5-3-1.5M12 6.5v11"),
  chart: ic("M4 20V11M10 20V5M16 20v-6M21 20H3"),
  bell: ic("M6 9a6 6 0 0 1 12 0c0 6 2.5 7.5 2.5 7.5h-17S6 15 6 9M10 20a2 2 0 0 0 4 0"),
};
