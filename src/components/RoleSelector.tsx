import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Users, Upload, BarChart3, ArrowRight, Sparkles } from "lucide-react";
import { toast } from "sonner";

type RoleChoice = "actor" | "director" | "theatre_maker";

const roles: { id: RoleChoice; label: string; sublabel: string; icon: typeof Users; color: string; bg: string; desc: string }[] = [
  { id: "actor", label: "Actor", sublabel: "Get discovered", icon: Users, color: "text-primary", bg: "bg-primary/10",
    desc: "Build your profile with headshots, reels, credits, and monologues. Get discovered for screen and stage work." },
  { id: "director", label: "Director / Casting", sublabel: "Find talent", icon: Upload, color: "text-accent", bg: "bg-accent/10",
    desc: "Search actors with advanced filters, build shortlists, request self-tapes, and contact talent directly." },
  { id: "theatre_maker", label: "Theatre Maker", sublabel: "Build productions", icon: BarChart3, color: "text-chart-3", bg: "bg-chart-3/10",
    desc: "Post productions, assemble creative teams, manage casting breakdowns, and discover collaborators." },
];

export function RoleSelector({ onComplete }: { onComplete: () => void }) {
  const [step, setStep] = useState<"role" | "info">("role");
  const [selected, setSelected] = useState<RoleChoice | null>(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const updateRole = useMutation(api.users.updateRole);
  const updateProfile = useMutation(api.users.updateProfile);

  const handleContinue = async () => {
    if (!selected) return;

    if (step === "role") {
      // Validate name and email
      if (!name.trim()) {
        toast.error("Please enter your name");
        return;
      }
      if (!email.trim() || !email.includes("@")) {
        toast.error("Please enter a valid Gmail address");
        return;
      }
      // Save profile then role
      await updateProfile({ name: name.trim(), email: email.trim() });
      await updateRole({ role: selected });
      toast.success("Welcome to FINDME!");
      onComplete();
    }
  };

  if (step === "info") {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4 py-12">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex size-14 items-center justify-center rounded-2xl bg-primary text-primary-foreground">
            <Sparkles className="size-7" />
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight">Create Your Profile</h1>
          <p className="mt-2 text-muted-foreground">We need a few details to get you started.</p>
        </div>
        <Card className="w-full max-w-md border-border/60">
          <CardContent className="p-6 space-y-4">
            <div className="space-y-2">
              <Label>Full Name</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Your full name" autoFocus />
            </div>
            <div className="space-y-2">
              <Label>Gmail Address</Label>
              <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@gmail.com" />
              <p className="text-[10px] text-muted-foreground">Required for contact and verification. Other users will reach you through this email.</p>
            </div>
            <div className="flex gap-2 pt-2">
              <Button variant="ghost" onClick={() => setStep("role")}>Back</Button>
              <Button className="flex-1 gap-1 rounded-xl" onClick={handleContinue}>
                Continue <ArrowRight className="size-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4 py-12">
      <div className="mb-8 text-center">
        <div className="mx-auto mb-4 flex size-14 items-center justify-center rounded-2xl bg-primary text-primary-foreground">
          <Sparkles className="size-7" />
        </div>
        <h1 className="text-2xl font-extrabold tracking-tight">Welcome to FINDME</h1>
        <p className="mt-2 text-muted-foreground">How would you like to use the platform?</p>
      </div>
      <div className="grid w-full max-w-3xl gap-4 sm:grid-cols-3">
        {roles.map((role) => (
          <Card key={role.id}
            className={`cc-card-hover cursor-pointer border-2 transition-all ${selected === role.id ? "border-primary shadow-lg shadow-primary/15" : "border-border/60 hover:border-border"}`}
            onClick={() => setSelected(role.id)}>
            <CardContent className="p-6 text-center">
              <div className={`mx-auto mb-4 flex size-12 items-center justify-center rounded-2xl ${role.bg} ${role.color}`}>
                <role.icon className="size-6" />
              </div>
              <h3 className="font-bold">{role.label}</h3>
              <p className="text-xs font-medium text-muted-foreground mt-0.5">{role.sublabel}</p>
              <p className="mt-3 text-xs leading-relaxed text-muted-foreground">{role.desc}</p>
            </CardContent>
          </Card>
        ))}
      </div>
      <Button size="lg" className="mt-8 gap-2 rounded-xl px-8" disabled={!selected} onClick={() => setStep("info")}>
        Continue <ArrowRight className="size-4" />
      </Button>
    </div>
  );
}
