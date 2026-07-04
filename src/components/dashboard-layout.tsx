import { type ReactNode } from "react";
import { Menu, Moon, Sun, Bell, Search } from "lucide-react";
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { SidebarNav } from "./sidebar-nav";
import { useAuthStore, type Role } from "@/store/auth";
import { useUIStore } from "@/store/ui";
import { FLAGS } from "@/lib/flags";
import { Car } from "lucide-react";

export function DashboardLayout({ children, title }: { children: ReactNode; title: string }) {
  const { role, setRole, name, avatar } = useAuthStore();
  const { theme, toggleTheme } = useUIStore();

  const roleLabel = role === "admin" ? "المدير العام" : role === "agency" ? "معرض" : "مستخدم";

  return (
    <div dir="rtl" className="flex min-h-screen w-full bg-background">
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex w-72 shrink-0 flex-col border-l border-sidebar-border bg-sidebar">
        <div className="flex items-center gap-2 border-b border-sidebar-border p-4">
          <div className="grid size-9 place-items-center rounded-lg bg-primary text-primary-foreground">
            <Car className="size-5" />
          </div>
          <div className="min-w-0">
            <div className="font-display text-base font-bold text-sidebar-foreground">سيارتي</div>
            <div className="text-xs text-muted-foreground">لوحة {roleLabel}</div>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto"><SidebarNav /></div>
        <div className="border-t border-sidebar-border p-3">
          <div className="flex items-center gap-3 rounded-lg bg-sidebar-accent p-2">
            <Avatar className="size-9"><AvatarFallback className="bg-primary text-primary-foreground">{avatar}</AvatarFallback></Avatar>
            <div className="min-w-0 flex-1">
              <div className="truncate text-sm font-medium">{name}</div>
              <div className="truncate text-xs text-muted-foreground">{roleLabel}</div>
            </div>
          </div>
        </div>
      </aside>

      {/* Content */}
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b bg-background/80 px-4 backdrop-blur lg:px-8">
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="lg:hidden"><Menu className="size-5" /></Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-72 p-0">
              <SheetTitle className="sr-only">القائمة</SheetTitle>
              <SidebarNav />
            </SheetContent>
          </Sheet>

          <h1 className="font-display text-lg font-bold sm:text-xl truncate min-w-0 flex-1">{title}</h1>

          <div className="hidden md:flex items-center gap-2">
            <div className="relative">
              <Search className="absolute right-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input placeholder="بحث..." className="w-64 pr-9" />
            </div>
          </div>

          <Select value={role} onValueChange={(v) => setRole(v as Role)}>
            <SelectTrigger className="w-32 sm:w-40"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="admin">المدير العام</SelectItem>
              {FLAGS.B2C && <SelectItem value="agency">معرض</SelectItem>}
              <SelectItem value="user">مستخدم</SelectItem>
            </SelectContent>
          </Select>

          <Button variant="ghost" size="icon"><Bell className="size-5" /></Button>
          <Button variant="ghost" size="icon" onClick={toggleTheme}>
            {theme === "light" ? <Moon className="size-5" /> : <Sun className="size-5" />}
          </Button>
        </header>

        <main className="flex-1 p-4 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
