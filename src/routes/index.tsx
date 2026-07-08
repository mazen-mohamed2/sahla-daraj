import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  beforeLoad: () => {
    let role = "admin";
    let loggedIn = false;
    if (typeof window !== "undefined") {
      try {
        const raw = window.localStorage.getItem("cm-auth");
        if (raw) {
          const state = JSON.parse(raw)?.state ?? {};
          role = state.role ?? "admin";
          loggedIn = !!state.isLoggedIn;
        }
      } catch {}
    }
    if (!loggedIn) throw redirect({ to: "/login" });
    throw redirect({ to: role === "agency" ? "/agency" : role === "user" ? "/user" : "/admin" });
  },
});
