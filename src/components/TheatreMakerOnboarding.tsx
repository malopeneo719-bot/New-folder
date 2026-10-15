import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, ArrowRight, Palette, User, Globe, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

const DISCIPLINES = ["director", "playwright", "producer", "set_designer", "costume_designer", "lighting_designer", "sound_designer", "stage_manager", "composer", "choreographer", "dramaturg", "intimacy_coordinator"];

export function TheatreMakerOnboarding({ onComplete }: { onComplete: () => void }) {
  const [step, setStep] = useState(0);
  const [roles, setRoles] = useState<string[]>([]);
  const [bio, setBio] = useState("");
  const [city, setCity] = useState("");
  const saveProfile = useMutation(api.theatreMakers.upsertProfile);
  const markDone = useMutation(api.users.markOnboardingComplete);

  const toggle = (r: string) => setRoles((p) => p.includes(r) ? p.filter((x) => x !== r) : [...p, r]);

  const handleSave = async () => {
    try {
      await saveProfile({ primaryRoles: roles as any, bio: bio || undefined, city: city || undefined });
      await markDone();
      toast.success("Profile saved!");
      onComplete();
    } catch { toast.error("Failed to save"); }
  };

  const next = () => { if (step < 2) setStep(step + 1); else handleSave(); };

  return (
    <div className="min-h-screen bg-background py-8 px-4">
      <div className="mx-auto max-w-2xl">
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            {[0, 1, 2].map((i) => (
              <div key={i} className={`flex size-8 items-center justify-center rounded-full text-xs font-semibold transition-all ${i < step ? "bg-primary text-primary-foreground" : i === step ? "bg-primary/20 text-primary border-2 border-primary" : "bg-muted text-muted-foreground"}`}>
                {i < step ? <CheckCircle2 className="size-4" /> : i + 1}
              </div>
            ))}
          </div>
          <div className="h-1.5 rounded-full bg-muted overflow-hidden"><div className="h-full rounded-full bg-primary transition-all duration-500" style={{ width: `${((step + 1) / 3) * 100}%` }} /></div>
        </div>
        <Card className="border-border/60">
          <CardHeader><div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-xl bg-chart-3/10 text-chart-3">{step === 0 ? <Palette className="size-5" /> : step === 1 ? <User className="size-5" /> : <Globe className="size-5" />}</div>
            <div><CardTitle className="text-lg">{step === 0 ? "Your Discipline" : step === 1 ? "About You" : "Location"}</CardTitle><CardDescription>{step === 0 ? "What do you do?" : step === 1 ? "Tell us about your practice" : "Where are you based?"}</CardDescription></div>
          </div></CardHeader>
          <CardContent className="space-y-4 pb-6">
            {step === 0 && (
              <div className="flex flex-wrap gap-2">
                {DISCIPLINES.map((d) => (
                  <Badge key={d} variant={roles.includes(d) ? "default" : "outline"} className="cursor-pointer text-sm py-1.5 px-3 capitalize" onClick={() => toggle(d)}>
                    {d.replace(/_/g, " ")}
                  </Badge>
                ))}
              </div>
            )}
            {step === 1 && (
              <div className="space-y-4">
                <div className="space-y-2"><Label>Bio</Label><Textarea value={bio} onChange={(e) => setBio(e.target.value)} rows={3} placeholder="A brief bio about your work..." /></div>
                <div className="space-y-2"><Label>City</Label><Input value={city} onChange={(e) => setCity(e.target.value)} placeholder="e.g. London" /></div>
              </div>
            )}
            {step === 2 && (
              <div className="text-center py-6 space-y-4">
                <div className="mx-auto flex size-16 items-center justify-center rounded-2xl bg-primary/10 text-primary"><CheckCircle2 className="size-8" /></div>
                <h3 className="text-lg font-bold">You're all set!</h3>
                <p className="text-sm text-muted-foreground max-w-sm mx-auto">Start posting productions, assembling creative teams, and discovering collaborators.</p>
              </div>
            )}
            <div className="flex items-center justify-between pt-4 border-t border-border/40">
              <Button variant="ghost" onClick={() => setStep(Math.max(0, step - 1))} disabled={step === 0} className="gap-1"><ArrowLeft className="size-4" /> Back</Button>
              <span className="text-xs text-muted-foreground">Step {step + 1} of 3</span>
              <Button onClick={next} className="gap-1 rounded-lg">{step === 2 ? "Start Exploring" : "Next"} <ArrowRight className="size-4" /></Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
