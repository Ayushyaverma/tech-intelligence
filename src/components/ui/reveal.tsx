"use client";

import { motion, useReducedMotion, type Variants } from "motion/react";
import type { ReactNode } from "react";

/** Elements Reveal/Stagger can render as. */
type Tag = "div" | "section" | "article" | "li" | "ul" | "ol" | "span" | "header" | "aside";

const EASE = [0.22, 1, 0.36, 1] as const;
const VIEWPORT = { once: true, margin: "0px 0px -8% 0px" } as const;

interface RevealProps {
  children: ReactNode;
  /** seconds */
  delay?: number;
  /** starting vertical offset in px */
  y?: number;
  className?: string;
  as?: Tag;
}

/** Fades + lifts its children in the first time they enter the viewport. */
export function Reveal({ children, delay = 0, y = 16, className, as = "div" }: RevealProps) {
  const reduce = useReducedMotion();
  const M = motion[as];
  return (
    <M
      className={className}
      data-reveal=""
      // Reduced motion: render in place with no fade, so nothing is ever hidden.
      initial={reduce ? false : { opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={VIEWPORT}
      transition={{ duration: reduce ? 0.01 : 0.6, delay: reduce ? 0 : delay, ease: EASE }}
    >
      {children}
    </M>
  );
}

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 14 },
  show: { opacity: 1, y: 0, transition: { duration: 0.55, ease: EASE } },
};
const reducedItemVariants: Variants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { duration: 0.01 } },
};

interface StaggerProps {
  children: ReactNode;
  className?: string;
  /** seconds between children */
  stagger?: number;
  as?: Tag;
}

/** Parent for StaggerItem children: reveals them one after another. */
export function Stagger({ children, className, stagger = 0.06, as = "div" }: StaggerProps) {
  const reduce = useReducedMotion();
  const M = motion[as];
  return (
    <M
      className={className}
      initial={reduce ? false : "hidden"}
      whileInView="show"
      viewport={VIEWPORT}
      variants={{ hidden: {}, show: { transition: { staggerChildren: reduce ? 0 : stagger } } }}
    >
      {children}
    </M>
  );
}

interface StaggerItemProps {
  children: ReactNode;
  className?: string;
  as?: Tag;
}

export function StaggerItem({ children, className, as = "div" }: StaggerItemProps) {
  const reduce = useReducedMotion();
  const M = motion[as];
  return (
    <M className={className} data-reveal="" variants={reduce ? reducedItemVariants : itemVariants}>
      {children}
    </M>
  );
}
