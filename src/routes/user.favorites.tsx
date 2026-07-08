import { createFileRoute } from "@tanstack/react-router";
import { DashboardLayout } from "@/components/dashboard-layout";
import { useListings } from "@/hooks/queries";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Heart, MapPin } from "lucide-react";
import { useMoney } from "@/lib/format";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";

export const Route = createFileRoute("/user/favorites")({ component: Favs });

function Favs() {
  const money = useMoney();
  const { data, isLoading } = useListings();
  const favs = data?.slice(0, 8);

  return (
    <DashboardLayout title="المفضلة">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {isLoading ? Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-64 rounded-xl" />) :
          favs?.map((l) => (
            <Card key={l.id} className="overflow-hidden group">
              <div className="relative">
                <img src={l.image} alt={l.title} className="h-40 w-full object-cover" />
                <Button size="icon" variant="secondary" className="absolute top-2 left-2 size-8" onClick={() => toast.info("تمت الإزالة من المفضلة")}>
                  <Heart className="size-4 fill-destructive text-destructive" />
                </Button>
              </div>
              <CardContent className="p-4 space-y-2">
                <div className="font-semibold truncate">{l.title}</div>
                <div className="flex items-center gap-1 text-xs text-muted-foreground"><MapPin className="size-3" /> {l.city}</div>
                <div className="font-display text-lg font-bold text-primary">{money(l.price)}</div>
              </CardContent>
            </Card>
          ))}
      </div>
    </DashboardLayout>
  );
}
