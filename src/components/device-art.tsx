import { useId, type ReactNode } from "react";
import type { CategorySlug, Product } from "@/lib/types";
import { cn } from "@/lib/format";

/**
 * Generated product renders. No product photos ship with the site, so every
 * product is drawn as a soft-shaded SVG device using its `art.primary` (body)
 * and `art.accent` (screen glow) colours.
 *
 * All drawings share one 480×360 (4:3) canvas so they frame consistently in
 * cards, trays and heroes. Gradient ids are made unique per instance with
 * useId (plus a colour salt) so many renders can sit on one page.
 */

const W = 480;
const H = 360;
const FONT = "ui-sans-serif, system-ui, -apple-system, 'Segoe UI', sans-serif";

/* ---------------------------------------------------------------- colour */

function parseHex(hex: string): [number, number, number] | null {
  const m = /^#?([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(hex.trim());
  if (!m) return null;
  const h = m[1].length === 3 ? [...m[1]].map((c) => c + c).join("") : m[1];
  const n = parseInt(h, 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

function toHex([r, g, b]: [number, number, number]) {
  return `#${[r, g, b].map((v) => Math.round(Math.max(0, Math.min(255, v))).toString(16).padStart(2, "0")).join("")}`;
}

/** Blend a → b by t (0..1). */
function mix(a: string, b: string, t: number) {
  const ca = parseHex(a) ?? [0, 0, 0];
  const cb = parseHex(b) ?? [0, 0, 0];
  return toHex([ca[0] + (cb[0] - ca[0]) * t, ca[1] + (cb[1] - ca[1]) * t, ca[2] + (cb[2] - ca[2]) * t]);
}
const tint = (c: string, t: number) => mix(c, "#ffffff", t);
const shade = (c: string, t: number) => mix(c, "#000000", t);

function luminance(hex: string) {
  const [r, g, b] = parseHex(hex) ?? [0, 0, 0];
  return (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
}

interface Palette {
  body: string;
  bodyLight: string;
  bodyDark: string;
  /** metal frame / rim */
  edge: string;
  rimHi: string;
  accent: string;
  accentLight: string;
  accentDeep: string;
  screenDark: string;
  /** body is light (silver / white / pastel) */
  light: boolean;
  /** dark keys, cushions, silicone */
  soft: string;
}

function palette(primary: string, accent: string): Palette {
  const body = parseHex(primary) ? primary : "#2b2d33";
  const acc = parseHex(accent) ? accent : "#4f5bd5";
  const light = luminance(body) > 0.55;
  return {
    body,
    bodyLight: tint(body, light ? 0.55 : 0.2),
    bodyDark: shade(body, light ? 0.16 : 0.32),
    edge: light ? shade(body, 0.3) : tint(body, 0.16),
    rimHi: tint(body, light ? 0.8 : 0.45),
    accent: acc,
    accentLight: tint(acc, 0.45),
    accentDeep: shade(acc, 0.55),
    screenDark: mix(acc, "#05060a", 0.86),
    light,
    soft: mix(body, "#16171b", light ? 0.78 : 0.55),
  };
}

/* ----------------------------------------------------------- shared defs */

function SharedDefs({ p, c }: { p: string; c: Palette }) {
  return (
    <defs>
      <linearGradient id={`${p}-body`} x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor={c.bodyLight} />
        <stop offset="48%" stopColor={c.body} />
        <stop offset="100%" stopColor={c.bodyDark} />
      </linearGradient>
      <linearGradient id={`${p}-bodyV`} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor={c.bodyLight} />
        <stop offset="55%" stopColor={c.body} />
        <stop offset="100%" stopColor={c.bodyDark} />
      </linearGradient>
      {/* brushed-metal frame: bright edges, body in the middle */}
      <linearGradient id={`${p}-frame`} x1="0" y1="0" x2="1" y2="0">
        <stop offset="0%" stopColor={c.edge} />
        <stop offset="6%" stopColor={c.rimHi} />
        <stop offset="18%" stopColor={c.body} />
        <stop offset="82%" stopColor={c.body} />
        <stop offset="94%" stopColor={c.rimHi} />
        <stop offset="100%" stopColor={c.edge} />
      </linearGradient>
      <linearGradient id={`${p}-frameV`} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor={c.rimHi} />
        <stop offset="12%" stopColor={c.body} />
        <stop offset="100%" stopColor={c.bodyDark} />
      </linearGradient>
      <linearGradient id={`${p}-screen`} x1="0" y1="0" x2="0.55" y2="1">
        <stop offset="0%" stopColor={c.accent} />
        <stop offset="50%" stopColor={c.accentDeep} />
        <stop offset="100%" stopColor={c.screenDark} />
      </linearGradient>
      <radialGradient id={`${p}-blobA`}>
        <stop offset="0%" stopColor={c.accentLight} stopOpacity="0.95" />
        <stop offset="45%" stopColor={c.accent} stopOpacity="0.55" />
        <stop offset="100%" stopColor={c.accent} stopOpacity="0" />
      </radialGradient>
      <radialGradient id={`${p}-blobB`}>
        <stop offset="0%" stopColor={tint(c.accent, 0.7)} stopOpacity="0.7" />
        <stop offset="100%" stopColor={c.accent} stopOpacity="0" />
      </radialGradient>
      <linearGradient id={`${p}-glare`} x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor="#fff" stopOpacity="0.2" />
        <stop offset="45%" stopColor="#fff" stopOpacity="0.04" />
        <stop offset="100%" stopColor="#fff" stopOpacity="0" />
      </linearGradient>
      <linearGradient id={`${p}-spec`} x1="0" y1="0" x2="1" y2="0">
        <stop offset="0%" stopColor="#fff" stopOpacity="0" />
        <stop offset="50%" stopColor="#fff" stopOpacity={c.light ? 0.55 : 0.22} />
        <stop offset="100%" stopColor="#fff" stopOpacity="0" />
      </linearGradient>
      <radialGradient id={`${p}-lens`} cx="0.4" cy="0.38" r="0.65">
        <stop offset="0%" stopColor="#3b3f4c" />
        <stop offset="55%" stopColor="#0d0e13" />
        <stop offset="100%" stopColor="#000" />
      </radialGradient>
      <radialGradient id={`${p}-ground`}>
        <stop offset="0%" stopColor="#0b0c10" stopOpacity="0.32" />
        <stop offset="55%" stopColor="#0b0c10" stopOpacity="0.12" />
        <stop offset="100%" stopColor="#0b0c10" stopOpacity="0" />
      </radialGradient>
      <radialGradient id={`${p}-cup`} cx="0.38" cy="0.3" r="0.8">
        <stop offset="0%" stopColor={c.bodyLight} />
        <stop offset="50%" stopColor={c.body} />
        <stop offset="100%" stopColor={c.bodyDark} />
      </radialGradient>
    </defs>
  );
}

/** Soft contact shadow under a device. */
function Ground({ p, cx, cy, rx, ry = 14 }: { p: string; cx: number; cy: number; rx: number; ry?: number }) {
  return (
    <>
      <ellipse cx={cx} cy={cy} rx={rx} ry={ry} fill={`url(#${p}-ground)`} />
      <ellipse cx={cx} cy={cy - 1} rx={rx * 0.7} ry={ry * 0.32} fill="#0b0c10" opacity={0.12} />
    </>
  );
}

/**
 * Glowing wallpaper: accent gradient, two soft light blooms, bottom vignette
 * and a diagonal glass reflection. Clipped to the rounded screen rect.
 */
function Wallpaper({
  p,
  id,
  x,
  y,
  w,
  h,
  r,
  children,
}: {
  p: string;
  id: string;
  x: number;
  y: number;
  w: number;
  h: number;
  r: number;
  children?: ReactNode;
}) {
  const clip = `${p}-${id}`;
  const m = Math.max(w, h);
  return (
    <g>
      <clipPath id={clip}>
        <rect x={x} y={y} width={w} height={h} rx={r} />
      </clipPath>
      <g clipPath={`url(#${clip})`}>
        <rect x={x} y={y} width={w} height={h} fill={`url(#${p}-screen)`} />
        <circle cx={x + w * 0.18} cy={y + h * 0.12} r={m * 0.6} fill={`url(#${p}-blobA)`} />
        <circle cx={x + w * 0.92} cy={y + h * 0.78} r={m * 0.5} fill={`url(#${p}-blobB)`} />
        <rect x={x} y={y + h * 0.55} width={w} height={h * 0.45} fill="#000" opacity={0.18} />
        {children}
        <path d={`M${x} ${y} H${x + w * 0.62} L${x} ${y + h * 0.78} Z`} fill={`url(#${p}-glare)`} />
      </g>
    </g>
  );
}

/* ---------------------------------------------------------------- phone */

function Lens({ p, cx, cy, r, c }: { p: string; cx: number; cy: number; r: number; c: Palette }) {
  return (
    <g>
      <circle cx={cx} cy={cy + 1.2} r={r + 2.4} fill="#000" opacity={0.18} />
      <circle cx={cx} cy={cy} r={r + 2.4} fill={`url(#${p}-frameV)`} />
      <circle cx={cx} cy={cy} r={r} fill={`url(#${p}-lens)`} />
      <circle cx={cx} cy={cy} r={r * 0.52} fill="#05060a" stroke="#2a2d36" strokeWidth={0.8} />
      <circle cx={cx - r * 0.22} cy={cy - r * 0.18} r={r * 0.3} fill={c.accent} opacity={0.28} />
      <circle cx={cx - r * 0.36} cy={cy - r * 0.4} r={Math.max(1, r * 0.13)} fill="#fff" opacity={0.75} />
    </g>
  );
}

function Phone({ p, c }: { p: string; c: Palette }) {
  // back (left, behind) and front (right) views
  const b = { x: 108, y: 26, w: 144, h: 296, r: 34 };
  const f = { x: 214, y: 40, w: 152, h: 306, r: 36 };
  return (
    <g>
      <Ground p={p} cx={240} cy={340} rx={170} ry={16} />

      {/* back */}
      <rect x={b.x} y={b.y} width={b.w} height={b.h} rx={b.r} fill={`url(#${p}-frame)`} />
      <rect x={b.x + 2.5} y={b.y + 2.5} width={b.w - 5} height={b.h - 5} rx={b.r - 2.5} fill={`url(#${p}-body)`} />
      <clipPath id={`${p}-backclip`}>
        <rect x={b.x + 2.5} y={b.y + 2.5} width={b.w - 5} height={b.h - 5} rx={b.r - 2.5} />
      </clipPath>
      <g clipPath={`url(#${p}-backclip)`}>
        <rect x={b.x + 18} y={b.y - 40} width={46} height={b.h + 80} fill={`url(#${p}-spec)`} transform={`rotate(18 ${b.x + 41} ${b.y + b.h / 2})`} />
      </g>
      <rect x={b.x + 2.5} y={b.y + 2.5} width={b.w - 5} height={b.h - 5} rx={b.r - 2.5} fill="none" stroke="#fff" strokeOpacity={c.light ? 0.6 : 0.14} strokeWidth={1} />
      {/* camera island */}
      <rect x={b.x + 12} y={b.y + 14} width={76} height={78} rx={24} fill="#000" opacity={0.14} transform="translate(0 2)" />
      <rect x={b.x + 12} y={b.y + 14} width={76} height={78} rx={24} fill={shade(c.body, c.light ? 0.06 : 0.12)} />
      <rect x={b.x + 12.5} y={b.y + 14.5} width={75} height={77} rx={23.5} fill="none" stroke="#fff" strokeOpacity={c.light ? 0.7 : 0.18} />
      <Lens p={p} c={c} cx={b.x + 35} cy={b.y + 36} r={12} />
      <Lens p={p} c={c} cx={b.x + 35} cy={b.y + 70} r={12} />
      <Lens p={p} c={c} cx={b.x + 66} cy={b.y + 53} r={11} />
      <circle cx={b.x + 67} cy={b.y + 27} r={4} fill="#fff4dc" stroke={c.edge} strokeWidth={0.8} />
      <circle cx={b.x + 67} cy={b.y + 80} r={2.2} fill="#0d0e13" />
      {/* subtle maker mark */}
      <circle cx={b.x + b.w / 2} cy={b.y + b.h * 0.6} r={9} fill="none" stroke="#fff" strokeOpacity={c.light ? 0.5 : 0.16} strokeWidth={1.2} />

      {/* front */}
      <rect x={f.x + f.w - 1} y={f.y + 92} width={4} height={44} rx={2} fill={c.edge} />
      <rect x={f.x + f.w - 1} y={f.y + 146} width={4} height={26} rx={2} fill={c.edge} />
      <rect x={f.x} y={f.y} width={f.w} height={f.h} rx={f.r} fill={`url(#${p}-frame)`} />
      <rect x={f.x + 3} y={f.y + 3} width={f.w - 6} height={f.h - 6} rx={f.r - 3} fill="#08090c" />
      <Wallpaper p={p} id="phscr" x={f.x + 9} y={f.y + 9} w={f.w - 18} h={f.h - 18} r={f.r - 9}>
        <text x={f.x + f.w / 2} y={f.y + 88} textAnchor="middle" fill="#fff" fillOpacity={0.92} fontFamily={FONT} fontSize={44} fontWeight={600} letterSpacing={-1.5}>
          9:41
        </text>
        <rect x={f.x + f.w / 2 - 30} y={f.y + 47} width={60} height={5} rx={2.5} fill="#fff" opacity={0.55} />
        {/* notification glass card */}
        <rect x={f.x + 20} y={f.y + 196} width={f.w - 40} height={40} rx={12} fill="#fff" opacity={0.14} />
        <rect x={f.x + 28} y={f.y + 205} width={22} height={22} rx={7} fill="#fff" opacity={0.3} />
        <rect x={f.x + 58} y={f.y + 207} width={56} height={5} rx={2.5} fill="#fff" opacity={0.7} />
        <rect x={f.x + 58} y={f.y + 218} width={40} height={4} rx={2} fill="#fff" opacity={0.4} />
        {/* lock-screen quick actions */}
        <circle cx={f.x + 34} cy={f.y + f.h - 46} r={13} fill="#fff" opacity={0.16} />
        <circle cx={f.x + f.w - 34} cy={f.y + f.h - 46} r={13} fill="#fff" opacity={0.16} />
        <rect x={f.x + f.w / 2 - 26} y={f.y + f.h - 20} width={52} height={4} rx={2} fill="#fff" opacity={0.7} />
      </Wallpaper>
      {/* dynamic island + status */}
      <rect x={f.x + f.w / 2 - 23} y={f.y + 17} width={46} height={14} rx={7} fill="#000" />
      <circle cx={f.x + f.w / 2 + 14} cy={f.y + 24} r={3} fill="#151722" />
      <rect x={f.x + 24} y={f.y + 21} width={18} height={5} rx={2.5} fill="#fff" opacity={0.85} />
      <rect x={f.x + f.w - 44} y={f.y + 21} width={20} height={5} rx={2.5} fill="#fff" opacity={0.85} />
      <rect x={f.x + 0.5} y={f.y + 0.5} width={f.w - 1} height={f.h - 1} rx={f.r - 0.5} fill="none" stroke="#fff" strokeOpacity={c.light ? 0.7 : 0.22} />
    </g>
  );
}

/* ---------------------------------------------------------------- laptop */

/** Point on a line between a and b. */
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

function Keyboard({ c }: { c: Palette }) {
  // keyboard well: trapezoid seen from the front at an angle
  const top = { y: 246, l: 120, r: 360 };
  const bot = { y: 278, l: 102, r: 378 };
  const rows = 5;
  const keys: string[] = [];
  for (let row = 0; row < rows; row++) {
    const t0 = row / rows + 0.02;
    const t1 = (row + 1) / rows - 0.03;
    const y0 = lerp(top.y, bot.y, t0);
    const y1 = lerp(top.y, bot.y, t1);
    const l0 = lerp(top.l, bot.l, t0);
    const r0 = lerp(top.r, bot.r, t0);
    const l1 = lerp(top.l, bot.l, t1);
    const r1 = lerp(top.r, bot.r, t1);
    // bottom row: modifiers + long space bar
    const splits = row === rows - 1 ? [0, 0.08, 0.16, 0.25, 0.7, 0.8, 0.9, 1] : Array.from({ length: 15 }, (_, i) => i / 14);
    for (let k = 0; k < splits.length - 1; k++) {
      const a = splits[k] + 0.006;
      const z = splits[k + 1] - 0.006;
      keys.push(
        `M${lerp(l0, r0, a).toFixed(1)} ${y0.toFixed(1)} L${lerp(l0, r0, z).toFixed(1)} ${y0.toFixed(1)} L${lerp(l1, r1, z).toFixed(1)} ${y1.toFixed(1)} L${lerp(l1, r1, a).toFixed(1)} ${y1.toFixed(1)} Z`,
      );
    }
  }
  return (
    <g>
      <path d={`M${top.l - 4} ${top.y - 3} L${top.r + 4} ${top.y - 3} L${bot.r + 5} ${bot.y + 2} L${bot.l - 5} ${bot.y + 2} Z`} fill={c.light ? shade(c.body, 0.1) : shade(c.body, 0.55)} />
      <path d={keys.join(" ")} fill={c.light ? c.soft : tint(c.body, 0.1)} />
    </g>
  );
}

function Laptop({ p, c }: { p: string; c: Palette }) {
  const lid = { x: 92, y: 30, w: 296, h: 198, r: 14 };
  const s = { x: lid.x + 12, y: lid.y + 13, w: lid.w - 24, h: lid.h - 24 };
  return (
    <g>
      <Ground p={p} cx={240} cy={316} rx={220} ry={16} />
      {/* lid */}
      <rect x={lid.x} y={lid.y} width={lid.w} height={lid.h} rx={lid.r} fill={`url(#${p}-frame)`} />
      <rect x={lid.x + 2.5} y={lid.y + 2.5} width={lid.w - 5} height={lid.h - 3} rx={lid.r - 2.5} fill="#08090c" />
      <Wallpaper p={p} id="lpscr" x={s.x} y={s.y} w={s.w} h={s.h} r={4}>
        {/* menu bar */}
        <rect x={s.x} y={s.y} width={s.w} height={9} fill="#000" opacity={0.22} />
        <rect x={s.x + 8} y={s.y + 3} width={22} height={3} rx={1.5} fill="#fff" opacity={0.6} />
        <rect x={s.x + s.w - 34} y={s.y + 3} width={26} height={3} rx={1.5} fill="#fff" opacity={0.6} />
        {/* app window */}
        <rect x={s.x + 46} y={s.y + 30} width={150} height={96} rx={7} fill="#fff" opacity={0.13} />
        <rect x={s.x + 46} y={s.y + 30} width={150} height={14} rx={7} fill="#fff" opacity={0.1} />
        <circle cx={s.x + 55} cy={s.y + 37} r={2.2} fill="#ff6b5e" />
        <circle cx={s.x + 62} cy={s.y + 37} r={2.2} fill="#ffbd44" />
        <circle cx={s.x + 69} cy={s.y + 37} r={2.2} fill="#2fc552" />
        <rect x={s.x + 56} y={s.y + 54} width={60} height={5} rx={2.5} fill="#fff" opacity={0.6} />
        <rect x={s.x + 56} y={s.y + 66} width={120} height={4} rx={2} fill="#fff" opacity={0.3} />
        <rect x={s.x + 56} y={s.y + 76} width={100} height={4} rx={2} fill="#fff" opacity={0.3} />
        <rect x={s.x + 56} y={s.y + 92} width={50} height={24} rx={5} fill={c.accentLight} opacity={0.55} />
        <rect x={s.x + 112} y={s.y + 92} width={50} height={24} rx={5} fill="#fff" opacity={0.18} />
        {/* side widget */}
        <rect x={s.x + 206} y={s.y + 30} width={50} height={50} rx={9} fill="#fff" opacity={0.15} />
        <rect x={s.x + 206} y={s.y + 86} width={50} height={40} rx={9} fill="#fff" opacity={0.1} />
        {/* dock */}
        <rect x={s.x + s.w / 2 - 54} y={s.y + s.h - 20} width={108} height={15} rx={6} fill="#fff" opacity={0.18} />
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <rect key={i} x={s.x + s.w / 2 - 48 + i * 16.5} y={s.y + s.h - 17} width={10} height={10} rx={3} fill="#fff" opacity={i === 2 ? 0.75 : 0.42} />
        ))}
      </Wallpaper>
      <rect x={lid.x + lid.w / 2 - 14} y={lid.y + 4} width={28} height={7} rx={3.5} fill="#000" />
      <circle cx={lid.x + lid.w / 2} cy={lid.y + 7.5} r={1.6} fill="#1b1e2a" />
      <rect x={lid.x + 0.5} y={lid.y + 0.5} width={lid.w - 1} height={lid.h - 1} rx={lid.r - 0.5} fill="none" stroke="#fff" strokeOpacity={c.light ? 0.6 : 0.16} />
      {/* hinge */}
      <rect x={lid.x + 10} y={lid.y + lid.h - 2} width={lid.w - 20} height={8} rx={2} fill={shade(c.body, 0.45)} />
      {/* deck */}
      <path d="M86 236 L394 236 Q402 236 405 242 L432 296 Q434 302 426 302 L54 302 Q46 302 48 296 L75 242 Q78 236 86 236 Z" fill={`url(#${p}-bodyV)`} />
      <path d="M86 236.8 L394 236.8" stroke="#fff" strokeOpacity={c.light ? 0.8 : 0.25} />
      <Keyboard c={c} />
      {/* trackpad */}
      <path d="M196 284 L284 284 L289 298 L191 298 Z" fill={shade(c.body, c.light ? 0.05 : 0.12)} stroke={shade(c.body, c.light ? 0.16 : 0.3)} strokeWidth={0.8} />
      {/* front lip */}
      <path d="M48 300 L432 300 L430 306 Q429 310 422 310 L58 310 Q51 310 50 306 Z" fill={c.bodyDark} />
      <path d="M214 300 L266 300 Q262 305 254 305 L226 305 Q218 305 214 300 Z" fill={shade(c.body, 0.45)} />
    </g>
  );
}

/* -------------------------------------------------------------------- TV */

function Tv({ p, c }: { p: string; c: Palette }) {
  const t = { x: 36, y: 34, w: 408, h: 232 };
  const s = { x: t.x + 6, y: t.y + 6, w: t.w - 12, h: t.h - 12 };
  const horizon = s.y + s.h * 0.62;
  return (
    <g>
      <Ground p={p} cx={240} cy={318} rx={130} ry={12} />
      {/* pedestal stand in body colour */}
      <path d="M222 262 L258 262 L262 306 L218 306 Z" fill={`url(#${p}-frame)`} />
      <rect x={160} y={302} width={160} height={11} rx={5.5} fill={`url(#${p}-bodyV)`} />
      <rect x={166} y={302.5} width={148} height={1.2} rx={0.6} fill="#fff" opacity={c.light ? 0.8 : 0.3} />
      {/* panel */}
      <rect x={t.x - 1} y={t.y - 1} width={t.w + 2} height={t.h + 2} rx={9} fill={c.edge} />
      <rect x={t.x} y={t.y} width={t.w} height={t.h} rx={8} fill="#0a0b0e" />
      <Wallpaper p={p} id="tvscr" x={s.x} y={s.y} w={s.w} h={s.h} r={3}>
        {/* sun + glow */}
        <circle cx={s.x + s.w * 0.68} cy={horizon - 26} r={70} fill={`url(#${p}-blobA)`} />
        <circle cx={s.x + s.w * 0.68} cy={horizon - 26} r={18} fill={tint(c.accent, 0.85)} />
        {/* layered hills */}
        <path
          d={`M${s.x} ${horizon} C ${s.x + 70} ${horizon - 36}, ${s.x + 140} ${horizon - 30}, ${s.x + 200} ${horizon - 8} S ${s.x + 330} ${horizon - 44}, ${s.x + s.w} ${horizon - 14} V ${s.y + s.h} H ${s.x} Z`}
          fill={shade(c.accent, 0.45)}
          opacity={0.85}
        />
        <path
          d={`M${s.x} ${horizon + 22} C ${s.x + 90} ${horizon - 4}, ${s.x + 170} ${horizon + 6}, ${s.x + 250} ${horizon + 24} S ${s.x + 350} ${horizon + 4}, ${s.x + s.w} ${horizon + 16} V ${s.y + s.h} H ${s.x} Z`}
          fill={shade(c.accent, 0.68)}
        />
        <path
          d={`M${s.x} ${horizon + 52} C ${s.x + 120} ${horizon + 30}, ${s.x + 260} ${horizon + 40}, ${s.x + s.w} ${horizon + 50} V ${s.y + s.h} H ${s.x} Z`}
          fill={c.screenDark}
        />
        {/* light reflection on water */}
        <rect x={s.x + s.w * 0.68 - 22} y={horizon + 30} width={44} height={2.5} rx={1.25} fill="#fff" opacity={0.35} />
        <rect x={s.x + s.w * 0.68 - 14} y={horizon + 37} width={28} height={2} rx={1} fill="#fff" opacity={0.25} />
      </Wallpaper>
      <rect x={t.x + 0.5} y={t.y + 0.5} width={t.w - 1} height={t.h - 1} rx={7.5} fill="none" stroke="#fff" strokeOpacity={0.12} />
      <circle cx={240} cy={t.y + t.h - 3} r={1.4} fill={c.accentLight} opacity={0.9} />
    </g>
  );
}

/* ------------------------------------------------------------ headphones */

function OverEar({ p, c }: { p: string; c: Palette }) {
  const cup = (cx: number, dir: 1 | -1) => (
    <g>
      {/* slider + yoke */}
      <rect x={cx - 3 + dir * 6} y={150} width={6} height={36} rx={3} fill={`url(#${p}-frameV)`} />
      <path d={`M${cx - 40} 196 Q ${cx} 166 ${cx + 40} 196`} fill="none" stroke={c.edge} strokeWidth={6} strokeLinecap="round" />
      {/* ear cushion, visible on the side facing the head */}
      <ellipse cx={cx + dir * 18} cy={252} rx={44} ry={70} fill={c.soft} />
      <ellipse cx={cx + dir * 26} cy={252} rx={28} ry={56} fill="#000" opacity={0.22} />
      {/* outer shell */}
      <ellipse cx={cx - dir * 2} cy={254} rx={50} ry={70} fill={c.bodyDark} />
      <ellipse cx={cx - dir * 3} cy={251} rx={47} ry={67} fill={`url(#${p}-cup)`} />
      {/* face plate with a soft seam */}
      <ellipse cx={cx - dir * 4} cy={252} rx={35} ry={52} fill={c.body} opacity={0.7} />
      <ellipse cx={cx - dir * 4} cy={252} rx={35} ry={52} fill="none" stroke={shade(c.body, c.light ? 0.16 : 0.45)} strokeWidth={1.2} />
      <ellipse cx={cx - dir * 4} cy={253.2} rx={35} ry={52} fill="none" stroke="#fff" strokeOpacity={c.light ? 0.8 : 0.12} strokeWidth={0.8} />
      {/* specular */}
      <ellipse cx={cx - 16} cy={214} rx={14} ry={24} fill="#fff" opacity={c.light ? 0.55 : 0.16} transform={`rotate(-16 ${cx - 16} 214)`} />
      {/* ANC mic slot + status light in the accent colour */}
      <rect x={cx - dir * 4 - 8} y={292} width={16} height={4} rx={2} fill={shade(c.body, c.light ? 0.25 : 0.5)} />
      <circle cx={cx - dir * 4} cy={206} r={2.4} fill={c.accent} />
      <circle cx={cx - dir * 4} cy={206} r={6} fill={c.accent} opacity={0.18} />
    </g>
  );
  return (
    <g>
      <Ground p={p} cx={240} cy={330} rx={170} ry={14} />
      {/* headband: outer shell + inner cushion */}
      <path d="M138 176 C 138 64, 342 64, 342 176" fill="none" stroke={c.bodyDark} strokeWidth={28} strokeLinecap="round" />
      <path d="M138 175 C 138 64, 342 64, 342 175" fill="none" stroke={`url(#${p}-bodyV)`} strokeWidth={24} strokeLinecap="round" />
      <path d="M146 172 C 148 84, 332 84, 334 172" fill="none" stroke={c.soft} strokeWidth={10} strokeLinecap="round" />
      <path d="M150 120 C 175 82, 305 82, 330 120" fill="none" stroke="#fff" strokeOpacity={c.light ? 0.75 : 0.22} strokeWidth={3} strokeLinecap="round" />
      {cup(150, 1)}
      {cup(330, -1)}
    </g>
  );
}

function Bud({ p, c, x, y, flip }: { p: string; c: Palette; x: number; y: number; flip?: boolean }) {
  return (
    <g transform={`translate(${x} ${y}) rotate(${flip ? 14 : -14}) scale(${flip ? -1 : 1} 1)`}>
      {/* stem */}
      <rect x={-9} y={6} width={18} height={78} rx={9} fill={`url(#${p}-frame)`} />
      <rect x={-5} y={70} width={10} height={9} rx={4} fill={c.edge} opacity={0.7} />
      {/* head + silicone tip */}
      <ellipse cx={16} cy={-6} rx={14} ry={13} fill={c.soft} />
      <circle cx={0} cy={0} r={27} fill={`url(#${p}-cup)`} />
      <ellipse cx={8} cy={-8} rx={11} ry={8} fill="#07080b" opacity={0.85} />
      <ellipse cx={8} cy={-8} rx={6} ry={4} fill={c.accent} opacity={0.5} />
      <ellipse cx={-10} cy={-12} rx={8} ry={5} fill="#fff" opacity={c.light ? 0.7 : 0.2} transform="rotate(-30 -10 -12)" />
    </g>
  );
}

function Earbuds({ p, c }: { p: string; c: Palette }) {
  const k = { x: 168, y: 186, w: 144, h: 118 };
  return (
    <g>
      <Ground p={p} cx={240} cy={318} rx={190} ry={13} />
      {/* case */}
      <rect x={k.x} y={k.y} width={k.w} height={k.h} rx={46} fill={c.bodyDark} />
      <rect x={k.x + 1.5} y={k.y} width={k.w - 3} height={k.h - 3} rx={45} fill={`url(#${p}-body)`} />
      <path d={`M${k.x + 4} ${k.y + 40} H${k.x + k.w - 4}`} stroke={shade(c.body, c.light ? 0.2 : 0.4)} strokeWidth={1.4} />
      <path d={`M${k.x + 8} ${k.y + 41.5} H${k.x + k.w - 8}`} stroke="#fff" strokeOpacity={c.light ? 0.8 : 0.15} strokeWidth={1} />
      <rect x={k.x + 22} y={k.y + 8} width={k.w - 44} height={16} rx={8} fill="#fff" opacity={c.light ? 0.55 : 0.12} />
      <circle cx={k.x + k.w / 2} cy={k.y + 62} r={3} fill={c.accentLight} />
      <circle cx={k.x + k.w / 2} cy={k.y + 62} r={7} fill={c.accent} opacity={0.18} />
      {/* buds standing in front */}
      <Bud p={p} c={c} x={112} y={210} />
      <Bud p={p} c={c} x={368} y={210} flip />
    </g>
  );
}

/* ---------------------------------------------------------------- tablet */

function TabletArt({ p, c }: { p: string; c: Palette }) {
  const t = { x: 58, y: 34, w: 336, h: 256, r: 24 };
  const s = { x: t.x + 13, y: t.y + 13, w: t.w - 26, h: t.h - 26 };
  const tiles = [
    { x: 16, y: 24, w: 128, h: 82, o: 0.16 },
    { x: 154, y: 24, w: 62, h: 82, o: 0.12 },
    { x: 226, y: 24, w: 62, h: 38, o: 0.18 },
    { x: 226, y: 68, w: 62, h: 38, o: 0.12 },
  ];
  return (
    <g>
      <Ground p={p} cx={236} cy={312} rx={200} ry={14} />
      <rect x={t.x} y={t.y} width={t.w} height={t.h} rx={t.r} fill={`url(#${p}-frame)`} />
      <rect x={t.x + 3} y={t.y + 3} width={t.w - 6} height={t.h - 6} rx={t.r - 3} fill="#08090c" />
      <Wallpaper p={p} id="tbscr" x={s.x} y={s.y} w={s.w} h={s.h} r={12}>
        <rect x={s.x + 16} y={s.y + 10} width={24} height={4} rx={2} fill="#fff" opacity={0.7} />
        <rect x={s.x + s.w - 40} y={s.y + 10} width={24} height={4} rx={2} fill="#fff" opacity={0.7} />
        {tiles.map((g, i) => (
          <rect key={i} x={s.x + g.x} y={s.y + g.y} width={g.w} height={g.h} rx={12} fill="#fff" opacity={g.o} />
        ))}
        <text x={s.x + 28} y={s.y + 62} fill="#fff" fillOpacity={0.92} fontFamily={FONT} fontSize={26} fontWeight={600} letterSpacing={-0.8}>
          9:41
        </text>
        <rect x={s.x + 28} y={s.y + 74} width={56} height={4} rx={2} fill="#fff" opacity={0.45} />
        {/* app grid */}
        {Array.from({ length: 12 }, (_, i) => (
          <rect key={i} x={s.x + 26 + (i % 6) * 44} y={s.y + 126 + Math.floor(i / 6) * 40} width={24} height={24} rx={7} fill="#fff" opacity={0.24} />
        ))}
        <rect x={s.x + s.w / 2 - 70} y={s.y + s.h - 30} width={140} height={22} rx={9} fill="#fff" opacity={0.18} />
      </Wallpaper>
      <circle cx={t.x + t.w / 2} cy={t.y + 7.5} r={2} fill="#1b1e2a" />
      <rect x={t.x + 0.5} y={t.y + 0.5} width={t.w - 1} height={t.h - 1} rx={t.r - 0.5} fill="none" stroke="#fff" strokeOpacity={c.light ? 0.7 : 0.2} />
      {/* stylus lying in front */}
      <g transform="rotate(-11 330 300)">
        <ellipse cx={330} cy={312} rx={110} ry={5} fill="#0b0c10" opacity={0.14} />
        <rect x={232} y={294} width={180} height={12} rx={6} fill="#f7f7f5" />
        <rect x={232} y={294} width={180} height={4} rx={2} fill="#fff" />
        <rect x={232} y={302} width={180} height={4} rx={2} fill="#d9dad6" />
        <rect x={396} y={294} width={3} height={12} fill={c.accent} opacity={0.6} />
        <path d="M232 294 L212 300 L232 306 Z" fill="#e6e6e2" />
        <path d="M216 299 L208 300.2 L216 301.4 Z" fill="#5a5d66" />
      </g>
    </g>
  );
}

/* --------------------------------------------------------------- monitor */

function MonitorArt({ p, c }: { p: string; c: Palette }) {
  const m = { x: 44, y: 26, w: 392, h: 226 };
  const s = { x: m.x + 7, y: m.y + 7, w: m.w - 14, h: m.h - 22 };
  return (
    <g>
      <Ground p={p} cx={240} cy={322} rx={120} ry={11} />
      {/* stand */}
      <path d="M222 236 L258 236 L264 312 L216 312 Z" fill={`url(#${p}-frame)`} />
      <path d="M180 308 Q240 300 300 308 L304 316 Q240 322 176 316 Z" fill={`url(#${p}-bodyV)`} />
      <path d="M186 308.6 Q240 301.6 294 308.6" fill="none" stroke="#fff" strokeOpacity={c.light ? 0.8 : 0.3} />
      {/* display */}
      <rect x={m.x} y={m.y} width={m.w} height={m.h} rx={10} fill={`url(#${p}-bodyV)`} />
      <rect x={m.x + 2} y={m.y + 2} width={m.w - 4} height={m.h - 15} rx={8} fill="#0a0b0e" />
      <Wallpaper p={p} id="mnscr" x={s.x} y={s.y} w={s.w} h={s.h} r={3}>
        {/* editor window */}
        <rect x={s.x + 24} y={s.y + 22} width={208} height={150} rx={8} fill="#0b0c12" opacity={0.55} />
        <rect x={s.x + 24} y={s.y + 22} width={208} height={16} rx={8} fill="#fff" opacity={0.08} />
        {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => (
          <rect
            key={i}
            x={s.x + 38 + (i % 3) * 10}
            y={s.y + 50 + i * 14}
            width={[90, 120, 60, 140, 80, 110, 50, 96][i]}
            height={4}
            rx={2}
            fill={i % 3 === 1 ? c.accentLight : "#fff"}
            opacity={i % 3 === 1 ? 0.8 : 0.35}
          />
        ))}
        {/* chart window */}
        <rect x={s.x + 244} y={s.y + 22} width={110} height={90} rx={8} fill="#fff" opacity={0.14} />
        <path
          d={`M${s.x + 254} ${s.y + 96} L${s.x + 274} ${s.y + 82} L${s.x + 292} ${s.y + 88} L${s.x + 314} ${s.y + 62} L${s.x + 342} ${s.y + 50}`}
          fill="none"
          stroke="#fff"
          strokeOpacity={0.85}
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <rect x={s.x + 244} y={s.y + 120} width={110} height={52} rx={8} fill="#fff" opacity={0.1} />
      </Wallpaper>
      <circle cx={240} cy={m.y + m.h - 6.5} r={1.6} fill={c.accentLight} />
      <rect x={m.x + 0.5} y={m.y + 0.5} width={m.w - 1} height={m.h - 1} rx={9.5} fill="none" stroke="#fff" strokeOpacity={c.light ? 0.7 : 0.16} />
    </g>
  );
}

/* ---------------------------------------------------------------- public */

export type DeviceVariant = "over-ear" | "earbuds";

/** Headphones: draw earbuds when the spec sheet says so. */
export function deviceVariant(product: Pick<Product, "category" | "specs">): DeviceVariant | undefined {
  if (product.category !== "headphones") return undefined;
  const type = String(product.specs.type ?? "").toLowerCase();
  return /earbud|in-ear|in ear|tws/.test(type) ? "earbuds" : "over-ear";
}

interface DeviceArtProps {
  category: CategorySlug;
  /** body colour (hex) */
  primary: string;
  /** screen glow / accent colour (hex) */
  accent: string;
  /** headphones only: draw earbuds + case instead of over-ears */
  variant?: DeviceVariant;
  className?: string;
  /** accessible name; omit for decorative use next to a visible product name */
  title?: string;
}

export function DeviceArt({ category, primary, accent, variant, className, title }: DeviceArtProps) {
  const salt = `${category}${variant ?? ""}${primary}${accent}`.replace(/[^a-zA-Z0-9]/g, "");
  const p = `da${useId().replace(/[^a-zA-Z0-9_-]/g, "")}${salt}`;
  const c = palette(primary, accent);

  let art: ReactNode;
  switch (category) {
    case "phones":
      art = <Phone p={p} c={c} />;
      break;
    case "laptops":
      art = <Laptop p={p} c={c} />;
      break;
    case "tvs":
      art = <Tv p={p} c={c} />;
      break;
    case "headphones":
      art = variant === "earbuds" ? <Earbuds p={p} c={c} /> : <OverEar p={p} c={c} />;
      break;
    case "tablets":
      art = <TabletArt p={p} c={c} />;
      break;
    case "monitors":
      art = <MonitorArt p={p} c={c} />;
      break;
  }

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      className={cn("block h-auto w-full select-none", className)}
      preserveAspectRatio="xMidYMid meet"
      {...(title ? { role: "img", "aria-label": title } : { "aria-hidden": true })}
    >
      {title && <title>{title}</title>}
      <SharedDefs p={p} c={c} />
      {art}
    </svg>
  );
}
