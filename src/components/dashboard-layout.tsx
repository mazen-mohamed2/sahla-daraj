import { type ReactNode } from "react";
import { Menu, Moon, Sun, Bell, Search, LogOut, Languages } from "lucide-react";
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { SidebarNav } from "./sidebar-nav";
import { useAuthStore } from "@/store/auth";
import { useUIStore } from "@/store/ui";
import { Car } from "lucide-react";
import { useNavigate } from "@tanstack/react-router";
import { t } from "@/lib/i18n";
import type { Currency } from "@/lib/format";

export function DashboardLayout({ children, title }: { children: ReactNode; title: string }) {
  const { role, name, avatar, avatarColor, logout } = useAuthStore();
  const { theme, toggleTheme, lang, toggleLang, currency, setCurrency } = useUIStore();
  const navigate = useNavigate();

  const roleLabel = t(`role.${role}`, lang);
  const fontClass = lang === "ar" ? "font-sans" : "";

  const handleLogout = () => {
    logout();
    navigate({ to: "/login" });
  };

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

          <Button variant="ghost" size="icon"><Bell className="size-5" /></Button>
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
