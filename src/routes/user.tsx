import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/user")({
  beforeLoad: () => {
    if (typeof window === "undefined") return;
    try {
      const raw = window.localStorage.getItem("cm-auth");
      const loggedIn = raw ? !!JSON.parse(raw)?.state?.isLoggedIn : false;
      if (!loggedIn) throw redirect({ to: "/login" });
    } catch (e) {
      if (e && typeof e === "object" && "to" in e) throw e;
    }
  },
  component: () => <Outlet />,
});
