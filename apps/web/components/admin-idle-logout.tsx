"use client";

import { useEffect, useRef } from "react";
import { createClient } from "@/lib/supabase/client";

const IDLE_MS = 15 * 60 * 1000;
const MOUSEMOVE_THROTTLE_MS = 1000;

/**
 * Signs the user out after {@link IDLE_MS} with no pointer, keyboard, scroll, or touch activity.
 * Mounted only from the authenticated admin shell.
 */
export function AdminIdleLogout() {
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastMoveRef = useRef(0);

  useEffect(() => {
    function clearTimer() {
      if (timeoutRef.current !== null) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    }

    function schedule() {
      clearTimer();
      timeoutRef.current = setTimeout(() => {
        void (async () => {
          const supabase = createClient();
          await supabase.auth.signOut();
          window.location.assign("/admin/login?info=idle_timeout");
        })();
      }, IDLE_MS);
    }

    schedule();

    const onActivity = () => schedule();

    const onMouseMove = () => {
      const now = Date.now();
      if (now - lastMoveRef.current < MOUSEMOVE_THROTTLE_MS) return;
      lastMoveRef.current = now;
      schedule();
    };

    window.addEventListener("mousedown", onActivity);
    window.addEventListener("keydown", onActivity);
    window.addEventListener("scroll", onActivity, true);
    window.addEventListener("touchstart", onActivity);
    window.addEventListener("click", onActivity);
    window.addEventListener("mousemove", onMouseMove);

    return () => {
      clearTimer();
      window.removeEventListener("mousedown", onActivity);
      window.removeEventListener("keydown", onActivity);
      window.removeEventListener("scroll", onActivity, true);
      window.removeEventListener("touchstart", onActivity);
      window.removeEventListener("click", onActivity);
      window.removeEventListener("mousemove", onMouseMove);
    };
  }, []);

  return null;
}
