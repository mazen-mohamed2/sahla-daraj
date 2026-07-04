import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { FLAGS } from "@/lib/flags";

export const Route = createFileRoute("/agency")({
  beforeLoad: () => { if (!FLAGS.B2C) throw redirect({ to: "/admin" }); },
  component: () => <Outlet />,
});
