import { createElement } from "react";
import {
  AudioLines,
  BadgeIndianRupee,
  BatteryFull,
  Briefcase,
  Camera,
  Clapperboard,
  Dumbbell,
  Gamepad2,
  GraduationCap,
  Mic,
  MonitorPlay,
  Palette,
  PenTool,
  Plane,
  ShieldCheck,
  Sparkles,
  Sun,
  TrainFront,
  type LucideIcon,
} from "lucide-react";

/** Icon per "need" key from the category configs. Unknown keys fall back to Sparkles. */
const NEED_ICONS: Record<string, LucideIcon> = {
  photography: Camera,
  gaming: Gamepad2,
  "battery-life": BatteryFull,
  value: BadgeIndianRupee,
  "long-term": ShieldCheck,
  students: GraduationCap,
  creators: Palette,
  portability: Plane,
  movies: Clapperboard,
  "bright-room": Sun,
  commute: TrainFront,
  audiophile: AudioLines,
  calls: Mic,
  workout: Dumbbell,
  artists: PenTool,
  streaming: MonitorPlay,
  office: Briefcase,
};

export function needIcon(key: string): LucideIcon {
  return NEED_ICONS[key] ?? Sparkles;
}

/** Renders the icon for a need. A static component, so no component is created during render. */
export function NeedIcon({ need, className }: { need: string; className?: string }) {
  return createElement(NEED_ICONS[need] ?? Sparkles, { className, "aria-hidden": true });
}
