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
    // Helper: detect if app is running as an installed PWA
    const isStandalone = () =>
      (window.matchMedia && window.matchMedia("(display-mode: standalone)").matches) ||
      // iOS Safari
      (navigator as any).standalone === true;

    // Helper: if there's a waiting SW, either auto-apply (standalone) or prompt (browser)
    const handleWaitingSW = (reg: ServiceWorkerRegistration) => {
      if (!reg.waiting) return;
      if (isStandalone()) {
        // Installed app: update immediately to keep users on latest
        reg.waiting.postMessage({ type: "SKIP_WAITING" });
        return;
      }
      const toastId = toast.info("A new version is available.", {
        action: {
          label: "Update",
          onClick: () => reg.waiting?.postMessage({ type: "SKIP_WAITING" }),
        },
        duration: 15000,
      });
      window.setTimeout(() => toast.dismiss(toastId as any), 16000);
    };

    const registerServiceWorker = async () => {
      try {
        const swUrl = `/sw.js?v=${process.env.NEXT_PUBLIC_APP_VERSION || 'dev'}`;
        registration = await navigator.serviceWorker.register(swUrl, {
          updateViaCache: "none",
          scope: "/",
        });

        // Proactively check for updates now and then periodically
        await registration.update();

        // If there's already a waiting service worker (from a previous visit), offer update
        if (registration.waiting) handleWaitingSW(registration);

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
              handleWaitingSW(registration!);
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

        // Check updates when user refocuses the app or it becomes visible again
        const onVisibilityChange = () => {
          if (document.visibilityState === "visible") {
            registration?.update().then(() => {
              if (registration) handleWaitingSW(registration);
            }).catch(() => {});
          }
        };
        const onFocus = () => {
          registration?.update().then(() => {
            if (registration) handleWaitingSW(registration);
          }).catch(() => {});
        };
        window.addEventListener("visibilitychange", onVisibilityChange);
        window.addEventListener("focus", onFocus);

        // Cleanup visibility/focus listeners on page unload
        window.addEventListener(
          "unload",
          () => {
            window.removeEventListener("visibilitychange", onVisibilityChange);
            window.removeEventListener("focus", onFocus);
          },
          { once: true }
        );
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
