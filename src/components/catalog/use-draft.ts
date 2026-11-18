"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Local "draft" copy of a committed value (search text, slider position)
 * that commits after the user pauses, so typing and dragging stay instant
 * while the URL is only rewritten every `delay` ms.
 *
 * If `value` changes from outside (e.g. "Clear all"), the draft resets to it
 * and any pending commit is dropped. Our own commits don't reset it, so
 * keystrokes typed in the meantime are kept.
 */
export function useDraft<T>(
  value: T,
  onCommit: (value: T) => void,
  { delay = 250, equal = Object.is as (a: T, b: T) => boolean } = {},
) {
  const [draft, setDraftState] = useState(value);
  const [prevValue, setPrevValue] = useState(value);
  /** the last value we committed ourselves (state copy of the ref below, for render-time checks) */
  const [ownCommit, setOwnCommit] = useState(value);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const lastCommitted = useRef(value);
  const commitRef = useRef(onCommit);

  useEffect(() => {
    commitRef.current = onCommit;
  });
  useEffect(() => () => clearTimeout(timer.current), []);

  // When `value` changes and it isn't our own commit landing, adopt it
  // (React's "adjust state while rendering" pattern)…
  if (!equal(value, prevValue)) {
    setPrevValue(value);
    if (!equal(value, ownCommit)) {
      setOwnCommit(value);
      setDraftState(value);
    }
  }
  // …and cancel a pending commit of the now-stale draft.
  useEffect(() => {
    if (!equal(value, lastCommitted.current)) {
      clearTimeout(timer.current);
      lastCommitted.current = value;
    }
  }, [value, equal]);

  function commitNow(next: T) {
    clearTimeout(timer.current);
    lastCommitted.current = next;
    setOwnCommit(next);
    commitRef.current(next);
  }

  function setDraft(next: T) {
    setDraftState(next);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => commitNow(next), delay);
  }

  /** Commit the current draft immediately (e.g. on Enter or pointer up). */
  function flush(next: T = draft) {
    if (equal(next, lastCommitted.current)) clearTimeout(timer.current);
    else commitNow(next);
  }

  return [draft, setDraft, flush] as const;
}
