// Chat service boundary. All chat I/O flows through this module so a
// real backend (REST/WebSocket) implementation can replace `MockChatService`
// with zero UI changes — the hooks in `src/hooks/chat.ts` only import
// from here.

import {
  type ChatMessage,
  type Conversation,
  type ChatParticipant,
  type RelatedEntity,
  type OfferCardPayload,
  type AttachmentPayload,
  type SystemEventKind,
  seedConversations,
  seedMessages,
  nowIso,
  uid,
} from "./chat-data";
import { loadPersisted, savePersisted } from "@/lib/persist";

const CONV_KEY = "chat:conversations";
const MSG_KEY = "chat:messages";

/** Normalize a participant so all sides of a conversation use the role
 *  as the stable ID. In the mock backend one role == one logical actor,
 *  so this guarantees the User's `me.id` matches whatever the Agency
 *  previously stored as the peer, and vice versa. */
function normalizeParticipant<T extends { id: string; role: string }>(p: T): T {
  return { ...p, id: p.role };
}

/** Rewrite any legacy participant IDs (`role:phone`, `agency:AG-elite`)
 *  produced before the shared-identity fix so previously-persisted
 *  conversations remain reachable after account switch. */
function migrateConv(c: Conversation): Conversation {
  const participants = c.participants.map((p) => ({ ...p, id: p.role }));
  const unread: Record<string, number> = {};
  for (const [k, v] of Object.entries(c.unread)) {
    const role = k.includes(":") ? k.split(":")[0] : k;
    unread[role] = (unread[role] ?? 0) + v;
  }
  return { ...c, participants, unread };
}

function loadConvs(): Conversation[] {
  const raw = loadPersisted<Conversation[] | null>(CONV_KEY, null) ?? seedConversations();
  return raw.map(migrateConv);
}
function loadMsgs(): Record<string, ChatMessage[]> {
  const raw = loadPersisted<Record<string, ChatMessage[]> | null>(MSG_KEY, null) ?? seedMessages();
  const out: Record<string, ChatMessage[]> = {};
  for (const [convId, list] of Object.entries(raw)) {
    out[convId] = list.map((m) => {
      const senderId = m.senderId === "system"
        ? "system"
        : m.senderId.includes(":") ? m.senderId.split(":")[0] : m.senderId;
      const readBy = m.readBy.map((r) => (r.includes(":") ? r.split(":")[0] : r));
      return { ...m, senderId, readBy } as ChatMessage;
    });
  }
  return out;
}
function saveConvs(c: Conversation[]) { savePersisted(CONV_KEY, c); }
function saveMsgs(m: Record<string, ChatMessage[]>) { savePersisted(MSG_KEY, m); }

export interface StartConversationInput {
  me: ChatParticipant;
  peer: ChatParticipant;
  related?: RelatedEntity;
}

export interface SendMessageInput {
  conversationId: string;
  senderId: string;
  text: string;
}
export interface SendAttachmentInput {
  conversationId: string;
  senderId: string;
  attachment: AttachmentPayload;
}
export interface SendOfferCardInput {
  conversationId: string;
  senderId: string;
  offer: Omit<OfferCardPayload, "status">;
}
export interface SystemMessageInput {
  conversationId: string;
  event: SystemEventKind;
  text: string;
}

export interface ChatService {
  listConversations(meId: string): Promise<Conversation[]>;
  getConversation(id: string): Promise<Conversation | null>;
  listMessages(conversationId: string): Promise<ChatMessage[]>;
  startConversation(input: StartConversationInput): Promise<Conversation>;
  sendMessage(input: SendMessageInput): Promise<ChatMessage>;
  sendAttachment(input: SendAttachmentInput): Promise<ChatMessage>;
  sendOfferCard(input: SendOfferCardInput): Promise<ChatMessage>;
  respondToOfferCard(conversationId: string, messageId: string, decision: "accepted" | "rejected"): Promise<ChatMessage>;
  postSystemMessage(input: SystemMessageInput): Promise<ChatMessage>;
  markRead(conversationId: string, meId: string): Promise<void>;
}

const delay = (ms = 200) => new Promise((r) => setTimeout(r, ms));

function bumpConversation(convs: Conversation[], convId: string, preview: string, at: string, senderId: string): Conversation[] {
  return convs.map((c) => {
    if (c.id !== convId) return c;
    const unread: Record<string, number> = { ...c.unread };
    c.participants.forEach((p) => {
      if (p.id !== senderId) unread[p.id] = (unread[p.id] ?? 0) + 1;
    });
    return { ...c, lastMessagePreview: preview, lastMessageAt: at, unread };
  });
}

function previewOf(m: ChatMessage): string {
  if (m.kind === "text") return m.text;
  if (m.kind === "attachment") return `📎 ${m.attachment.name}`;
  if (m.kind === "offer_card") return `عرض سعر — ${m.offer.price.toLocaleString("ar-EG")} ج.م`;
  return m.text;
}

export const mockChatService: ChatService = {
  async listConversations(meId) {
    await delay();
    return loadConvs().filter((c) => c.participants.some((p) => p.id === meId))
      .sort((a, b) => (b.lastMessageAt ?? b.createdAt).localeCompare(a.lastMessageAt ?? a.createdAt));
  },
  async getConversation(id) {
    await delay(80);
    return loadConvs().find((c) => c.id === id) ?? null;
  },
  async listMessages(conversationId) {
    await delay();
    return loadMsgs()[conversationId] ?? [];
  },
  async startConversation({ me, peer, related }) {
    await delay(150);
    const convs = loadConvs();
    // Reuse an existing conversation between the same two participants
    // for the same related entity, so entry points don't duplicate threads.
    const existing = convs.find(
      (c) =>
        c.participants.length === 2 &&
        c.participants.some((p) => p.id === me.id) &&
        c.participants.some((p) => p.id === peer.id) &&
        (related ? c.related?.kind === related.kind && c.related?.id === related.id : !c.related),
    );
    if (existing) return existing;
    const conv: Conversation = {
      id: uid("conv"),
      participants: [me, peer],
      related,
      unread: { [me.id]: 0, [peer.id]: 0 },
      createdAt: nowIso(),
    };
    saveConvs([conv, ...convs]);
    // Seed a system message so the timeline never opens empty.
    const sys: ChatMessage = {
      id: uid("m"),
      conversationId: conv.id,
      senderId: "system",
      kind: "system",
      event: "conversation_started",
      text: related ? `تم بدء المحادثة حول ${related.label ?? related.id}` : "تم بدء المحادثة",
      createdAt: nowIso(),
      readBy: [],
    };
    const msgs = loadMsgs();
    msgs[conv.id] = [sys];
    saveMsgs(msgs);
    return conv;
  },
  async sendMessage({ conversationId, senderId, text }) {
    await delay(120);
    const msg: ChatMessage = { id: uid("m"), conversationId, senderId, kind: "text", text, createdAt: nowIso(), readBy: [senderId] };
    const msgs = loadMsgs();
    msgs[conversationId] = [...(msgs[conversationId] ?? []), msg];
    saveMsgs(msgs);
    saveConvs(bumpConversation(loadConvs(), conversationId, previewOf(msg), msg.createdAt, senderId));
    return msg;
  },
  async sendAttachment({ conversationId, senderId, attachment }) {
    await delay(150);
    const msg: ChatMessage = { id: uid("m"), conversationId, senderId, kind: "attachment", attachment, createdAt: nowIso(), readBy: [senderId] };
    const msgs = loadMsgs();
    msgs[conversationId] = [...(msgs[conversationId] ?? []), msg];
    saveMsgs(msgs);
    saveConvs(bumpConversation(loadConvs(), conversationId, previewOf(msg), msg.createdAt, senderId));
    return msg;
  },
  async sendOfferCard({ conversationId, senderId, offer }) {
    await delay(150);
    const msg: ChatMessage = {
      id: uid("m"),
      conversationId,
      senderId,
      kind: "offer_card",
      offer: { ...offer, status: "pending" },
      createdAt: nowIso(),
      readBy: [senderId],
    };
    const msgs = loadMsgs();
    msgs[conversationId] = [...(msgs[conversationId] ?? []), msg];
    saveMsgs(msgs);
    saveConvs(bumpConversation(loadConvs(), conversationId, previewOf(msg), msg.createdAt, senderId));
    return msg;
  },
  async respondToOfferCard(conversationId, messageId, decision) {
    await delay(120);
    const msgs = loadMsgs();
    const list = msgs[conversationId] ?? [];
    let updated: ChatMessage | null = null;
    msgs[conversationId] = list.map((m) => {
      if (m.id !== messageId || m.kind !== "offer_card") return m;
      updated = { ...m, offer: { ...m.offer, status: decision } };
      return updated;
    });
    saveMsgs(msgs);
    // Append a system message so timeline shows the outcome.
    const sys: ChatMessage = {
      id: uid("m"),
      conversationId,
      senderId: "system",
      kind: "system",
      event: decision === "accepted" ? "offer_accepted" : "offer_rejected",
      text: decision === "accepted" ? "تم قبول عرض السعر" : "تم رفض عرض السعر",
      createdAt: nowIso(),
      readBy: [],
    };
    msgs[conversationId] = [...msgs[conversationId], sys];
    saveMsgs(msgs);
    saveConvs(bumpConversation(loadConvs(), conversationId, previewOf(sys), sys.createdAt, "system"));
    if (!updated) throw new Error("offer_card message not found");
    return updated;
  },
  async postSystemMessage({ conversationId, event, text }) {
    await delay(60);
    const msg: ChatMessage = {
      id: uid("m"), conversationId, senderId: "system", kind: "system", event, text,
      createdAt: nowIso(), readBy: [],
    };
    const msgs = loadMsgs();
    msgs[conversationId] = [...(msgs[conversationId] ?? []), msg];
    saveMsgs(msgs);
    saveConvs(bumpConversation(loadConvs(), conversationId, text, msg.createdAt, "system"));
    return msg;
  },
  async markRead(conversationId, meId) {
    await delay(30);
    const convs = loadConvs().map((c) =>
      c.id === conversationId ? { ...c, unread: { ...c.unread, [meId]: 0 } } : c,
    );
    saveConvs(convs);
    const msgs = loadMsgs();
    const list = msgs[conversationId] ?? [];
    msgs[conversationId] = list.map((m) => (m.readBy.includes(meId) ? m : { ...m, readBy: [...m.readBy, meId] }));
    saveMsgs(msgs);
  },
};

/** Single active service. Swap this export for a REST/WebSocket
 *  implementation to move off mocks. */
export const chatService: ChatService = mockChatService;
