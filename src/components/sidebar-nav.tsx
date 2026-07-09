import { Link, useRouterState } from "@tanstack/react-router";
import {
  LayoutDashboard, Users, Car, Scale, Wallet, Building2, PackageCheck,
  Coins, MessagesSquare, Heart, ShoppingCart, PlusSquare, Ship,
  UserCircle, Settings, FileText, Bell, type LucideIcon,
} from "lucide-react";
import { useAuthStore } from "@/store/auth";
import { useUIStore } from "@/store/ui";
import { t } from "@/lib/i18n";
import { cn } from "@/lib/utils";

type Item = { to: string; label: string; icon: LucideIcon; exact?: boolean };

const NAV: Record<"admin" | "agency" | "user", Item[]> = {
  admin: [
    { to: "/admin", label: "nav.overview", icon: LayoutDashboard, exact: true },
    { to: "/admin/users", label: "nav.users", icon: Users },
    { to: "/admin/listings", label: "nav.listings", icon: Car },
    { to: "/admin/import-requests", label: "nav.importRequests", icon: Ship },
    { to: "/admin/disputes", label: "nav.disputes", icon: Scale },
    { to: "/admin/financial", label: "nav.financial", icon: Wallet },
    { to: "/admin/agencies", label: "nav.agencies", icon: Building2 },
    { to: "/admin/profile", label: "nav.profile", icon: UserCircle },
    { to: "/admin/notifications", label: "nav.notifications", icon: Bell },
  ],
  agency: [
    { to: "/agency", label: "nav.overview", icon: LayoutDashboard, exact: true },
    { to: "/agency/inventory", label: "nav.inventory", icon: Car },
    { to: "/agency/listings", label: "nav.myListings", icon: FileText },
    { to: "/agency/add-listing", label: "nav.addListing", icon: PlusSquare },
    { to: "/agency/tokens", label: "nav.tokens", icon: Coins },
    { to: "/agency/bids", label: "nav.bids", icon: PackageCheck },
    { to: "/agency/chat", label: "nav.chat", icon: MessagesSquare },
    { to: "/agency/notifications", label: "nav.notifications", icon: Bell },
  ],
  user: [
    { to: "/user", label: "nav.overview", icon: LayoutDashboard, exact: true },
    { to: "/user/listings", label: "nav.myListings", icon: Car },
    { to: "/user/create-listing", label: "nav.createListing", icon: PlusSquare },
    { to: "/user/wallet", label: "nav.wallet", icon: Wallet },
    { to: "/user/escrow", label: "nav.escrow", icon: ShoppingCart },
    { to: "/user/import-requests", label: "nav.importRequests", icon: Ship },
    { to: "/user/favorites", label: "nav.favorites", icon: Heart },
    { to: "/user/chat", label: "nav.chat", icon: MessagesSquare },
    { to: "/user/notifications", label: "nav.notifications", icon: Bell },
    { to: "/user/profile", label: "nav.profile", icon: UserCircle },
    { to: "/user/settings", label: "nav.settings", icon: Settings },
  ],
};

export function SidebarNav({ onNavigate }: { onNavigate?: () => void }) {
  const role = useAuthStore((s) => s.role);
  const lang = useUIStore((s) => s.lang);
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const items = NAV[role];

  return (
    <nav className="flex flex-col gap-1 p-3">
      {items.map((it) => {
        const active = it.exact ? pathname === it.to : pathname.startsWith(it.to);
        const Icon = it.icon;
        return (
          <Link
            key={it.to}
            to={it.to}
            onClick={onNavigate}
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200",
              active
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-sidebar-foreground hover:bg-sidebar-accent hover:translate-x-0.5",
            )}
          >
            <Icon className="size-4 shrink-0" />
            <span className="truncate">{t(it.label, lang)}</span>
          </Link>
        );
      })}
    </nav>
  );
}
