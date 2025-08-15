"use client";

import { useEffect, useRef } from "react";
import { toast } from "sonner";

/**
 * Manages service worker registration and update flow.
 * - Checks for updates on load and periodically
 * - Prompts user to update and reloads safely
 */
export function ServiceWorkerManager() {
  const updateCheckTimerRef = useRef<number | null>(null);

  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;

    let registration: ServiceWorkerRegistration | null = null;

    const registerServiceWorker = async () => {
      try {
        registration = await navigator.serviceWorker.register("/sw.js", {
          updateViaCache: "none",
          scope: "/",
        });

        // Proactively check for updates now and then periodically
        await registration.update();

        // If there's already a waiting service worker (from a previous visit), offer update
        if (registration.waiting) {
          const toastId = toast.info("A new version is ready.", {
            action: {
              label: "Update",
              onClick: () =>
                registration?.waiting?.postMessage({ type: "SKIP_WAITING" }),
            },
            duration: 15000,
          });
          window.setTimeout(() => toast.dismiss(toastId as any), 16000);
        }

        if (updateCheckTimerRef.current === null) {
          updateCheckTimerRef.current = window.setInterval(() => {
            registration?.update().catch(() => {});
          }, 60_000);
        }

        // When a new service worker is found
        registration.addEventListener("updatefound", () => {
          const installing = registration?.installing;
          if (!installing) return;
          installing.addEventListener("statechange", () => {
            if (
              installing.state === "installed" &&
              navigator.serviceWorker.controller // means a new SW is waiting
            ) {
              // Offer update to the user
              const toastId = toast.info("A new version is available.", {
                action: {
                  label: "Update",
                  onClick: () => {
                    // Tell the waiting SW to activate immediately
                    registration?.waiting?.postMessage({
                      type: "SKIP_WAITING",
                    });
                  },
                },
                duration: 15000,
              });

              // Auto-dismiss any previous toasts after some time
              window.setTimeout(() => toast.dismiss(toastId as any), 16000);
            }
          });
        });

        // When the active controller changes, the new SW took control → reload to get fresh app
        navigator.serviceWorker.addEventListener("controllerchange", () => {
          // Small delay to ensure the new SW controls the page
          setTimeout(() => {
            window.location.reload();
          }, 100);
        });
      } catch (err) {
        // Non-fatal: app should still work without SW
        // console.error("Service worker registration failed", err);
      }
    };

    // Register on page load to avoid blocking first paint
    if (document.readyState === "complete") {
      registerServiceWorker();
    } else {
      window.addEventListener("load", registerServiceWorker, { once: true });
    }

    return () => {
      if (updateCheckTimerRef.current !== null) {
        window.clearInterval(updateCheckTimerRef.current);
        updateCheckTimerRef.current = null;
      }
    };
  }, []);

  return null;
}
