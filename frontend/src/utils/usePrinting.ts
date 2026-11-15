import { useEffect, useState } from "react";

// true while the browser prints the page (or saves it as PDF): sections that are
// folded or cut short on screen ("Show more") show everything on paper
export function usePrinting() {
  const [printing, setPrinting] = useState(false);

  useEffect(() => {
    const start = () => setPrinting(true);
    const end = () => setPrinting(false);

    window.addEventListener("beforeprint", start);
    window.addEventListener("afterprint", end);

    return () => {
      window.removeEventListener("beforeprint", start);
      window.removeEventListener("afterprint", end);
    };
  }, []);

  return printing;
}
