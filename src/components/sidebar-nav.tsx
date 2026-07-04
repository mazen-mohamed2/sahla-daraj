import { Link, useRouterState } from "@tanstack/react-router";
import {
  LayoutDashboard, Users, Car, Scale, Wallet, Building2, PackageCheck,
  Coins, MessagesSquare, Heart, ShoppingCart, PlusSquare, Ship,
} from "lucide-react";
import { useAuthStore } from "@/store/auth";
import { cn } from "@/lib/utils";

const NAV = {
  admin: [
    { to: "/admin", label: "نظرة عامة", icon: LayoutDashboard, exact: true },
    { to: "/admin/users", label: "المستخدمون", icon: Users },
    { to: "/admin/listings", label: "مراجعة الإعلانات", icon: Car },
    { to: "/admin/disputes", label: "النزاعات", icon: Scale },
    { to: "/admin/financial", label: "المالية", icon: Wallet },
    { to: "/admin/agencies", label: "المعارض", icon: Building2 },
  ],
  agency: [
    { to: "/agency", label: "نظرة عامة", icon: LayoutDashboard, exact: true },
    { to: "/agency/inventory", label: "المخزون", icon: Car },
    { to: "/agency/add-listing", label: "إضافة إعلان", icon: PlusSquare },
    { to: "/agency/tokens", label: "رصيد التوكن", icon: Coins },
    { to: "/agency/bids", label: "طلبات الاستيراد", icon: PackageCheck },
    { to: "/agency/chat", label: "المحادثات", icon: MessagesSquare },
  ],
  user: [
    { to: "/user", label: "نظرة عامة", icon: LayoutDashboard, exact: true },
    { to: "/user/listings", label: "إعلاناتي", icon: Car },
    { to: "/user/create-listing", label: "إنشاء إعلان", icon: PlusSquare },
    { to: "/user/wallet", label: "المحفظة", icon: Wallet },
    { to: "/user/escrow", label: "الضمان", icon: ShoppingCart },
    { to: "/user/import-requests", label: "طلبات الاستيراد", icon: Ship },
    { to: "/user/favorites", label: "المفضلة", icon: Heart },
    { to: "/user/chat", label: "المحادثات", icon: MessagesSquare },
  ],
} as const;

export function SidebarNav({ onNavigate }: { onNavigate?: () => void }) {
  const role = useAuthStore((s) => s.role);
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
              "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
              active
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-sidebar-foreground hover:bg-sidebar-accent",
            )}
          >
            <Icon className="size-4 shrink-0" />
            <span className="truncate">{it.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
