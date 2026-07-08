import { createFileRoute } from "@tanstack/react-router";
import { Route as UserProfileRoute } from "./user.profile";
// Reuse the same ProfileView by importing its component's shape.
// To keep it simple, duplicate a minimal admin variant.
import { useState } from "react";
import { DashboardLayout } from "@/components/dashboard-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuthStore } from "@/store/auth";
import { useUIStore } from "@/store/ui";
import { EG_CITIES, AVATAR_COLORS } from "@/store/settings";
import { t } from "@/lib/i18n";
import { Pencil, Shield, Users, Calendar } from "lucide-react";
import { toast } from "sonner";

void UserProfileRoute;

export const Route = createFileRoute("/admin/profile")({ component: AdminProfile });

function AdminProfile() {
  const auth = useAuthStore();
  const lang = useUIStore((s) => s.lang);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({
    name: auth.name, phone: auth.phone, email: auth.email,
    city: auth.city, bio: auth.bio, avatarColor: auth.avatarColor,
  });

  const save = () => {
    auth.updateProfile(form);
    setEditing(false);
    toast.success(lang === "ar" ? "تم الحفظ" : "Saved");
  };

  return (
    <DashboardLayout title={lang === "ar" ? "الملف الشخصي - المدير" : "Admin Profile"}>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader className="flex-row items-center justify-between">
            <CardTitle className="font-display">{lang === "ar" ? "معلومات المدير" : "Admin Info"}</CardTitle>
            {!editing ? (
              <Button size="sm" variant="outline" onClick={() => setEditing(true)}>
                <Pencil className="size-4 me-1" /> {t("common.edit", lang)}
              </Button>
            ) : (
              <div className="flex gap-2">
                <Button size="sm" onClick={save}>{t("common.save", lang)}</Button>
                <Button size="sm" variant="outline" onClick={() => setEditing(false)}>{t("common.cancel", lang)}</Button>
              </div>
            )}
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-4">
              <Avatar className="size-20">
                <AvatarFallback style={{ backgroundColor: form.avatarColor, color: "#fff", fontSize: 32 }}>
                  {form.name.charAt(0)}
                </AvatarFallback>
              </Avatar>
              {editing && (
                <div className="flex gap-2 flex-wrap">
                  {AVATAR_COLORS.map((c) => (
                    <button key={c} onClick={() => setForm({ ...form, avatarColor: c })}
                      className={`size-8 rounded-full border-2 transition-all ${form.avatarColor === c ? "border-foreground scale-110" : "border-transparent"}`}
                      style={{ backgroundColor: c }} />
                  ))}
                </div>
              )}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1"><Label>{t("common.name", lang)}</Label><Input value={form.name} disabled={!editing} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
              <div className="space-y-1"><Label>{t("common.phone", lang)}</Label><Input dir="ltr" value={form.phone} disabled={!editing} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></div>
              <div className="space-y-1"><Label>{lang === "ar" ? "البريد" : "Email"}</Label><Input type="email" dir="ltr" value={form.email} disabled={!editing} onChange={(e) => setForm({ ...form, email: e.target.value })} /></div>
              <div className="space-y-1">
                <Label>{lang === "ar" ? "المدينة" : "City"}</Label>
                <Select value={form.city} disabled={!editing} onValueChange={(v) => setForm({ ...form, city: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{EG_CITIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1 md:col-span-2"><Label>{lang === "ar" ? "نبذة" : "Bio"}</Label><Textarea rows={3} value={form.bio} disabled={!editing} onChange={(e) => setForm({ ...form, bio: e.target.value })} /></div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="font-display text-base">{lang === "ar" ? "صلاحيات المدير" : "Admin Stats"}</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between rounded-lg border p-3">
              <div className="flex items-center gap-2 text-sm"><Users className="size-4 text-primary" />{lang === "ar" ? "مستخدمون مُدارون" : "Users managed"}</div>
              <div className="font-bold">1,284</div>
            </div>
            <div className="flex items-center justify-between rounded-lg border p-3">
              <div className="flex items-center gap-2 text-sm"><Shield className="size-4 text-success" />{lang === "ar" ? "قرارات النزاعات" : "Disputes resolved"}</div>
              <div className="font-bold">47</div>
            </div>
            <div className="flex items-center justify-between rounded-lg border p-3">
              <div className="flex items-center gap-2 text-sm"><Calendar className="size-4 text-warning" />{lang === "ar" ? "منذ" : "Since"}</div>
              <div className="font-bold">2023</div>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
