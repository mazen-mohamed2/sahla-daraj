import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useConversations, useMessages } from "@/hooks/queries";
import { Send, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";

export function ChatShell() {
  const { data: convos, isLoading } = useConversations();
  const [selectedId, setSelectedId] = useState<string | undefined>();
  const { data: messages } = useMessages(selectedId);
  const selected = convos?.find((c) => c.id === selectedId);
  const [draft, setDraft] = useState("");

  return (
    <Card className="grid h-[calc(100vh-12rem)] grid-cols-1 md:grid-cols-[320px_1fr] overflow-hidden">
      <div className="border-l bg-sidebar/40 flex flex-col">
        <div className="border-b p-3">
          <div className="relative">
            <Search className="absolute right-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="بحث في المحادثات..." className="pr-9" />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto">
          {isLoading ? Array.from({ length: 5 }).map((_, i) => <div key={i} className="p-3"><Skeleton className="h-12" /></div>) :
            convos?.map((c) => (
              <button key={c.id} onClick={() => setSelectedId(c.id)}
                className={cn("flex w-full items-center gap-3 border-b p-3 text-right hover:bg-accent/50", selectedId === c.id && "bg-accent")}>
                <Avatar><AvatarFallback className="bg-primary text-primary-foreground">{c.name[0]}</AvatarFallback></Avatar>
                <div className="min-w-0 flex-1">
                  <div className="flex justify-between gap-2">
                    <div className="truncate font-semibold">{c.name}</div>
                    <div className="text-xs text-muted-foreground">{c.time}</div>
                  </div>
                  <div className="truncate text-sm text-muted-foreground">{c.lastMessage}</div>
                </div>
                {c.unread > 0 && <Badge className="shrink-0">{c.unread}</Badge>}
              </button>
            ))}
        </div>
      </div>

      <div className="flex flex-col">
        {selected ? (
          <>
            <div className="border-b p-4 flex items-center gap-3">
              <Avatar><AvatarFallback className="bg-primary text-primary-foreground">{selected.name[0]}</AvatarFallback></Avatar>
              <div><div className="font-semibold">{selected.name}</div><div className="text-xs text-muted-foreground">متصل الآن</div></div>
            </div>
            <div className="flex-1 space-y-3 overflow-y-auto p-4 bg-muted/20">
              {messages?.map((m) => (
                <div key={m.id} className={cn("flex", m.from === "me" ? "justify-start" : "justify-end")}>
                  <div className={cn("max-w-[70%] rounded-2xl px-4 py-2 text-sm", m.from === "me" ? "bg-primary text-primary-foreground" : "bg-card border")}>
                    <div>{m.text}</div>
                    <div className={cn("mt-1 text-[10px]", m.from === "me" ? "text-primary-foreground/70" : "text-muted-foreground")}>{m.time}</div>
                  </div>
                </div>
              ))}
            </div>
            <form className="border-t p-3 flex gap-2" onSubmit={(e) => { e.preventDefault(); setDraft(""); }}>
              <Input value={draft} onChange={(e) => setDraft(e.target.value)} placeholder="اكتب رسالة..." />
              <Button type="submit" size="icon"><Send className="size-4" /></Button>
            </form>
          </>
        ) : (
          <div className="grid flex-1 place-items-center text-muted-foreground">اختر محادثة للبدء</div>
        )}
      </div>
    </Card>
  );
}
