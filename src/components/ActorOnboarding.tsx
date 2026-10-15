import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, ArrowRight, User, MapPin, Theater, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

const SCREEN_SKILLS = ["On-Camera Acting", "Commercial", "Motion Capture", "Green Screen", "Improv", "Stunts", "Firearms Training", "Self-Tape"];
const THEATRE_SKILLS = ["Classical Text", "Stage Combat", "Musical Theatre", "Puppetry", "Devised Theatre", "Immersive Theatre", "Dialects/Accents", "Live Singing", "Instrument Play"];

export function ActorOnboarding({ onComplete }: { onComplete: () => void }) {
  const [step, setStep] = useState(0);
  const [name, setName] = useState("");
  const [city, setCity] = useState("");
  const [discipline, setDiscipline] = useState("");
  const [screenSkills, setScreenSkills] = useState<string[]>([]);
  const [theatreSkills, setTheatreSkills] = useState<string[]>([]);
  const saveProfile = useMutation(api.actors.upsertProfile);
  const markDone = useMutation(api.users.markOnboardingComplete);

  const toggle = (s: string, list: string[], set: (v: string[]) => void) => {
    set(list.includes(s) ? list.filter((x) => x !== s) : [...list, s]);
  };

  const handleSave = async () => {
    try {
      await saveProfile({
        stageName: name || undefined, city: city || undefined,
        primaryDiscipline: (discipline || "both") as any,
        screenSkills, theatreSkills,
        currentlySeeking: (discipline || "both") as any,
      });
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
            <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">{step === 0 ? <User className="size-5" /> : step === 1 ? <MapPin className="size-5" /> : <Theater className="size-5" />}</div>
            <div><CardTitle className="text-lg">{step === 0 ? "Your Profile" : step === 1 ? "Location" : "Your Skills"}</CardTitle><CardDescription>{step === 0 ? "Tell us about yourself" : step === 1 ? "Where are you based?" : "What do you do?"}</CardDescription></div>
          </div></CardHeader>
          <CardContent className="space-y-4 pb-6">
            {step === 0 && (
              <div className="space-y-4">
                <div className="space-y-2"><Label>Full Name</Label><Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" /></div>
                <div className="space-y-2"><Label>City</Label><Input value={city} onChange={(e) => setCity(e.target.value)} placeholder="e.g. New York" /></div>
              </div>
            )}
            {step === 1 && (
              <div className="space-y-4">
                <Label>Primary Market</Label>
                {[{ id: "film_tv", label: "Film & TV" }, { id: "theatre", label: "Theatre" }, { id: "both", label: "Both" }].map((d) => (
                  <Card key={d.id} className={`cursor-pointer border-2 transition-all ${discipline === d.id ? "border-primary bg-primary/5" : "border-border/60"}`} onClick={() => setDiscipline(d.id)}>
                    <CardContent className="p-4"><div className="font-medium">{d.label}</div></CardContent>
                  </Card>
                ))}
              </div>
            )}
            {step === 2 && (
              <div className="space-y-6">
                <div><Label className="mb-3 block">Screen Skills</Label><div className="flex flex-wrap gap-2">
                  {SCREEN_SKILLS.map((s) => <Badge key={s} variant={screenSkills.includes(s) ? "default" : "outline"} className="cursor-pointer" onClick={() => toggle(s, screenSkills, setScreenSkills)}>{s}</Badge>)}
                </div></div>
                <div><Label className="mb-3 block">Theatre Skills</Label><div className="flex flex-wrap gap-2">
                  {THEATRE_SKILLS.map((s) => <Badge key={s} variant={theatreSkills.includes(s) ? "default" : "outline"} className="cursor-pointer" onClick={() => toggle(s, theatreSkills, setTheatreSkills)}>{s}</Badge>)}
                </div></div>
              </div>
            )}
            <div className="flex items-center justify-between pt-4 border-t border-border/40">
              <Button variant="ghost" onClick={() => setStep(Math.max(0, step - 1))} disabled={step === 0} className="gap-1"><ArrowLeft className="size-4" /> Back</Button>
              <span className="text-xs text-muted-foreground">Step {step + 1} of 3</span>
              <Button onClick={next} className="gap-1 rounded-lg">{step === 2 ? "Complete" : "Next"} <ArrowRight className="size-4" /></Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
