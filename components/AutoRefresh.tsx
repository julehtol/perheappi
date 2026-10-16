"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

/** Päivittää näkymän säännöllisesti ja kun sovellus avataan uudelleen, jotta muiden muutokset näkyvät. */
export function AutoRefresh({ seconds = 15 }: { seconds?: number }) {
  const router = useRouter();
  useEffect(() => {
    const tick = () => {
      if (document.visibilityState === "visible") router.refresh();
    };
    const id = window.setInterval(tick, seconds * 1000);
    document.addEventListener("visibilitychange", tick);
    window.addEventListener("focus", tick);
    return () => {
      window.clearInterval(id);
      document.removeEventListener("visibilitychange", tick);
      window.removeEventListener("focus", tick);
    };
  }, [router, seconds]);
  return null;
}
