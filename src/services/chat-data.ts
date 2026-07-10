// Marketplace Chat — types, seeds, helpers.
// The `chat-service.ts` layer wraps I/O so a real REST/WebSocket
// implementation can replace the mock without touching UI code.

import type { Role } from "@/store/auth";

export type ChatPeerRole = "user" | "agency" | "admin";

export interface ChatParticipant {
  id: string;
  name: string;
  role: ChatPeerRole;
  avatarColor?: string;
}

export type RelatedEntityKind = "import_request" | "listing" | "escrow" | "offer" | "agency";

export interface RelatedEntity {
  kind: RelatedEntityKind;
  id: string;
  label?: string;
  /** Snapshot metadata rendered in the conversation header. */
  meta?: Record<string, string | number>;
}

export interface OfferCardPayload {
  price: number;
  shipping: number;
  warranty: string;
  delivery: string;
  notes?: string;
  /** Set once the receiver acts. */
  status: "pending" | "accepted" | "rejected";
  /** When linked to an existing offer in the import-request workflow. */
  offerId?: string;
  requestId?: string;
}

export interface AttachmentPayload {
  name: string;
  kind: "image" | "pdf" | "doc";
  size?: number;
}

export type SystemEventKind =
  | "conversation_started"
  | "offer_submitted"
  | "offer_accepted"
  | "offer_rejected"
  | "escrow_created"
  | "shipment_started"
  | "delivery_confirmed";

export type ChatMessage =
  | {
      id: string;
      conversationId: string;
      senderId: string;
      kind: "text";
      text: string;
      createdAt: string;
      readBy: string[];
    }
  | {
      id: string;
      conversationId: string;
      senderId: string;
      kind: "attachment";
      attachment: AttachmentPayload;
      createdAt: string;
      readBy: string[];
    }
  | {
      id: string;
      conversationId: string;
      senderId: string;
      kind: "offer_card";
      offer: OfferCardPayload;
      createdAt: string;
      readBy: string[];
    }
  | {
      id: string;
      conversationId: string;
      senderId: "system";
      kind: "system";
      event: SystemEventKind;
      text: string;
      createdAt: string;
      readBy: string[];
    };

export interface Conversation {
  id: string;
  participants: ChatParticipant[];
  related?: RelatedEntity;
  lastMessagePreview?: string;
  lastMessageAt?: string;
  /** Unread counts per participant id. */
  unread: Record<string, number>;
  createdAt: string;
}

export const nowIso = () => new Date().toISOString();
export const uid = (p: string) => `${p}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;

export function otherParticipant(conv: Conversation, meId: string): ChatParticipant {
  return conv.participants.find((p) => p.id !== meId) ?? conv.participants[0];
}

/** Deterministic participant ID for a role — allows entry-points to
 *  reference the current user without knowing internal IDs. */
export function localParticipantId(role: Role, phoneOrId: string): string {
  return `${role}:${phoneOrId}`;
}

// ---- Seeds (only used when persistence is empty) ---------------------------

export function seedConversations(): Conversation[] {
  const now = Date.now();
  const t = (offset: number) => new Date(now - offset).toISOString();
  const user: ChatParticipant = { id: "user:+20 100 123 4567", name: "محمد سعيد", role: "user", avatarColor: "#2563eb" };
  const agency: ChatParticipant = { id: "agency:AG-elite", name: "معرض النخبة", role: "agency", avatarColor: "#059669" };
  const agency2: ChatParticipant = { id: "agency:AG-cairo", name: "معرض القاهرة", role: "agency", avatarColor: "#d97706" };
  return [
    {
      id: "conv-seed-1",
      participants: [user, agency],
      related: { kind: "import_request", id: "IR-3001", label: "طلب استيراد تويوتا لاند كروزر 2023", meta: { budget: 1_850_000, status: "open" } },
      lastMessagePreview: "هل السعر النهائي يشمل الشحن؟",
      lastMessageAt: t(5 * 60_000),
      unread: { [user.id]: 0, [agency.id]: 1 },
      createdAt: t(2 * 3600_000),
    },
    {
      id: "conv-seed-2",
      participants: [user, agency2],
      related: { kind: "listing", id: "L-1201", label: "مرسيدس C200 2022", meta: { price: 1_450_000 } },
      lastMessagePreview: "متاحة للمعاينة غداً",
      lastMessageAt: t(2 * 3600_000),
      unread: { [user.id]: 2, [agency2.id]: 0 },
      createdAt: t(2 * 86_400_000),
    },
  ];
}

export function seedMessages(): Record<string, ChatMessage[]> {
  const now = Date.now();
  const t = (offset: number) => new Date(now - offset).toISOString();
  return {
    "conv-seed-1": [
      { id: uid("m"), conversationId: "conv-seed-1", senderId: "system", kind: "system", event: "conversation_started", text: "تم بدء المحادثة حول طلب استيراد IR-3001", createdAt: t(2 * 3600_000), readBy: [] },
      { id: uid("m"), conversationId: "conv-seed-1", senderId: "agency:AG-elite", kind: "text", text: "أهلاً بك، لدينا سيارة مطابقة لطلبك بحالة ممتازة.", createdAt: t(60 * 60_000), readBy: ["user:+20 100 123 4567"] },
      { id: uid("m"), conversationId: "conv-seed-1", senderId: "user:+20 100 123 4567", kind: "text", text: "هل السعر النهائي يشمل الشحن؟", createdAt: t(5 * 60_000), readBy: [] },
    ],
    "conv-seed-2": [
      { id: uid("m"), conversationId: "conv-seed-2", senderId: "agency:AG-cairo", kind: "text", text: "متاحة للمعاينة غداً في المعرض من 10 ص إلى 6 م.", createdAt: t(2 * 3600_000), readBy: [] },
    ],
  };
}
