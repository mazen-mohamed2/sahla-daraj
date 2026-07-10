import { useNavigate } from "@tanstack/react-router";
import { Button, type ButtonProps } from "@/components/ui/button";
import { MessageCircle } from "lucide-react";
import { useStartConversation, useMeParticipant } from "@/hooks/chat";
import type { ChatParticipant, RelatedEntity } from "@/services/chat-data";
import { toast } from "sonner";
import { useAuthStore } from "@/store/auth";

interface Props extends Omit<ButtonProps, "onClick"> {
  peer: ChatParticipant;
  related?: RelatedEntity;
  label?: string;
}

/** Reusable entry point that opens or creates a conversation with `peer`,
 *  optionally scoped to a related entity, then routes to the chat page. */
export function StartChatButton({ peer, related, label, size = "sm", variant = "outline", className, ...rest }: Props) {
  const navigate = useNavigate();
  const start = useStartConversation();
  const me = useMeParticipant();
  const role = useAuthStore((s) => s.role);

  const onClick = () => {
    if (peer.id === me.id) {
      toast.error("لا يمكن بدء محادثة مع نفسك");
      return;
    }
    start.mutate(
      { peer, related },
      {
        onSuccess: (conv) => {
          const base = role === "agency" ? "/agency/chat" : role === "admin" ? "/user/chat" : "/user/chat";
          navigate({ to: base, search: { c: conv.id } }).catch(() => {});
        },
        onError: () => toast.error("تعذّر بدء المحادثة"),
      },
    );
  };

  return (
    <Button type="button" size={size} variant={variant} className={className} onClick={onClick} disabled={start.isPending} {...rest}>
      <MessageCircle className="size-4 me-1" />
      {label ?? "مراسلة"}
    </Button>
  );
}
