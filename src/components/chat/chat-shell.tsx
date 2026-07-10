import { useEffect, useMemo, useRef, useState, type KeyboardEvent } from "react";
import { useSearch, useNavigate } from "@tanstack/react-router";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import {
  Popover, PopoverContent, PopoverTrigger,
} from "@/components/ui/popover";
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Send, Search, Paperclip, Image as ImageIcon, FileText, File as FileIcon,
  MessagesSquare, Tag, Check, X, ChevronDown, Package, Car, Shield,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useMoney } from "@/lib/format";
import {
  useConversationsV2, useConversationMessages, useMeParticipant,
  useSendMessage, useSendAttachment, useSendOfferCard, useRespondToOfferCard,
  useMarkConversationRead,
} from "@/hooks/chat";
import type { ChatMessage, Conversation, OfferCardPayload } from "@/services/chat-data";
import { otherParticipant } from "@/services/chat-data";
import { formatRelative } from "@/store/notifications";
import { useUIStore } from "@/store/ui";
import { useAcceptOffer, useRejectOffer } from "@/hooks/import-requests";
import { toast } from "sonner";

const RELATED_ICON: Record<string, typeof Package> = {
  import_request: Package,
  listing: Car,
  escrow: Shield,
  offer: Tag,
  agency: MessagesSquare,
};

function fmtTime(iso: string) {
  return new Date(iso).toLocaleTimeString("ar-EG", { hour: "2-digit", minute: "2-digit" });
}

export function ChatShell() {
  const me = useMeParticipant();
  const lang = useUIStore((s) => s.lang);
  const { data: conversations, isLoading } = useConversationsV2();
  const navigate = useNavigate();
  const search = useSearch({ strict: false }) as { c?: string };

  const [selectedId, setSelectedId] = useState<string | undefined>(search.c);
  const [query, setQuery] = useState("");

  // Sync from URL when it changes (deep-linking).
  useEffect(() => { if (search.c) setSelectedId(search.c); }, [search.c]);

  // Default-select the first conversation once loaded.
  useEffect(() => {
    if (!selectedId && conversations && conversations.length > 0) {
      setSelectedId(conversations[0].id);
    }
  }, [conversations, selectedId]);

  const selected = conversations?.find((c) => c.id === selectedId);
  const markRead = useMarkConversationRead();
  useEffect(() => {
    if (selectedId && selected && (selected.unread[me.id] ?? 0) > 0) {
      markRead.mutate(selectedId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedId]);

  const filtered = useMemo(() => {
    if (!conversations) return [];
    const q = query.trim().toLowerCase();
    if (!q) return conversations;
    return conversations.filter((c) => {
      const other = otherParticipant(c, me.id);
      return (
        other.name.toLowerCase().includes(q) ||
        (c.lastMessagePreview ?? "").toLowerCase().includes(q) ||
        (c.related?.label ?? "").toLowerCase().includes(q)
      );
    });
  }, [conversations, query, me.id]);

  const selectConv = (id: string) => {
    setSelectedId(id);
    navigate({ to: ".", search: { c: id }, replace: true }).catch(() => {});
  };

  return (
    <Card className="grid h-[calc(100vh-12rem)] grid-cols-1 md:grid-cols-[320px_1fr] overflow-hidden">
      <aside className="border-l bg-sidebar/40 flex flex-col min-h-0">
        <div className="border-b p-3">
          <div className="relative">
            <Search className="absolute right-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder={lang === "ar" ? "بحث في المحادثات..." : "Search conversations..."}
              className="pr-9"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              aria-label="search conversations"
            />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto">
          {isLoading && Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="p-3"><Skeleton className="h-14" /></div>
          ))}
          {!isLoading && filtered.length === 0 && (
            <div className="flex h-full flex-col items-center justify-center gap-2 p-8 text-center text-muted-foreground">
              <MessagesSquare className="size-10 opacity-50" />
              <p className="text-sm font-medium">{lang === "ar" ? "لا توجد محادثات" : "No conversations"}</p>
              <p className="text-xs">{lang === "ar" ? "ابدأ محادثة من إعلان أو طلب استيراد" : "Start one from a listing or request"}</p>
            </div>
          )}
          {filtered.map((c) => {
            const other = otherParticipant(c, me.id);
            const unread = c.unread[me.id] ?? 0;
            const RelatedIcon = c.related ? RELATED_ICON[c.related.kind] ?? Tag : null;
            return (
              <button
                key={c.id}
                onClick={() => selectConv(c.id)}
                className={cn(
                  "flex w-full items-start gap-3 border-b p-3 text-right hover:bg-accent/50 transition-colors",
                  selectedId === c.id && "bg-accent",
                )}
              >
                <Avatar>
                  <AvatarFallback style={{ backgroundColor: other.avatarColor ?? "#2563eb", color: "#fff" }}>
                    {other.name.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <div className="truncate font-semibold">{other.name}</div>
                    <div className="text-[10px] text-muted-foreground shrink-0">
                      {c.lastMessageAt ? formatRelative(c.lastMessageAt, lang) : ""}
                    </div>
                  </div>
                  <div className="truncate text-xs text-muted-foreground mt-0.5">
                    {c.lastMessagePreview ?? (lang === "ar" ? "لا توجد رسائل بعد" : "No messages yet")}
                  </div>
                  {c.related && RelatedIcon && (
                    <Badge variant="outline" className="mt-1 gap-1 text-[10px] font-normal">
                      <RelatedIcon className="size-3" />
                      <span className="truncate max-w-[180px]">{c.related.label ?? c.related.id}</span>
                    </Badge>
                  )}
                </div>
                {unread > 0 && <Badge className="shrink-0">{unread}</Badge>}
              </button>
            );
          })}
        </div>
      </aside>

      <section className="flex min-h-0 flex-col">
        {selected ? <ChatWindow conversation={selected} /> : (
          <div className="grid flex-1 place-items-center text-muted-foreground p-8 text-center">
            <div>
              <MessagesSquare className="size-12 mx-auto opacity-40" />
              <p className="mt-3 text-sm">{lang === "ar" ? "اختر محادثة للبدء" : "Select a conversation"}</p>
            </div>
          </div>
        )}
      </section>
    </Card>
  );
}

// ---- Chat Window ----------------------------------------------------------

function ChatWindow({ conversation }: { conversation: Conversation }) {
  const me = useMeParticipant();
  const lang = useUIStore((s) => s.lang);
  const money = useMoney();
  const other = otherParticipant(conversation, me.id);
  const { data: messages, isLoading } = useConversationMessages(conversation.id);
  const send = useSendMessage(conversation.id);
  const sendAttachment = useSendAttachment(conversation.id);

  const [draft, setDraft] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const scrollRef = useRef<HTMLDivElement | null>(null);

  // Autoscroll to newest
  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages?.length, conversation.id]);

  // Focus composer on mount + conversation switch
  useEffect(() => { textareaRef.current?.focus(); }, [conversation.id]);

  const submit = () => {
    const text = draft.trim();
    if (!text) return;
    setDraft("");
    send.mutate(text, {
      onError: () => { toast.error(lang === "ar" ? "تعذّر الإرسال" : "Failed to send"); setDraft(text); },
      onSettled: () => textareaRef.current?.focus(),
    });
  };

  const onKey = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); submit(); }
  };

  const onFilePicked = (kind: "image" | "pdf" | "doc") => (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    sendAttachment.mutate({ name: file.name, kind, size: file.size });
    e.target.value = "";
  };

  const RelatedIcon = conversation.related ? RELATED_ICON[conversation.related.kind] ?? Tag : null;

  return (
    <>
      {/* Header */}
      <div className="border-b p-3 flex items-center gap-3">
        <Avatar>
          <AvatarFallback style={{ backgroundColor: other.avatarColor ?? "#2563eb", color: "#fff" }}>
            {other.name.charAt(0)}
          </AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <div className="font-semibold truncate">{other.name}</div>
            <Badge variant="secondary" className="text-[10px] font-normal">{other.role}</Badge>
          </div>
          {conversation.related && RelatedIcon && (
            <div className="mt-0.5 flex items-center gap-1.5 text-xs text-muted-foreground">
              <RelatedIcon className="size-3.5" />
              <span className="truncate">{conversation.related.label ?? conversation.related.id}</span>
              {conversation.related.meta && Object.entries(conversation.related.meta).slice(0, 3).map(([k, v]) => (
                <Badge key={k} variant="outline" className="text-[10px] font-normal">
                  {k === "budget" || k === "price" || k === "amount" ? money(Number(v)) : String(v)}
                </Badge>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto p-4 bg-muted/20">
        {isLoading && Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className={cn("flex", i % 2 === 0 ? "justify-start" : "justify-end")}>
            <Skeleton className="h-14 w-56 rounded-2xl" />
          </div>
        ))}
        {!isLoading && (messages ?? []).map((m) => (
          <MessageRow key={m.id} message={m} meId={me.id} conversation={conversation} />
        ))}
      </div>

      {/* Composer */}
      <div className="border-t p-3">
        <div className="flex items-end gap-2">
          <ComposerAttachments onPick={onFilePicked} />
          <Textarea
            ref={textareaRef}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={onKey}
            placeholder={lang === "ar" ? "اكتب رسالة... (Enter للإرسال، Shift+Enter لسطر جديد)" : "Type a message..."}
            rows={1}
            className="min-h-10 max-h-40 resize-none"
            aria-label="message composer"
          />
          <Button type="button" size="icon" onClick={submit} disabled={!draft.trim() || send.isPending} aria-label="send">
            <Send className="size-4" />
          </Button>
        </div>
      </div>
    </>
  );
}

// ---- Message rendering ----------------------------------------------------

function MessageRow({ message, meId, conversation }: { message: ChatMessage; meId: string; conversation: Conversation }) {
  const mine = message.senderId === meId;
  const money = useMoney();
  const lang = useUIStore((s) => s.lang);

  if (message.kind === "system") {
    return (
      <div className="flex justify-center">
        <div className="rounded-full border bg-background/60 px-3 py-1 text-[11px] text-muted-foreground">
          {message.text} · {fmtTime(message.createdAt)}
        </div>
      </div>
    );
  }

  return (
    <div className={cn("flex", mine ? "justify-start" : "justify-end")}>
      <div className={cn(
        "max-w-[75%] rounded-2xl border px-3 py-2 text-sm shadow-sm",
        mine ? "bg-primary text-primary-foreground border-primary" : "bg-card",
      )}>
        {message.kind === "text" && <div className="whitespace-pre-wrap break-words">{message.text}</div>}
        {message.kind === "attachment" && <AttachmentBubble name={message.attachment.name} kind={message.attachment.kind} />}
        {message.kind === "offer_card" && (
          <OfferCardBubble
            offer={message.offer}
            mine={mine}
            messageId={message.id}
            conversation={conversation}
            money={money}
            lang={lang}
          />
        )}
        <div className={cn("mt-1 text-[10px] flex items-center gap-1 justify-end", mine ? "text-primary-foreground/70" : "text-muted-foreground")}>
          <span>{fmtTime(message.createdAt)}</span>
          {mine && <Check className={cn("size-3", (message.readBy.length > 1) && "opacity-100")} />}
        </div>
      </div>
    </div>
  );
}

function AttachmentBubble({ name, kind }: { name: string; kind: "image" | "pdf" | "doc" }) {
  const Icon = kind === "image" ? ImageIcon : kind === "pdf" ? FileText : FileIcon;
  return (
    <div className="flex items-center gap-2 rounded-lg border bg-background/40 px-2 py-1.5">
      <Icon className="size-4" />
      <span className="text-xs truncate max-w-[220px]">{name}</span>
    </div>
  );
}

function OfferCardBubble({
  offer, mine, messageId, conversation, money, lang,
}: {
  offer: OfferCardPayload;
  mine: boolean;
  messageId: string;
  conversation: Conversation;
  money: (n: number) => string;
  lang: "ar" | "en";
}) {
  const respond = useRespondToOfferCard(conversation.id);
  const acceptImportOffer = useAcceptOffer();
  const rejectImportOffer = useRejectOffer();

  const act = (decision: "accepted" | "rejected") => {
    // If the offer card references an existing import-request offer,
    // route the decision through the canonical workflow so escrow +
    // notifications stay authoritative — the chat message updates via
    // its own respond call.
    if (offer.offerId && offer.requestId) {
      if (decision === "accepted") {
        acceptImportOffer.mutate({ offerId: offer.offerId, requestId: offer.requestId });
      } else {
        rejectImportOffer.mutate({ offerId: offer.offerId, requestId: offer.requestId, reason: "رفض من المحادثة" });
      }
    }
    respond.mutate({ messageId, decision });
  };

  const statusBadge =
    offer.status === "pending" ? null :
    offer.status === "accepted" ? <Badge className="bg-success text-success-foreground">مقبول</Badge> :
    <Badge variant="destructive">مرفوض</Badge>;

  return (
    <div className={cn("min-w-[240px] space-y-2", mine ? "text-primary-foreground" : "")}>
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 font-semibold text-sm">
          <Tag className="size-4" /> {lang === "ar" ? "عرض سعر" : "Price offer"}
        </div>
        {statusBadge}
      </div>
      <dl className={cn("grid grid-cols-2 gap-x-3 gap-y-1 text-xs rounded-lg p-2", mine ? "bg-primary-foreground/10" : "bg-muted/50")}>
        <dt className="opacity-70">السعر</dt><dd className="font-semibold text-right">{money(offer.price)}</dd>
        <dt className="opacity-70">الشحن</dt><dd className="font-semibold text-right">{money(offer.shipping)}</dd>
        <dt className="opacity-70">التسليم</dt><dd className="font-semibold text-right">{offer.delivery}</dd>
        <dt className="opacity-70">الضمان</dt><dd className="font-semibold text-right">{offer.warranty}</dd>
      </dl>
      {offer.notes && <div className={cn("text-xs italic", mine ? "opacity-90" : "text-muted-foreground")}>{offer.notes}</div>}
      {!mine && offer.status === "pending" && (
        <div className="flex gap-2 pt-1">
          <Button size="sm" className="flex-1 gap-1" onClick={() => act("accepted")} disabled={respond.isPending}>
            <Check className="size-3" /> قبول
          </Button>
          <Button size="sm" variant="outline" className="flex-1 gap-1" onClick={() => act("rejected")} disabled={respond.isPending}>
            <X className="size-3" /> رفض
          </Button>
        </div>
      )}
    </div>
  );
}

// ---- Composer attachments menu + offer card sender ------------------------

function ComposerAttachments({
  onPick,
}: {
  onPick: (kind: "image" | "pdf" | "doc") => (e: React.ChangeEvent<HTMLInputElement>) => void;
}) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button type="button" size="icon" variant="outline" aria-label="attach">
            <Paperclip className="size-4" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-56 p-2" align="start">
          <AttachRow icon={ImageIcon} label="صورة" accept="image/*" onChange={onPick("image")} />
          <AttachRow icon={FileText} label="PDF" accept="application/pdf" onChange={onPick("pdf")} />
          <AttachRow icon={FileIcon} label="مستند" accept=".doc,.docx,.txt,.xlsx" onChange={onPick("doc")} />
          <OfferCardSender onDone={() => setOpen(false)} />
        </PopoverContent>
      </Popover>
    </>
  );
}

function AttachRow({
  icon: Icon, label, accept, onChange,
}: {
  icon: typeof ImageIcon;
  label: string;
  accept: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}) {
  return (
    <label className="flex cursor-pointer items-center gap-2 rounded-md p-2 hover:bg-accent text-sm">
      <Icon className="size-4" />
      <span>{label}</span>
      <input type="file" accept={accept} className="sr-only" onChange={onChange} />
    </label>
  );
}

function OfferCardSender({ onDone }: { onDone: () => void }) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ price: "", shipping: "50000", delivery: "شهر", warranty: "سنة", notes: "" });
  // Discover current conversation from the tree — this component is
  // always mounted inside a ChatWindow, so we can grab it via search.
  const search = useSearch({ strict: false }) as { c?: string };
  const send = useSendOfferCard(search.c);
  const submit = () => {
    const price = Number(form.price);
    if (!price) return toast.error("أدخل السعر");
    send.mutate(
      {
        price,
        shipping: Number(form.shipping) || 0,
        delivery: form.delivery,
        warranty: form.warranty,
        notes: form.notes || undefined,
      },
      {
        onSuccess: () => { setOpen(false); onDone(); },
      },
    );
  };
  return (
    <>
      <button
        type="button"
        className="flex w-full items-center gap-2 rounded-md p-2 hover:bg-accent text-sm"
        onClick={() => setOpen(true)}
      >
        <Tag className="size-4" /> إرسال عرض سعر
      </button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent dir="rtl">
          <DialogHeader><DialogTitle>إرسال عرض سعر</DialogTitle></DialogHeader>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1"><Label>السعر (ج.م)</Label><Input type="number" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} /></div>
            <div className="space-y-1"><Label>الشحن</Label><Input type="number" value={form.shipping} onChange={(e) => setForm({ ...form, shipping: e.target.value })} /></div>
            <div className="space-y-1"><Label>مدة التسليم</Label><Input value={form.delivery} onChange={(e) => setForm({ ...form, delivery: e.target.value })} /></div>
            <div className="space-y-1"><Label>الضمان</Label><Input value={form.warranty} onChange={(e) => setForm({ ...form, warranty: e.target.value })} /></div>
            <div className="col-span-2 space-y-1"><Label>ملاحظات</Label>
              <Textarea rows={2} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>إلغاء</Button>
            <Button onClick={submit} disabled={send.isPending}>إرسال</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
