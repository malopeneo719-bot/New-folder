import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { MessageCircle, Mail, Copy, Check, ExternalLink, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface ContactModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  targetName: string;
  targetUserId?: string;
  targetPhone?: string;
  targetEmail?: string;
  projectName?: string;
  projectRole?: string;
}

const WHATSAPP_TEMPLATE = (name: string, project: string, role?: string) =>
  `Hi ${name}, I'm reaching out through FINDME${project ? ` regarding ${project}` : ""}${role ? ` for the role of ${role}` : ""}. I'd love to discuss this opportunity with you. Are you available to chat?`;

const GMAIL_SUBJECT = (project?: string, role?: string) =>
  `FINDME: ${project ?? "Opportunity"}${role ? ` — ${role}` : ""} Inquiry`;

const GMAIL_BODY = (name: string, project: string, role?: string) =>
  `Hi ${name},\n\nI found your profile on FINDME and wanted to reach out about${project ? ` ${project}` : ""}${role ? `, specifically the ${role} role` : ""}.\n\nI'd love to discuss this opportunity with you. Would you be available for a quick chat?\n\nBest regards`;

export function ContactModal({
  open,
  onOpenChange,
  targetName,
  targetUserId,
  targetPhone,
  targetEmail,
  projectName,
  projectRole,
}: ContactModalProps) {
  const [channel, setChannel] = useState<"whatsapp" | "gmail" | "in_app">("in_app");
  const [message, setMessage] = useState(
    WHATSAPP_TEMPLATE(targetName, projectName ?? "", projectRole),
  );
  const [copied, setCopied] = useState(false);
  const [sending, setSending] = useState(false);

  const sendInquiry = useMutation(api.inquiries.sendInquiry);

  const handleCopy = () => {
    navigator.clipboard.writeText(message);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleWhatsApp = () => {
    const url = `https://wa.me/${targetPhone?.replace(/\D/g, "")}?text=${encodeURIComponent(message)}`;
    window.open(url, "_blank");
    // Log the inquiry
    if (targetUserId) {
      sendInquiry({ receiverId: targetUserId as any, message, channel: "whatsapp" }).catch(() => {});
    }
  };

  const handleGmail = () => {
    const subject = encodeURIComponent(GMAIL_SUBJECT(projectName, projectRole));
    const body = encodeURIComponent(
      message || GMAIL_BODY(targetName, projectName ?? "", projectRole),
    );
    const url = targetEmail
      ? `mailto:${targetEmail}?subject=${subject}&body=${body}`
      : `https://mail.google.com/mail/?view=cm&su=${subject}&body=${body}`;
    window.open(url, "_blank");
    // Log the inquiry
    if (targetUserId) {
      sendInquiry({ receiverId: targetUserId as any, message, channel: "gmail" }).catch(() => {});
    }
  };

  const handleSendInApp = async () => {
    if (!targetUserId || !message.trim()) return;
    setSending(true);
    try {
      await sendInquiry({
        receiverId: targetUserId as any,
        message,
        channel: "in_app",
      });
      toast.success(`Message sent to ${targetName}`);
      onOpenChange(false);
    } catch {
      toast.error("Failed to send message");
    }
    setSending(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Contact {targetName}</DialogTitle>
          <DialogDescription>
            {projectName
              ? `Re: ${projectName}${projectRole ? ` — ${projectRole}` : ""}`
              : "Send a message through FINDME"}
          </DialogDescription>
        </DialogHeader>

        <div className="flex gap-2">
          {[
            { id: "in_app" as const, label: "In-App", icon: MessageCircle },
            { id: "whatsapp" as const, label: "WhatsApp", icon: MessageCircle, disabled: !targetPhone },
            { id: "gmail" as const, label: "Gmail", icon: Mail, disabled: !targetEmail },
          ].map((ch) => (
            <Button
              key={ch.id}
              variant={channel === ch.id ? "default" : "outline"}
              size="sm"
              className="gap-1.5 rounded-lg"
              disabled={ch.disabled}
              onClick={() => {
                setChannel(ch.id);
                setMessage(
                  ch.id === "whatsapp"
                    ? WHATSAPP_TEMPLATE(targetName, projectName ?? "", projectRole)
                    : GMAIL_BODY(targetName, projectName ?? "", projectRole),
                );
              }}
            >
              <ch.icon className="size-3.5" />
              {ch.label}
            </Button>
          ))}
        </div>

        <div className="space-y-2">
          {channel === "gmail" && (
            <Input
              readOnly
              value={GMAIL_SUBJECT(projectName, projectRole)}
              className="text-sm"
            />
          )}
          <Textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={6}
            className="text-sm"
            placeholder="Write your message..."
          />
        </div>

        <div className="flex items-center justify-between">
          <Button
            variant="ghost"
            size="sm"
            className="gap-1.5 text-xs"
            onClick={handleCopy}
          >
            {copied ? (
              <Check className="size-3.5" />
            ) : (
              <Copy className="size-3.5" />
            )}
            {copied ? "Copied" : "Copy"}
          </Button>
          <div className="flex gap-2">
            {channel === "whatsapp" && (
              <Button onClick={handleWhatsApp} className="gap-1.5 rounded-lg">
                <ExternalLink className="size-3.5" />
                Open WhatsApp
              </Button>
            )}
            {channel === "gmail" && (
              <Button onClick={handleGmail} className="gap-1.5 rounded-lg">
                <ExternalLink className="size-3.5" />
                Open Gmail
              </Button>
            )}
            {channel === "in_app" && (
              <Button onClick={handleSendInApp} className="gap-1.5 rounded-lg" disabled={sending || !message.trim()}>
                {sending ? (
                  <><Loader2 className="size-3.5 animate-spin" /> Sending…</>
                ) : (
                  "Send Message"
                )}
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
