import { useNavigate } from "@tanstack/react-router";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useEffect } from "react";
import { useAuthStore } from "@/store/auth";
import { useUIStore } from "@/store/ui";
import {
  useNotifications,
  type AppNotification,
  CATEGORY_LABELS_AR,
  CATEGORY_LABELS_EN,
  formatRelative,
} from "@/store/notifications";

const ACTION_LABEL_AR: Record<string, string> = {
  escrow: "فتح الضمان",
  listing: "عرض الإعلان",
  conversation: "فتح المحادثة",
  import_request: "عرض الطلب",
  wallet_tx: "فتح المحفظة",
  token_tx: "محفظة التوكن",
  agency: "مراجعة المعرض",
  dispute: "فتح النزاع",
  withdrawal: "مراجعة السحب",
  kyc: "الملف الشخصي",
  user: "عرض المستخدم",
};
const ACTION_LABEL_EN: Record<string, string> = {
  escrow: "Open Escrow",
  listing: "View Listing",
  conversation: "Open Chat",
  import_request: "Open Request",
  wallet_tx: "View Wallet",
  token_tx: "Token Wallet",
  agency: "Review Agency",
  dispute: "Open Dispute",
  withdrawal: "Review Withdrawal",
  kyc: "Open Profile",
  user: "View User",
};

export function NotificationDialog({
  notification,
  onOpenChange,
}: {
  notification: AppNotification | null;
  onOpenChange: (open: boolean) => void;
}) {
  const navigate = useNavigate();
  const role = useAuthStore((s) => s.role);
  const lang = useUIStore((s) => s.lang);
  const markRead = useNotifications((s) => s.markRead);

  useEffect(() => {
    if (notification && !notification.read) markRead(role, notification.id);
  }, [notification, role, markRead]);

  if (!notification) return null;

  const labels = lang === "ar" ? CATEGORY_LABELS_AR : CATEGORY_LABELS_EN;
  const actionMap = lang === "ar" ? ACTION_LABEL_AR : ACTION_LABEL_EN;
  const actionLabel = notification.relatedEntityType
    ? actionMap[notification.relatedEntityType] ?? (lang === "ar" ? "فتح" : "Open")
    : lang === "ar" ? "فتح" : "Open";

  const open = () => {
    if (notification.actionUrl) {
      navigate({ to: notification.actionUrl });
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={!!notification} onOpenChange={onOpenChange}>
      <DialogContent dir={lang === "ar" ? "rtl" : "ltr"} className="max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2 mb-1">
            <Badge variant="secondary">{labels[notification.category]}</Badge>
            {notification.priority === "high" && (
              <Badge variant="destructive">{lang === "ar" ? "عاجل" : "High"}</Badge>
            )}
          </div>
          <DialogTitle className="text-start">{notification.title}</DialogTitle>
          <DialogDescription className="text-start">{notification.message}</DialogDescription>
        </DialogHeader>
        <div className="text-xs text-muted-foreground space-y-1">
          <div>{formatRelative(notification.createdAt, lang)}</div>
          {notification.actor && (
            <div>{lang === "ar" ? "من: " : "From: "}{notification.actor}</div>
          )}
          {notification.relatedEntityId && (
            <div className="font-mono">
              {lang === "ar" ? "المرجع: " : "Ref: "}
              {notification.relatedEntityId}
            </div>
          )}
        </div>
        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {lang === "ar" ? "إغلاق" : "Close"}
          </Button>
          {notification.actionUrl && <Button onClick={open}>{actionLabel}</Button>}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
