import { useRef, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Upload, ShieldCheck, ShieldAlert, ShieldQuestion, FileText } from "lucide-react";
import { useKycStore, KYC_STATUS_LABELS_AR, KYC_STATUS_TONE, type KycStatus } from "@/store/kyc";
import { useAuthStore } from "@/store/auth";
import { notify } from "@/store/notifications";
import { formatDate } from "@/services/mock-data";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

/**
 * KYC card for the User profile. UI-only; stores the filename and current
 * status in the persisted KYC store. Backend integration replaces the store
 * mutations with fetch calls to the same actions.
 */
export function KycCard() {
  const auth = useAuthStore();
  const requests = useKycStore((s) => s.requests);
  const submit = useKycStore((s) => s.submit);
  const mine = requests.find((r) => r.userId === auth.phone) ?? null;
  const status: KycStatus = mine?.status ?? "not_verified";
  const fileRef = useRef<HTMLInputElement>(null);
  const [pending, setPending] = useState(false);

  const onPick = () => fileRef.current?.click();

  const onFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setPending(true);
    setTimeout(() => {
      submit({ userId: auth.phone, userName: auth.name, userPhone: auth.phone, fileName: f.name });
      notify("admin", {
        title: "طلب توثيق جديد",
        message: `${auth.name} قدم طلب توثيق`,
        category: "account",
        relatedEntityType: "kyc",
        relatedEntityId: auth.phone,
        actionUrl: "/admin/kyc",
        priority: "medium",
      });
      toast.success("تم إرسال طلب التوثيق للمراجعة");
      setPending(false);
      if (fileRef.current) fileRef.current.value = "";
    }, 400);
  };

  const Icon = status === "verified" ? ShieldCheck : status === "rejected" ? ShieldAlert : status === "pending" ? FileText : ShieldQuestion;
  const iconColor =
    status === "verified" ? "text-success" :
    status === "rejected" ? "text-destructive" :
    status === "pending" ? "text-warning" :
    "text-muted-foreground";

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-display text-base flex items-center gap-2">
          <ShieldCheck className="size-4" /> توثيق الهوية (KYC)
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center gap-3 rounded-lg border p-3">
          <Icon className={cn("size-8", iconColor)} />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">الحالة:</span>
              <Badge variant="outline" className={cn("font-medium", KYC_STATUS_TONE[status])}>
                {KYC_STATUS_LABELS_AR[status]}
              </Badge>
            </div>
            {mine?.fileName && (
              <div className="text-xs text-muted-foreground mt-1 truncate">
                الوثيقة: <span className="font-mono">{mine.fileName}</span>
              </div>
            )}
            {mine?.submittedAt && (
              <div className="text-[11px] text-muted-foreground mt-0.5">
                قُدّم في {formatDate(mine.submittedAt)}
              </div>
            )}
          </div>
        </div>

        {status === "rejected" && mine?.rejectionReason && (
          <div className="rounded-lg border border-destructive/40 bg-destructive/5 p-3 text-sm text-destructive">
            <div className="font-semibold mb-1">سبب الرفض</div>
            <div className="text-xs leading-relaxed">{mine.rejectionReason}</div>
          </div>
        )}

        {status === "pending" ? (
          <p className="text-xs text-muted-foreground">
            طلبك قيد المراجعة من الإدارة. سيتم إشعارك فور اتخاذ القرار.
          </p>
        ) : (
          <>
            <input ref={fileRef} type="file" accept="image/*,.pdf" hidden onChange={onFile} />
            <Button onClick={onPick} disabled={pending} variant={status === "verified" ? "outline" : "default"} className="w-full">
              <Upload className="size-4 me-2" />
              {status === "verified" ? "استبدال الوثيقة" : status === "rejected" ? "إعادة رفع الوثيقة" : "رفع وثيقة الهوية"}
            </Button>
            <p className="text-[11px] text-muted-foreground text-center">
              نقبل صور الهوية الوطنية أو جواز السفر — بحد أقصى 5MB
            </p>
          </>
        )}
      </CardContent>
    </Card>
  );
}
