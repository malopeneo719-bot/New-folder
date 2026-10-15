import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ArrowLeft, Send, MessageCircle } from "lucide-react";

interface ChatThreadProps {
  otherUserId: string;
  otherUserName: string;
  onBack: () => void;
}

export function ChatThread({ otherUserId, otherUserName, onBack }: ChatThreadProps) {
  const messages = useQuery(api.inquiries.getConversation, { otherUserId: otherUserId as any });
  const sendMessage = useMutation(api.inquiries.sendMessage);
  const markRead = useMutation(api.inquiries.markConversationRead);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  // Mark messages as read when opening conversation
  useEffect(() => {
    if (otherUserId) {
      markRead({ otherUserId: otherUserId as any }).catch(() => {});
    }
  }, [otherUserId, markRead]);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages?.length]);

  const handleSend = async () => {
    if (!text.trim() || sending) return;
    setSending(true);
    try {
      await sendMessage({ receiverId: otherUserId as any, message: text.trim() });
      setText("");
    } catch {
      // silent
    }
    setSending(false);
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center gap-3 border-b border-border/50 px-4 py-3">
        <Button variant="ghost" size="icon" className="size-8" onClick={onBack}>
          <ArrowLeft className="size-4" />
        </Button>
        <Avatar className="size-9">
          <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">
            {otherUserName.charAt(0)}
          </AvatarFallback>
        </Avatar>
        <div>
          <p className="text-sm font-bold">{otherUserName}</p>
          <p className="text-[10px] text-emerald-400">Online</p>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
        {messages === undefined ? (
          <div className="flex items-center justify-center h-full">
            <div className="animate-pulse text-muted-foreground text-sm">Loading messages…</div>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <MessageCircle className="size-10 text-muted-foreground/30 mb-3" />
            <p className="text-sm text-muted-foreground">No messages yet.</p>
            <p className="text-xs text-muted-foreground/60 mt-1">Send a message to start the conversation.</p>
          </div>
        ) : (
          messages.map((msg) => (
            <div
              key={msg._id}
              className={`flex ${msg.isMine ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[80%] rounded-2xl px-4 py-2.5 ${
                  msg.isMine
                    ? "bg-primary text-primary-foreground rounded-br-md"
                    : "bg-muted border border-border/40 rounded-bl-md"
                }`}
              >
                <p className="text-sm leading-relaxed">{msg.message}</p>
                <p className={`text-[10px] mt-1 ${msg.isMine ? "text-primary-foreground/60" : "text-muted-foreground"}`}>
                  {new Date(msg.createdAt).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}
                  {msg.isMine && msg.read && <span className="ml-1.5">✓✓</span>}
                </p>
              </div>
            </div>
          ))
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="border-t border-border/50 px-4 py-3">
        <div className="flex gap-2">
          <Input
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Type a message…"
            className="flex-1"
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
          />
          <Button
            size="icon"
            className="size-10 rounded-xl shrink-0"
            onClick={handleSend}
            disabled={!text.trim() || sending}
          >
            <Send className="size-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}

/**
 * Conversation list — shows all conversations with last message preview.
 */
export function ConversationList({ onSelect }: { onSelect: (userId: string, name: string) => void }) {
  const conversations = useQuery(api.inquiries.getConversations);

  if (conversations === undefined) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-pulse text-muted-foreground text-sm">Loading conversations…</div>
      </div>
    );
  }

  if (conversations.length === 0) {
    return (
      <Card className="border-dashed border-2 border-border/60">
        <CardContent className="p-12 text-center">
          <MessageCircle className="mx-auto size-10 text-muted-foreground/50 mb-3" />
          <p className="text-sm text-muted-foreground">No conversations yet.</p>
          <p className="text-xs text-muted-foreground/60 mt-1">Contact an actor or director to start chatting.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-2">
      {conversations.map((convo) => (
        <button
          key={convo.otherUserId}
          className="w-full flex items-center gap-3 rounded-xl border border-border/40 bg-card/50 hover:bg-card px-4 py-3 text-left transition-colors"
          onClick={() => onSelect(convo.otherUserId, convo.otherUserName)}
        >
          <Avatar className="size-11 shrink-0">
            <AvatarFallback className="bg-primary/10 text-primary text-sm font-semibold">
              {convo.otherUserName.charAt(0)}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <p className="text-sm font-bold truncate">{convo.otherUserName}</p>
              <span className="text-[10px] text-muted-foreground shrink-0 ml-2">
                {new Date(convo.lastMessageTime).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}
              </span>
            </div>
            <p className="text-xs text-muted-foreground truncate mt-0.5">{convo.lastMessage}</p>
          </div>
          {convo.unreadCount > 0 && (
            <Badge className="size-5 rounded-full p-0 flex items-center justify-center text-[10px] shrink-0">
              {convo.unreadCount}
            </Badge>
          )}
        </button>
      ))}
    </div>
  );
}
