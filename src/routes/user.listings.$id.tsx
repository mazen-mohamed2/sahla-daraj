import { useState } from "react";
import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { DashboardLayout } from "@/components/dashboard-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { StatusBadge } from "@/components/status-badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { ArrowRight, Pencil, Trash2, ShieldCheck, Star, Phone, Eye, ChevronLeft, ChevronRight } from "lucide-react";
import { mockListingDetail } from "@/services/mock-data";
import { useMoney, formatDateLoc } from "@/lib/format";
import { useUIStore } from "@/store/ui";
import { t } from "@/lib/i18n";
import { toast } from "sonner";

export const Route = createFileRoute("/user/listings/$id")({ component: ListingDetailPage });

const schema = z.object({
  title: z.string().min(3),
  price: z.coerce.number().positive(),
  mileage: z.coerce.number().min(0),
  color: z.string().min(1),
  description: z.string().min(5),
  status: z.enum(["active", "pending", "sold"]),
});
type FormData = z.infer<typeof schema>;

function ListingDetailPage() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const money = useMoney();
  const lang = useUIStore((s) => s.lang);
  const [detail, setDetail] = useState(() => mockListingDetail(id));
  const [editing, setEditing] = useState(false);
  const [phoneShown, setPhoneShown] = useState(false);
  const [imgIdx, setImgIdx] = useState(0);
  const [fullscreen, setFullscreen] = useState(false);

  const { register, handleSubmit, formState: { errors }, reset } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      title: detail.title, price: detail.price, mileage: detail.mileage,
      color: detail.color, description: detail.description,
      status: detail.status as "active" | "pending" | "sold",
    },
  });

  const onSave = (data: FormData) => {
    setDetail({ ...detail, ...data });
    setEditing(false);
    toast.success(lang === "ar" ? "تم حفظ التعديلات" : "Changes saved");
  };

  const onDelete = () => {
    toast.warning(lang === "ar" ? `تم حذف الإعلان ${id}` : `Listing ${id} deleted`);
    navigate({ to: "/user/listings" });
  };

  const Specs = ({ label, value }: { label: string; value: string | number }) => (
    <div className="rounded-lg border p-3">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="mt-1 font-semibold">{value}</div>
    </div>
  );

  return (
    <DashboardLayout title={detail.title}>
      <Button variant="ghost" size="sm" asChild className="mb-4">
        <Link to="/user/listings">
          <ArrowRight className={`size-4 ${lang === "ar" ? "ms-1 rotate-180" : "me-1"}`} />
          {t("common.back", lang)}
        </Link>
      </Button>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Gallery */}
          <Card className="overflow-hidden">
            <div className="relative">
              <img
                src={detail.images[imgIdx]}
                alt={detail.title}
                className="w-full h-80 object-cover cursor-zoom-in transition-opacity duration-300"
                onClick={() => setFullscreen(true)}
              />
              <Button size="icon" variant="secondary" className="absolute left-2 top-1/2 -translate-y-1/2"
                onClick={() => setImgIdx((i) => (i - 1 + detail.images.length) % detail.images.length)}>
                <ChevronLeft className="size-4" />
              </Button>
              <Button size="icon" variant="secondary" className="absolute right-2 top-1/2 -translate-y-1/2"
                onClick={() => setImgIdx((i) => (i + 1) % detail.images.length)}>
                <ChevronRight className="size-4" />
              </Button>
            </div>
            <div className="flex gap-2 p-3 overflow-x-auto">
              {detail.images.map((src, i) => (
                <button key={i} onClick={() => setImgIdx(i)}
                  className={`shrink-0 h-16 w-24 rounded overflow-hidden border-2 transition-all ${i === imgIdx ? "border-primary" : "border-transparent opacity-60 hover:opacity-100"}`}>
                  <img src={src} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          </Card>

          {/* Specs / Edit */}
          <Card>
            <CardHeader className="flex-row items-center justify-between">
              <CardTitle className="font-display">{lang === "ar" ? "المواصفات" : "Specifications"}</CardTitle>
              <div className="flex gap-2">
                {!editing ? (
                  <>
                    <Button size="sm" variant="outline" onClick={() => setEditing(true)}>
                      <Pencil className="size-4 me-1" /> {t("common.edit", lang)}
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button size="sm" variant="outline" className="text-destructive">
                          <Trash2 className="size-4 me-1" /> {t("common.delete", lang)}
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>{lang === "ar" ? "تأكيد الحذف" : "Confirm delete"}</AlertDialogTitle>
                          <AlertDialogDescription>
                            {lang === "ar" ? "هل أنت متأكد من حذف هذا الإعلان؟ لا يمكن التراجع." : "Are you sure? This cannot be undone."}
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>{t("common.cancel", lang)}</AlertDialogCancel>
                          <AlertDialogAction onClick={onDelete} className="bg-destructive hover:bg-destructive/90">
                            {t("common.delete", lang)}
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </>
                ) : (
                  <>
                    <Button size="sm" onClick={handleSubmit(onSave)}>{t("common.save", lang)}</Button>
                    <Button size="sm" variant="outline" onClick={() => { setEditing(false); reset(); }}>
                      {t("common.cancel", lang)}
                    </Button>
                  </>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {editing ? (
                <form className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2 space-y-1"><Label>{t("common.price", lang)}</Label><Input {...register("title")} />{errors.title && <p className="text-xs text-destructive">{errors.title.message}</p>}</div>
                  <div className="space-y-1"><Label>{lang === "ar" ? "السعر (ج.م)" : "Price (EGP)"}</Label><Input type="number" {...register("price")} /></div>
                  <div className="space-y-1"><Label>{lang === "ar" ? "الكيلومترات" : "Mileage"}</Label><Input type="number" {...register("mileage")} /></div>
                  <div className="space-y-1"><Label>{lang === "ar" ? "اللون" : "Color"}</Label><Input {...register("color")} /></div>
                  <div className="space-y-1">
                    <Label>{t("common.status", lang)}</Label>
                    <select {...register("status")} className="w-full h-9 rounded-md border bg-background px-3 text-sm">
                      <option value="active">active</option><option value="pending">pending</option><option value="sold">sold</option>
                    </select>
                  </div>
                  <div className="md:col-span-2 space-y-1"><Label>{lang === "ar" ? "الوصف" : "Description"}</Label><Textarea rows={4} {...register("description")} /></div>
                </form>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <Specs label={lang === "ar" ? "السنة" : "Year"} value={detail.year} />
                  <Specs label={lang === "ar" ? "كم" : "Mileage"} value={detail.mileage.toLocaleString()} />
                  <Specs label={lang === "ar" ? "اللون" : "Color"} value={detail.color} />
                  <Specs label={lang === "ar" ? "الوقود" : "Fuel"} value={detail.fuel} />
                  <Specs label={lang === "ar" ? "ناقل الحركة" : "Trans."} value={detail.transmission} />
                  <Specs label={lang === "ar" ? "الهيكل" : "Body"} value={detail.body_type} />
                  <Specs label={lang === "ar" ? "الأبواب" : "Doors"} value={detail.doors} />
                  <Specs label={lang === "ar" ? "الدفع" : "Drive"} value={detail.drive} />
                </div>
              )}
            </CardContent>
          </Card>

          {/* Chassis */}
          <Card>
            <CardContent className="p-5 flex items-center justify-between gap-3">
              <div>
                <div className="text-xs text-muted-foreground">{lang === "ar" ? "رقم الشاسيه" : "Chassis Number"}</div>
                <div className="font-mono font-semibold mt-1">{detail.chassis}</div>
              </div>
              <Badge className="bg-success/15 text-success border-success/30">
                <ShieldCheck className="size-3 me-1" />
                {lang === "ar" ? "موثق" : "Verified"}
              </Badge>
            </CardContent>
          </Card>

          {/* Description */}
          <Card>
            <CardHeader><CardTitle className="font-display">{lang === "ar" ? "الوصف" : "Description"}</CardTitle></CardHeader>
            <CardContent><p className="text-sm leading-relaxed text-muted-foreground">{detail.description}</p></CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          <Card>
            <CardContent className="p-5 space-y-3">
              <StatusBadge status={detail.status} />
              <div className="font-display text-4xl font-black text-primary">{money(detail.price)}</div>
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Eye className="size-3" /> {detail.views} {lang === "ar" ? "مشاهدة" : "views"}
              </div>
              <Button className="w-full active:scale-95 transition-transform" size="lg"
                onClick={() => toast.success(lang === "ar" ? "تم بدء الضمان" : "Escrow started")}>
                <ShieldCheck className="size-4 me-2" /> {lang === "ar" ? "بدء الضمان" : "Start Escrow"}
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="font-display text-base">{lang === "ar" ? "البائع" : "Seller"}</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <div className="font-semibold">{detail.seller.name}</div>
              <div className="flex items-center gap-1 text-sm">
                <Star className="size-4 fill-warning text-warning" /> {detail.seller.rating}
                <span className="text-muted-foreground ms-2">· {detail.seller.sales} {lang === "ar" ? "صفقة" : "sales"}</span>
              </div>
              <StartChatButton
                peer={{ id: `agency:${detail.seller.name}`, name: detail.seller.name, role: "agency", avatarColor: "#059669" }}
                related={{ kind: "listing", id: detail.id, label: `${detail.brand} ${detail.model} ${detail.year}`, meta: { price: detail.price } }}
                label={lang === "ar" ? "مراسلة البائع" : "Message seller"}
                variant="default"
                className="w-full"
              />
              {phoneShown ? (
                <div className="rounded-md bg-muted p-2 font-mono text-sm text-center">{detail.seller.phone}</div>
              ) : (
                <Button variant="outline" className="w-full" onClick={() => setPhoneShown(true)}>
                  <Phone className="size-4 me-2" />
                  {lang === "ar" ? "إظهار الرقم (بعد الضمان)" : "Show phone (after escrow)"}
                </Button>
              )}
              <div className="text-xs text-muted-foreground">
                {lang === "ar" ? "تاريخ الإعلان: " : "Listed: "}{formatDateLoc(detail.createdAt, lang)}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <Dialog open={fullscreen} onOpenChange={setFullscreen}>
        <DialogContent className="max-w-5xl p-0 bg-transparent border-0">
          <img src={detail.images[imgIdx]} alt="" className="w-full max-h-[85vh] object-contain" />
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
