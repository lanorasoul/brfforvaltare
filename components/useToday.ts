import { useEffect, useState } from "react";

/**
 * Dagens datum som ISO-sträng. Första renderingen använder värdet från servern så att servern och webbläsaren ritar samma bild,
 * därefter byts det mot webbläsarens riktiga datum.
 */
export function useToday(initial: string): string {
  const [today, setToday] = useState(initial);
  useEffect(() => {
    const d = new Date();
    setToday(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`);
  }, []);
  return today;
}
