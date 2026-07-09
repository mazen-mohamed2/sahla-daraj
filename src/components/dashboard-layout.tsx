import { type ReactNode, useMemo, useState } from "react";
import { Menu, Moon, Sun, Bell, Search, LogOut, Languages, ShieldCheck, MessageCircle, AlertTriangle, Wallet as WalletIcon, Car as CarIcon, Ship as ShipIcon, UserCog, Info } from "lucide-react";
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { SidebarNav } from "./sidebar-nav";
import { NotificationDialog } from "./notification-dialog";
import { useAuthStore } from "@/store/auth";
import { useUIStore } from "@/store/ui";
import {
  useNotifications,
  type AppNotification,
  type NotifCategory,
  CATEGORY_LABELS_AR,
  CATEGORY_LABELS_EN,
  formatRelative,
} from "@/store/notifications";
import { Car } from "lucide-react";
import { useNavigate } from "@tanstack/react-router";
import { t } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import type { Currency } from "@/lib/format";

const CAT_ICON: Record<NotifCategory, typeof Bell> = {
  escrow: ShieldCheck,
  listings: CarIcon,
  messages: MessageCircle,
  import: ShipIcon,
  wallet: WalletIcon,
  account: UserCog,
  system: Info,
};
const CAT_CLASS: Record<NotifCategory, string> = {
  escrow: "bg-warning/20 text-warning",
  listings: "bg-primary/20 text-primary",
  messages: "bg-primary/20 text-primary",
  import: "bg-info/20 text-info",
  wallet: "bg-success/20 text-success",
  account: "bg-muted text-muted-foreground",
  system: "bg-muted text-muted-foreground",
};

export function DashboardLayout({ children, title, headerAction }: { children: ReactNode; title: string; headerAction?: ReactNode }) {
  const { role, name, avatar, avatarColor, logout } = useAuthStore();
  const { theme, toggleTheme, lang, toggleLang, currency, setCurrency } = useUIStore();
  const feed = useNotifications((s) => s.feeds[role]);
  const markAllRead = useNotifications((s) => s.markAllRead);
  const unreadCount = feed.filter((n) => !n.read).length;
  const [selected, setSelected] = useState<AppNotification | null>(null);
  const [popoverOpen, setPopoverOpen] = useState(false);

  const grouped = useMemo(() => {
    const map = new Map<NotifCategory, AppNotification[]>();
    for (const n of feed) {
      const arr = map.get(n.category) ?? [];
      arr.push(n);
      map.set(n.category, arr);
    }
    return Array.from(map.entries());
  }, [feed]);

  const catLabels = lang === "ar" ? CATEGORY_LABELS_AR : CATEGORY_LABELS_EN;

  const navigate = useNavigate();

  const roleLabel = t(`role.${role}`, lang);
  const fontClass = lang === "ar" ? "font-sans" : "";

  const handleLogout = () => { logout(); navigate({ to: "/login" }); };

  return (
    <div dir={lang === "ar" ? "rtl" : "ltr"} className={`flex min-h-screen w-full bg-background ${fontClass}`}>
      <aside className={`hidden lg:flex w-72 shrink-0 flex-col ${lang === "ar" ? "border-l" : "border-r"} border-sidebar-border bg-sidebar`}>
        <div className="flex items-center gap-2 border-b border-sidebar-border p-4">
          <div className="grid size-9 place-items-center rounded-lg bg-primary text-primary-foreground">
            <Car className="size-5" />
          </div>
          <div className="min-w-0">
            <div className="font-display text-base font-bold text-sidebar-foreground">
              {lang === "ar" ? "سيارتي" : "Sayarti"}
            </div>
            <div className="text-xs text-muted-foreground">{roleLabel}</div>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto"><SidebarNav /></div>
        <div className="border-t border-sidebar-border p-3 space-y-2">
          <div className="flex items-center gap-3 rounded-lg bg-sidebar-accent p-2">
            <Avatar className="size-9">
              <AvatarFallback style={{ backgroundColor: avatarColor, color: "#fff" }}>{avatar}</AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <div className="truncate text-sm font-medium">{name}</div>
              <div className="truncate text-xs text-muted-foreground">{roleLabel}</div>
            </div>
          </div>
          <Button variant="ghost" size="sm" className="w-full justify-start" onClick={handleLogout}>
            <LogOut className="size-4 me-2" /> {t("common.logout", lang)}
          </Button>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-16 items-center gap-2 border-b bg-background/80 px-4 backdrop-blur lg:px-8">
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="lg:hidden"><Menu className="size-5" /></Button>
            </SheetTrigger>
            <SheetContent side={lang === "ar" ? "right" : "left"} className="w-72 p-0">
              <SheetTitle className="sr-only">{lang === "ar" ? "القائمة" : "Menu"}</SheetTitle>
              <SidebarNav />
            </SheetContent>
          </Sheet>

          <h1 className="font-display text-lg font-bold sm:text-xl truncate min-w-0 flex-1">{title}</h1>

          {headerAction}

          <div className="hidden md:flex items-center gap-2">
            <div className="relative">
              <Search className={`absolute ${lang === "ar" ? "right-3" : "left-3"} top-1/2 size-4 -translate-y-1/2 text-muted-foreground`} />
              <Input placeholder={t("common.search", lang)} className={`w-56 ${lang === "ar" ? "pr-9" : "pl-9"}`} />
            </div>
          </div>

          <Button variant="ghost" size="sm" onClick={toggleLang} className="gap-1 transition-all active:scale-95">
            <Languages className="size-4" />
            <span className="text-xs font-bold">{lang === "ar" ? "EN" : "AR"}</span>
          </Button>

          <Select value={currency} onValueChange={(v) => setCurrency(v as Currency)}>
            <SelectTrigger className="w-20 sm:w-24"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="EGP">EGP ج.م</SelectItem>
              <SelectItem value="USD">USD $</SelectItem>
              <SelectItem value="EUR">EUR €</SelectItem>
              <SelectItem value="SAR">SAR ر.س</SelectItem>
            </SelectContent>
          </Select>

          <Popover>
            <PopoverTrigger asChild>
              <Button variant="ghost" size="icon" className="relative">
                <Bell className="size-5" />
                {unreadCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 size-4 rounded-full bg-destructive text-[10px] font-bold text-destructive-foreground flex items-center justify-center">
                    {unreadCount}
                  </span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent align="end" className="w-80 p-0" dir="rtl">
              <div className="border-b p-4 flex items-center justify-between">
                <span className="font-semibold">الإشعارات</span>
                <Button variant="ghost" size="sm" onClick={markAllRead}>تحديد الكل كمقروء</Button>
              </div>
              <ScrollArea className="h-80">
                {notifications.map((n) => (
                  <div key={n.id} onClick={() => markRead(n.id)}
                    className={cn("flex gap-3 p-3 border-b last:border-0 cursor-pointer hover:bg-muted/50", !n.read && "bg-primary/5")}>
                    <div className={cn("size-8 rounded-full flex items-center justify-center shrink-0",
                      n.type === "escrow" && "bg-warning/20 text-warning",
                      n.type === "message" && "bg-primary/20 text-primary",
                      n.type === "dispute" && "bg-destructive/20 text-destructive",
                      n.type === "system" && "bg-muted text-muted-foreground")}>
                      {n.type === "escrow" && <ShieldCheck className="size-4" />}
                      {n.type === "message" && <MessageCircle className="size-4" />}
                      {n.type === "dispute" && <AlertTriangle className="size-4" />}
                      {n.type === "system" && <Bell className="size-4" />}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium leading-snug">{n.title}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{n.body}</p>
                      <p className="text-xs text-muted-foreground mt-1">{n.time}</p>
                    </div>
                    {!n.read && <div className="size-2 rounded-full bg-primary shrink-0 mt-1" />}
                  </div>
                ))}
              </ScrollArea>
              <div className="p-2 border-t">
                <Button variant="ghost" className="w-full text-sm">عرض كل الإشعارات</Button>
              </div>
            </PopoverContent>
          </Popover>

          <Button variant="ghost" size="icon" onClick={toggleTheme} className="transition-all active:scale-95">
            {theme === "light" ? <Moon className="size-5" /> : <Sun className="size-5" />}
          </Button>
        </header>

        <main key={title} className="flex-1 p-4 lg:p-8 animate-in fade-in-0 slide-in-from-bottom-2 duration-300">
          {children}
        </main>
      </div>
    </div>
  );
}
