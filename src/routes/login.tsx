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
import { Car, Loader2 } from "lucide-react";
import { useAuthStore, type Role } from "@/store/auth";
import { useUIStore } from "@/store/ui";
import { toast } from "sonner";

export const Route = createFileRoute("/login")({ component: LoginPage });

const schema = z.object({
  phone: z.string().regex(/^\+?20\s?1[0-9]{1,2}\s?[0-9\s]{7,}$/, "أدخل رقم مصري صالح (+20 10x...)"),
  password: z.string().min(4, "كلمة المرور قصيرة"),
  remember: z.boolean().optional(),
});
type FormData = z.infer<typeof schema>;

function roleFromPhone(phone: string): Role {
  const clean = phone.replace(/\s/g, "");
  if (clean.startsWith("+20100")) return "admin";
  if (clean.startsWith("+20101")) return "agency";
  return "user";
}

function LoginPage() {
  const navigate = useNavigate();
  const login = useAuthStore((s) => s.login);
  const lang = useUIStore((s) => s.lang);
  const [loading, setLoading] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { phone: "+20 100 123 4567", password: "demo1234", remember: true },
  });

  const onSubmit = (data: FormData) => {
    setLoading(true);
    setTimeout(() => {
      const role = roleFromPhone(data.phone);
      login(role, data.phone);
      toast.success(lang === "ar" ? "مرحبًا بك مجددًا" : "Welcome back");
      navigate({ to: role === "admin" ? "/admin" : role === "agency" ? "/agency" : "/user" });
    }, 1000);
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
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label>{lang === "ar" ? "رقم الهاتف" : "Phone"}</Label>
              <Input dir="ltr" placeholder="+20 100 000 0000" {...register("phone")} />
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
              {lang === "ar" ? "تسجيل الدخول" : "Sign in"}
            </Button>
          </form>

          <div className="mt-6 rounded-lg border border-dashed p-3 text-xs text-muted-foreground space-y-1">
            <div className="font-medium text-foreground">{lang === "ar" ? "بيانات تجريبية:" : "Demo credentials:"}</div>
            <div>+20 100 xxx xxxx → Admin</div>
            <div>+20 101 xxx xxxx → Agency</div>
            <div>+20 1xx xxx xxxx → User</div>
            <div>{lang === "ar" ? "أي كلمة مرور 4 أحرف+" : "Any password 4+ chars"}</div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
