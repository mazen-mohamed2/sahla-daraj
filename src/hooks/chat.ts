// React Query wrapper around the chat service. Components only ever
// import from here; the underlying transport lives in `chat-service.ts`.

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { chatService } from "@/services/chat-service";
import type {
  ChatMessage,
  Conversation,
  ChatParticipant,
  RelatedEntity,
  OfferCardPayload,
  AttachmentPayload,
} from "@/services/chat-data";
import { useAuthStore, type Role } from "@/store/auth";
import { notify } from "@/store/notifications";

export const CHAT_QK = {
  conversations: (meId: string) => ["chat", "conversations", meId] as const,
  messages: (convId: string) => ["chat", "messages", convId] as const,
};

/** Deterministic identifier for the current signed-in participant.
 *  In the mock backend, each role represents a single logical actor,
 *  so we use the role as the shared identity. This keeps a conversation
 *  started by an agency visible to the user after account switch —
 *  both sides read/write under the same participant IDs. When a real
 *  backend replaces the mock, swap this to a stable per-account UUID. */
export function useMeParticipant(): ChatParticipant {
  const auth = useAuthStore();
  return {
    id: auth.role,
    name: auth.name,
    role: auth.role,
    avatarColor: auth.avatarColor,
  };
}

export function useConversationsV2() {
  const me = useMeParticipant();
  return useQuery({
    queryKey: CHAT_QK.conversations(me.id),
    queryFn: () => chatService.listConversations(me.id),
    staleTime: 10_000,
  });
}

export function useConversationMessages(convId: string | undefined) {
  return useQuery({
    queryKey: convId ? CHAT_QK.messages(convId) : ["chat", "messages", "none"],
    queryFn: () => (convId ? chatService.listMessages(convId) : Promise.resolve([] as ChatMessage[])),
    enabled: !!convId,
  });
}

function notifyPeer(conv: Conversation, senderId: string, preview: string) {
  const peer = conv.participants.find((p) => p.id !== senderId);
  if (!peer) return;
  const roleToActionUrl: Record<Role, string> = {
    user: "/user/chat",
    agency: "/agency/chat",
    admin: "/admin/notifications",
  };
  notify(peer.role, {
    title: "رسالة جديدة",
    message: preview.length > 80 ? preview.slice(0, 77) + "…" : preview,
    category: "messages",
    relatedEntityType: "conversation",
    relatedEntityId: conv.id,
    actionUrl: `${roleToActionUrl[peer.role]}?c=${conv.id}`,
    priority: "medium",
  });
}

export function useStartConversation() {
  const qc = useQueryClient();
  const me = useMeParticipant();
  return useMutation({
    mutationFn: async (input: { peer: ChatParticipant; related?: RelatedEntity }) => {
      return chatService.startConversation({ me, peer: input.peer, related: input.related });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: CHAT_QK.conversations(me.id) });
    },
  });
}

export function useSendMessage(convId: string | undefined) {
  const qc = useQueryClient();
  const me = useMeParticipant();
  return useMutation({
    mutationFn: async (text: string) => {
      if (!convId) throw new Error("no conversation");
      const msg = await chatService.sendMessage({ conversationId: convId, senderId: me.id, text });
      const conv = await chatService.getConversation(convId);
      return { msg, conv };
    },
    onSuccess: ({ msg, conv }) => {
      if (!convId) return;
      qc.setQueryData<ChatMessage[]>(CHAT_QK.messages(convId), (old = []) => [...old, msg]);
      qc.invalidateQueries({ queryKey: CHAT_QK.conversations(me.id) });
      if (conv) notifyPeer(conv, me.id, msg.kind === "text" ? msg.text : "رسالة جديدة");
    },
  });
}

export function useSendAttachment(convId: string | undefined) {
  const qc = useQueryClient();
  const me = useMeParticipant();
  return useMutation({
    mutationFn: async (attachment: AttachmentPayload) => {
      if (!convId) throw new Error("no conversation");
      const msg = await chatService.sendAttachment({ conversationId: convId, senderId: me.id, attachment });
      const conv = await chatService.getConversation(convId);
      return { msg, conv };
    },
    onSuccess: ({ msg, conv }) => {
      if (!convId) return;
      qc.setQueryData<ChatMessage[]>(CHAT_QK.messages(convId), (old = []) => [...old, msg]);
      qc.invalidateQueries({ queryKey: CHAT_QK.conversations(me.id) });
      if (conv && msg.kind === "attachment") notifyPeer(conv, me.id, `📎 ${msg.attachment.name}`);
    },
  });
}

export function useSendOfferCard(convId: string | undefined) {
  const qc = useQueryClient();
  const me = useMeParticipant();
  return useMutation({
    mutationFn: async (offer: Omit<OfferCardPayload, "status">) => {
      if (!convId) throw new Error("no conversation");
      const msg = await chatService.sendOfferCard({ conversationId: convId, senderId: me.id, offer });
      const conv = await chatService.getConversation(convId);
      return { msg, conv };
    },
    onSuccess: ({ msg, conv }) => {
      if (!convId) return;
      qc.setQueryData<ChatMessage[]>(CHAT_QK.messages(convId), (old = []) => [...old, msg]);
      qc.invalidateQueries({ queryKey: CHAT_QK.conversations(me.id) });
      if (conv && msg.kind === "offer_card") {
        notifyPeer(conv, me.id, `عرض سعر جديد — ${msg.offer.price.toLocaleString("ar-EG")} ج.م`);
      }
    },
  });
}

export function useRespondToOfferCard(convId: string | undefined) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { messageId: string; decision: "accepted" | "rejected" }) => {
      if (!convId) throw new Error("no conversation");
      return chatService.respondToOfferCard(convId, input.messageId, input.decision);
    },
    onSuccess: () => {
      if (!convId) return;
      qc.invalidateQueries({ queryKey: CHAT_QK.messages(convId) });
    },
  });
}

export function useMarkConversationRead() {
  const qc = useQueryClient();
  const me = useMeParticipant();
  return useMutation({
    mutationFn: async (convId: string) => chatService.markRead(convId, me.id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: CHAT_QK.conversations(me.id) });
    },
  });
}
