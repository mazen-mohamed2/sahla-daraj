import { useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Car, Loader2, Shield, Building2, User } from "lucide-react";
import { useAuthStore, type Role } from "@/store/auth";
import { useUIStore } from "@/store/ui";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/login")({ component: LoginPage });

const schema = z.object({
  phone: z.string().regex(/^\+?20\s?1[0-9]{1,2}\s?[0-9\s]{7,}$/, "أدخل رقم مصري صالح (+20 1xx...)"),
  password: z.string().min(4, "كلمة المرور قصيرة"),
  remember: z.boolean().optional(),
});
type FormData = z.infer<typeof schema>;

const roleOptions: { role: Role; ar: string; en: string; icon: typeof User; phone: string }[] = [
  { role: "user", ar: "مستخدم", en: "User", icon: User, phone: "+20 102 123 4567" },
  { role: "agency", ar: "معرض", en: "Agency", icon: Building2, phone: "+20 101 123 4567" },
  { role: "admin", ar: "مشرف", en: "Admin", icon: Shield, phone: "+20 100 123 4567" },
];

function LoginPage() {
  const navigate = useNavigate();
  const login = useAuthStore((s) => s.login);
  const lang = useUIStore((s) => s.lang);
  const [loading, setLoading] = useState(false);
  const [selectedRole, setSelectedRole] = useState<Role>("user");

  const { register, handleSubmit, setValue, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { phone: "+20 102 123 4567", password: "demo1234", remember: true },
  });

  const pickRole = (role: Role) => {
    setSelectedRole(role);
    const opt = roleOptions.find((o) => o.role === role)!;
    setValue("phone", opt.phone, { shouldValidate: true });
  };

  const onSubmit = (data: FormData) => {
    setLoading(true);
    setTimeout(() => {
      login(selectedRole, data.phone);
      toast.success(lang === "ar" ? "مرحبًا بك مجددًا" : "Welcome back");
      navigate({ to: selectedRole === "admin" ? "/admin" : selectedRole === "agency" ? "/agency" : "/user" });
    }, 800);
  };

  return (
    <div dir={lang === "ar" ? "rtl" : "ltr"} className="min-h-screen grid place-items-center bg-gradient-to-br from-background via-background to-primary/5 p-4">
      <Card className="w-full max-w-md animate-in fade-in-0 slide-in-from-bottom-4 duration-500">
        <CardHeader className="text-center space-y-3">
          <div className="mx-auto grid size-14 place-items-center rounded-2xl bg-primary text-primary-foreground">
            <Car className="size-7" />
          </div>
          <CardTitle className="font-display text-3xl">{lang === "ar" ? "سيارتي" : "Sayarti"}</CardTitle>
          <p className="text-sm text-muted-foreground">
            {lang === "ar" ? "لوحة تحكم سوق السيارات" : "Car marketplace dashboard"}
          </p>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 mb-5">
            <Label>{lang === "ar" ? "اختر نوع الحساب" : "Account type"}</Label>
            <div className="grid grid-cols-3 gap-2">
              {roleOptions.map((opt) => {
                const Icon = opt.icon;
                const active = selectedRole === opt.role;
                return (
                  <button
                    key={opt.role}
                    type="button"
                    onClick={() => pickRole(opt.role)}
                    className={cn(
                      "flex flex-col items-center gap-1.5 rounded-lg border p-3 text-xs transition-all active:scale-95",
                      active
                        ? "border-primary bg-primary/10 text-primary shadow-sm"
                        : "border-border hover:border-primary/50 hover:bg-muted",
                    )}
                  >
                    <Icon className="size-5" />
                    <span className="font-medium">{lang === "ar" ? opt.ar : opt.en}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label>{lang === "ar" ? "رقم الهاتف" : "Phone"}</Label>
              <Input dir="ltr" placeholder="+20 1xx xxx xxxx" {...register("phone")} />
              {errors.phone && <p className="text-xs text-destructive">{errors.phone.message}</p>}
            </div>
            <div className="space-y-2">
              <Label>{lang === "ar" ? "كلمة المرور" : "Password"}</Label>
              <Input type="password" {...register("password")} />
              {errors.password && <p className="text-xs text-destructive">{errors.password.message}</p>}
            </div>
            <div className="flex items-center gap-2">
              <Checkbox id="remember" {...register("remember")} />
              <Label htmlFor="remember" className="text-sm font-normal">
                {lang === "ar" ? "تذكرني" : "Remember me"}
              </Label>
            </div>
            <Button type="submit" className="w-full active:scale-95 transition-transform" disabled={loading}>
              {loading && <Loader2 className="size-4 me-2 animate-spin" />}
              {lang === "ar"
                ? `دخول كـ ${roleOptions.find((o) => o.role === selectedRole)?.ar}`
                : `Sign in as ${roleOptions.find((o) => o.role === selectedRole)?.en}`}
            </Button>
          </form>

          <div className="mt-6 rounded-lg border border-dashed p-3 text-xs text-muted-foreground">
            {lang === "ar"
              ? "اختر نوع الحساب من الأعلى، أي كلمة مرور 4 أحرف فأكثر."
              : "Pick an account type above. Any password 4+ chars works."}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
