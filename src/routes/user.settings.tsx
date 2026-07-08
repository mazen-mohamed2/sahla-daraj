import { useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { DashboardLayout } from "@/components/dashboard-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useSettingsStore } from "@/store/settings";
import { useUIStore } from "@/store/ui";
import { useAuthStore } from "@/store/auth";
import { t } from "@/lib/i18n";
import type { Currency } from "@/lib/format";
import { toast } from "sonner";
import { Moon, Sun, Languages, KeyRound, Trash2 } from "lucide-react";

export const Route = createFileRoute("/user/settings")({ component: SettingsPage });

const pwSchema = z.object({
  current: z.string().min(4),
  next: z.string().min(6, "6 أحرف على الأقل"),
  confirm: z.string(),
}).refine((d) => d.next === d.confirm, { path: ["confirm"], message: "غير مطابقة" });
type PwForm = z.infer<typeof pwSchema>;

function SettingsPage() {
  const s = useSettingsStore();
  const ui = useUIStore();
  const logout = useAuthStore((a) => a.logout);
  const navigate = useNavigate();
  const [pwOpen, setPwOpen] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState("");
  const { lang } = ui;

  const { register, handleSubmit, formState: { errors }, reset } = useForm<PwForm>({
    resolver: zodResolver(pwSchema),
  });

  const changePassword = () => {
    toast.success(lang === "ar" ? "تم تحديث كلمة المرور" : "Password updated");
    setPwOpen(false); reset();
  };

  const deleteAccount = () => {
    if (deleteConfirm !== (lang === "ar" ? "حذف" : "DELETE")) {
      toast.error(lang === "ar" ? "الكلمة غير صحيحة" : "Wrong keyword");
      return;
    }
    logout();
    toast.warning(lang === "ar" ? "تم حذف الحساب" : "Account deleted");
    navigate({ to: "/login" });
  };

  const Row = ({ label, desc, checked, onChange }: { label: string; desc: string; checked: boolean; onChange: (v: boolean) => void }) => (
    <div className="flex items-center justify-between gap-4 py-3 border-b last:border-0">
      <div className="min-w-0">
        <div className="text-sm font-medium">{label}</div>
        <div className="text-xs text-muted-foreground">{desc}</div>
      </div>
      <Switch checked={checked} onCheckedChange={onChange} />
    </div>
  );

  return (
    <DashboardLayout title={t("nav.settings", lang)}>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader><CardTitle className="font-display">{lang === "ar" ? "الإشعارات" : "Notifications"}</CardTitle></CardHeader>
          <CardContent>
            <Row label={lang === "ar" ? "رسائل جديدة" : "New messages"} desc={lang === "ar" ? "إشعار عند وصول رسالة" : "When a message arrives"} checked={s.notifyMessages} onChange={(v) => s.set({ notifyMessages: v })} />
            <Row label={lang === "ar" ? "تحديثات الضمان" : "Escrow updates"} desc={lang === "ar" ? "تغييرات حالة الضمان" : "Escrow status changes"} checked={s.notifyEscrow} onChange={(v) => s.set({ notifyEscrow: v })} />
            <Row label={lang === "ar" ? "مشاهدات إعلاناتي" : "Listing views"} desc={lang === "ar" ? "عند مشاهدة إعلاناتك" : "When your listings are viewed"} checked={s.notifyViews} onChange={(v) => s.set({ notifyViews: v })} />
            <Row label={lang === "ar" ? "العروض والتخفيضات" : "Promotions"} desc={lang === "ar" ? "أخبار وعروض المنصة" : "Platform promotions"} checked={s.notifyPromotions} onChange={(v) => s.set({ notifyPromotions: v })} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="font-display">{lang === "ar" ? "الخصوصية" : "Privacy"}</CardTitle></CardHeader>
          <CardContent>
            <Row label={lang === "ar" ? "الهاتف للموثقين فقط" : "Phone to verified only"} desc={lang === "ar" ? "عرض رقمك للمشترين الموثقين" : "Show phone to verified buyers"} checked={s.privacyPhoneVerifiedOnly} onChange={(v) => s.set({ privacyPhoneVerifiedOnly: v })} />
            <Row label={lang === "ar" ? "ملف عام" : "Public profile"} desc={lang === "ar" ? "السماح للجميع بعرض ملفك" : "Anyone can view your profile"} checked={s.privacyPublicProfile} onChange={(v) => s.set({ privacyPublicProfile: v })} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="font-display">{lang === "ar" ? "المظهر" : "Appearance"}</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <Label className="flex items-center gap-2">{ui.theme === "light" ? <Sun className="size-4" /> : <Moon className="size-4" />}{lang === "ar" ? "الوضع الليلي" : "Dark mode"}</Label>
              <Switch checked={ui.theme === "dark"} onCheckedChange={ui.toggleTheme} />
            </div>
            <div className="flex items-center justify-between">
              <Label className="flex items-center gap-2"><Languages className="size-4" />{lang === "ar" ? "اللغة" : "Language"}</Label>
              <Button variant="outline" size="sm" onClick={ui.toggleLang}>{lang === "ar" ? "English" : "العربية"}</Button>
            </div>
            <div className="flex items-center justify-between">
              <Label>{lang === "ar" ? "العملة" : "Currency"}</Label>
              <Select value={ui.currency} onValueChange={(v) => ui.setCurrency(v as Currency)}>
                <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="EGP">EGP ج.م</SelectItem>
                  <SelectItem value="USD">USD $</SelectItem>
                  <SelectItem value="EUR">EUR €</SelectItem>
                  <SelectItem value="SAR">SAR ر.س</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="font-display">{lang === "ar" ? "الحساب" : "Account"}</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <Dialog open={pwOpen} onOpenChange={setPwOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" className="w-full justify-start"><KeyRound className="size-4 me-2" />{lang === "ar" ? "تغيير كلمة المرور" : "Change password"}</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>{lang === "ar" ? "تغيير كلمة المرور" : "Change password"}</DialogTitle></DialogHeader>
                <form onSubmit={handleSubmit(changePassword)} className="space-y-3">
                  <div><Label>{lang === "ar" ? "الحالية" : "Current"}</Label><Input type="password" {...register("current")} />{errors.current && <p className="text-xs text-destructive">{errors.current.message}</p>}</div>
                  <div><Label>{lang === "ar" ? "الجديدة" : "New"}</Label><Input type="password" {...register("next")} />{errors.next && <p className="text-xs text-destructive">{errors.next.message}</p>}</div>
                  <div><Label>{lang === "ar" ? "تأكيد" : "Confirm"}</Label><Input type="password" {...register("confirm")} />{errors.confirm && <p className="text-xs text-destructive">{errors.confirm.message}</p>}</div>
                  <DialogFooter><Button type="submit">{t("common.save", lang)}</Button></DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2 border-destructive/40">
          <CardHeader><CardTitle className="font-display text-destructive">{lang === "ar" ? "منطقة الخطر" : "Danger Zone"}</CardTitle></CardHeader>
          <CardContent>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive"><Trash2 className="size-4 me-2" />{lang === "ar" ? "حذف الحساب" : "Delete account"}</Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>{lang === "ar" ? "حذف نهائي للحساب" : "Delete account permanently"}</AlertDialogTitle>
                  <AlertDialogDescription>
                    {lang === "ar" ? `اكتب "حذف" للتأكيد. لا يمكن التراجع.` : `Type "DELETE" to confirm. This cannot be undone.`}
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <Input value={deleteConfirm} onChange={(e) => setDeleteConfirm(e.target.value)} placeholder={lang === "ar" ? "حذف" : "DELETE"} />
                <AlertDialogFooter>
                  <AlertDialogCancel>{t("common.cancel", lang)}</AlertDialogCancel>
                  <AlertDialogAction onClick={deleteAccount} className="bg-destructive hover:bg-destructive/90">
                    {t("common.confirm", lang)}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
