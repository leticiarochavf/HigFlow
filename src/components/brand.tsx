import { MARK_BR, MARK_SOFA, WM_A, WM_B } from "./brand-paths";

export function Mark({ w = 56, sw = 6 }: { w?: number; sw?: number }) {
  return (
    <svg width={w} height={(w * 76) / 200} viewBox="0 0 200 76" fill="none" stroke="var(--green)" strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d={MARK_BR} />
      <path d={MARK_SOFA} />
    </svg>
  );
}

export function Wordmark({ h = 24 }: { h?: number }) {
  return (
    <svg height={h} width={(h * 387.9) / 94.3} viewBox="6.1 -74.2 387.9 94.3" role="img" aria-label="HigFlow">
      <path className="wm-a" d={WM_A} />
      <path className="wm-b" d={WM_B} />
    </svg>
  );
}

export function BrandStack({ w = 96 }: { w?: number }) {
  return (
    <div className="brand-stack">
      <Mark w={w} />
      <Wordmark h={Math.round(w * 0.36)} />
    </div>
  );
}
