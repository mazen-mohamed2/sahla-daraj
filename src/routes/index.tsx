import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  beforeLoad: () => {
    // SSR-safe: default to admin. Client will hydrate persisted role and can nav via the role switcher.
    let role: string = "admin";
    if (typeof window !== "undefined") {
      try {
        const raw = window.localStorage.getItem("cm-auth");
        if (raw) role = JSON.parse(raw)?.state?.role ?? "admin";
      } catch {}
    }
    throw redirect({ to: role === "agency" ? "/agency" : role === "user" ? "/user" : "/admin" });
  },
});
