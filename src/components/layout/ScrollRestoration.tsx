import { useEffect } from "react";
import { useLocation } from "react-router-dom";

/**
 * ScrollRestoration component that:
 * 1. Scrolls to top on route changes (when no hash present)
 * 2. Scrolls to anchor element when hash is present
 * 3. Respects scroll-margin-top for header offset
 */
export function ScrollRestoration() {
  const { pathname, hash } = useLocation();

  useEffect(() => {
    // Small delay to allow page to render
    const timeoutId = setTimeout(() => {
      if (hash) {
        // Scroll to anchor element
        const element = document.querySelector(hash);
        if (element) {
          element.scrollIntoView({ behavior: "smooth", block: "start" });
        }
      } else {
        // Scroll to top of page
        window.scrollTo({ top: 0, behavior: "instant" });
      }
    }, 10);

    return () => clearTimeout(timeoutId);
  }, [pathname, hash]);

  return null;
}
