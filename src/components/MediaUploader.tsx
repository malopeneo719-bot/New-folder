import { useState, useEffect, useRef } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Upload, Image, Film, Mic, FileText, X, Plus, Check, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { FileUpload, type UploadedMedia } from "@/components/FileUpload";

// ── Media Uploader ───────────────────────────────────────────────
const MEDIA_CATEGORIES = [
  { id: "headshot" as const, label: "Headshots", icon: Image, color: "text-primary", bg: "bg-primary/10", desc: "Min 3, max 12. Include full-body shots.", accept: "image/*", maxFiles: 12, maxSizeMB: 20 },
  { id: "reel" as const, label: "Screen Reel", icon: Film, color: "text-accent", bg: "bg-accent/10", desc: "Max 2 minutes. Show your best on-camera work.", accept: "video/*", maxFiles: 3, maxSizeMB: 100 },
  { id: "voice" as const, label: "Voice Samples", icon: Mic, color: "text-chart-3", bg: "bg-chart-3/10", desc: "Commercial, narration, character, singing.", accept: "audio/*", maxFiles: 6, maxSizeMB: 30 },
  { id: "monologue" as const, label: "Monologues", icon: FileText, color: "text-chart-5", bg: "bg-chart-5/10", desc: "2-3 contrasting pieces (classical + contemporary). Videos or audio.", accept: "video/*,audio/*", maxFiles: 5, maxSizeMB: 100 },
];

type MediaCategory = typeof MEDIA_CATEGORIES[number]["id"];

const CATEGORY_TO_MEDIA_TYPE: Record<MediaCategory, "headshot" | "screenReel" | "voiceSample" | "monologue"> = {
  headshot: "headshot",
  reel: "screenReel",
  voice: "voiceSample",
  monologue: "monologue",
};

/** Convert a saved storage ID into an UploadedMedia object with a Convex URL */
function storageIdToMedia(storageId: string, index: number, category: MediaCategory, url: string): UploadedMedia {
  return {
    id: `saved-${category}-${index}-${storageId}`,
    name: `${category === "headshot" ? "Headshot" : category === "reel" ? "Screen Reel" : category === "voice" ? "Voice Sample" : "Monologue"} ${index + 1}`,
    type: category === "headshot" ? "image" : category === "reel" ? "video" : category === "voice" ? "audio" : "video",
    mimeType: "",
    size: 0,
    storageId,
    previewUrl: url,
  };
}

export function MediaUploader() {
  const profile = useQuery(api.actors.getProfile);
  const generateUploadUrl = useMutation(api.media.generateUploadUrl);
  const saveMediaRef = useMutation(api.media.saveMediaRef);

  const [headshots, setHeadshots] = useState<UploadedMedia[]>([]);
  const [screenReel, setScreenReel] = useState<UploadedMedia[]>([]);
  const [voiceSamples, setVoiceSamples] = useState<UploadedMedia[]>([]);
  const [monologues, setMonologues] = useState<UploadedMedia[]>([]);
  const [activeCategory, setActiveCategory] = useState<MediaCategory>("headshot");
  const loadedRef = useRef(false);

  // Load existing media from Convex profile — convert storage IDs to URLs
  useEffect(() => {
    if (!profile || loadedRef.current) return;
    loadedRef.current = true;

    const loadMedia = async (
      storageIds: string[],
      category: MediaCategory,
    ): Promise<UploadedMedia[]> => {
      if (!storageIds.length) return [];
      const results: UploadedMedia[] = [];
      for (let i = 0; i < storageIds.length; i++) {
        // For display, we'll use a placeholder URL that gets resolved
        // Convex storage URLs are stable once generated
        const url = `convex-storage://${storageIds[i]}`;
        results.push(storageIdToMedia(storageIds[i], i, category, url));
      }
      return results;
    };

    (async () => {
      if (profile.headshots?.length) {
        setHeadshots(await loadMedia(profile.headshots, "headshot"));
      }
      if (profile.screenReel) {
        setScreenReel([storageIdToMedia(profile.screenReel, 0, "reel", `convex-storage://${profile.screenReel}`)]);
      }
      if (profile.voiceSamples?.length) {
        setVoiceSamples(await loadMedia(profile.voiceSamples, "voice"));
      }
      if (profile.monologues?.length) {
        setMonologues(await loadMedia(profile.monologues, "monologue"));
      }
    })();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile !== undefined]);

  const markUnsaved = () => {}; // no longer needed — each upload saves immediately

  const setters: Record<MediaCategory, (files: UploadedMedia[]) => void> = {
    headshot: setHeadshots,
    reel: setScreenReel,
    voice: setVoiceSamples,
    monologue: setMonologues,
  };

  const fileSets: Record<MediaCategory, UploadedMedia[]> = {
    headshot: headshots,
    reel: screenReel,
    voice: voiceSamples,
    monologue: monologues,
  };

  const active = MEDIA_CATEGORIES.find((c) => c.id === activeCategory)!;

  return (
    <div className="space-y-6">
      {/* Category picker */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {MEDIA_CATEGORIES.map((cat) => {
          const count = fileSets[cat.id].length;
          return (
            <button key={cat.id} onClick={() => setActiveCategory(cat.id)}
              className={`cc-card-hover rounded-xl border p-4 text-left transition-all ${activeCategory === cat.id ? "border-primary shadow-md shadow-primary/10 bg-card" : "border-border/60 bg-card/50 hover:border-border"}`}>
              <div className={`flex size-9 items-center justify-center rounded-lg ${cat.bg} ${cat.color} mb-2`}><cat.icon className="size-4" /></div>
              <p className="text-sm font-bold">{cat.label}</p>
              <p className="text-[10px] text-muted-foreground mt-0.5">{count} uploaded</p>
            </button>
          );
        })}
      </div>

      {/* Active category uploader */}
      <Card className="border-border/60">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <active.icon className={`size-4 ${active.color}`} />{active.label}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <FileUpload
            accept={active.accept}
            fileType={active.id === "headshot" ? "image" : active.id === "reel" ? "video" : active.id === "voice" ? "audio" : "video"}
            label={active.label}
            description={active.desc}
            icon={active.icon}
            color={active.color}
            bg={active.bg}
            maxFiles={active.maxFiles}
            maxSizeMB={active.maxSizeMB}
            mediaType={CATEGORY_TO_MEDIA_TYPE[activeCategory]}
            files={fileSets[activeCategory]}
            onFilesChange={setters[activeCategory]}
          />
        </CardContent>
      </Card>

      {/* Info badge — no save button needed, each file saves individually */}
      <div className="flex justify-center">
        <div className="inline-flex items-center gap-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 px-4 py-2 text-sm text-emerald-400">
          <Check className="size-4" /> Files save automatically as you upload
        </div>
      </div>
    </div>
  );
}

// ── Credits Manager ──────────────────────────────────────────────
interface Credit { projectName: string; role: string; type: string; platform: string; year: number; productionCompany?: string; director?: string; }

export function CreditsManager({ onSave }: { onSave?: (screen: Credit[], theatre: Credit[]) => Promise<void> }) {
  const [screenCredits, setScreenCredits] = useState<Credit[]>([]);
  const [theatreCredits, setTheatreCredits] = useState<Credit[]>([]);
  const [showForm, setShowForm] = useState<"screen" | "theatre" | null>(null);
  const [form, setForm] = useState({ projectName: "", role: "", type: "lead", platform: "feature", year: new Date().getFullYear(), productionCompany: "", director: "" });

  const addCredit = async (type: "screen" | "theatre") => {
    if (!form.projectName.trim()) return;
    const credit = { ...form };
    const newScreen = type === "screen" ? [...screenCredits, credit] : screenCredits;
    const newTheatre = type === "theatre" ? [...theatreCredits, credit] : theatreCredits;
    if (type === "screen") setScreenCredits(newScreen);
    else setTheatreCredits(newTheatre);
    setForm({ projectName: "", role: "", type: "lead", platform: "feature", year: new Date().getFullYear(), productionCompany: "", director: "" });
    setShowForm(null);
    try { await onSave?.(newScreen, newTheatre); } catch {}
    toast.success("Credit added & saved");
  };

  const removeCredit = async (type: "screen" | "theatre", idx: number) => {
    const newScreen = type === "screen" ? screenCredits.filter((_, i) => i !== idx) : screenCredits;
    const newTheatre = type === "theatre" ? theatreCredits.filter((_, i) => i !== idx) : theatreCredits;
    setScreenCredits(newScreen);
    setTheatreCredits(newTheatre);
    try { await onSave?.(newScreen, newTheatre); } catch {}
  };

  const renderCredits = (list: Credit[], type: "screen" | "theatre") => (
    list.length > 0 ? list.map((c, i) => (
      <div key={i} className="flex items-center gap-3 rounded-lg bg-muted/20 px-3 py-2 text-sm">
        <div className="flex-1 min-w-0"><p className="font-medium truncate">{c.projectName}</p><p className="text-xs text-muted-foreground">{c.role} · {c.platform} · {c.year}</p></div>
        <Button variant="ghost" size="icon" className="size-7" onClick={() => removeCredit(type, i)}><X className="size-3 text-destructive" /></Button>
      </div>
    )) : <p className="text-xs text-muted-foreground">No {type} credits yet.</p>
  );

  return (
    <div className="space-y-4">
      <h3 className="font-bold text-sm">Credits</h3>
      {(["screen", "theatre"] as const).map((type) => (
        <Card key={type} className="border-border/60"><CardContent className="p-4 space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-sm font-bold capitalize">{type} Credits</p>
            <Button variant="ghost" size="sm" className="gap-1 text-xs" onClick={() => setShowForm(type)}><Plus className="size-3" /> Add</Button>
          </div>
          {renderCredits(type === "screen" ? screenCredits : theatreCredits, type)}
        </CardContent></Card>
      ))}
      {showForm && (
        <Card className="border-primary/30 bg-primary/5"><CardContent className="p-4 space-y-3">
          <p className="text-sm font-bold">{showForm === "screen" ? "Add Screen Credit" : "Add Theatre Credit"}</p>
          <div className="grid grid-cols-2 gap-3">
            <Input placeholder="Project name" value={form.projectName} onChange={(e) => setForm({ ...form, projectName: e.target.value })} className="text-sm" />
            <Input placeholder="Role" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })} className="text-sm" />
            <Input placeholder="Production company" value={form.productionCompany} onChange={(e) => setForm({ ...form, productionCompany: e.target.value })} className="text-sm" />
            <Input placeholder="Director" value={form.director} onChange={(e) => setForm({ ...form, director: e.target.value })} className="text-sm" />
          </div>
          <div className="flex gap-2">
            <Button size="sm" onClick={() => addCredit(showForm)}>Save</Button>
            <Button size="sm" variant="ghost" onClick={() => setShowForm(null)}>Cancel</Button>
          </div>
        </CardContent></Card>
      )}
    </div>
  );
}

// ── Skills Manager ───────────────────────────────────────────────
const SKILL_GROUPS = [
  { label: "Screen Skills", key: "screen", skills: ["On-Camera Acting", "Commercial", "Motion Capture", "Green Screen", "Improv", "Stunts", "Firearms Training"] },
  { label: "Theatre Skills", key: "theatre", skills: ["Classical Text", "Stage Combat", "Musical Theatre", "Puppetry", "Devised Theatre", "Immersive Theatre", "Dialects/Accents", "Live Singing", "Instrument Play"] },
  { label: "Vocal Range", key: "vocalRange", skills: ["Soprano", "Mezzo-Soprano", "Alto", "Tenor", "Baritone", "Bass"] },
  { label: "Dance", key: "dance", skills: ["Ballet", "Tap", "Jazz", "Hip-hop", "Contemporary", "Partnering"] },
  { label: "Stage Combat", key: "combat", skills: ["Unarmed", "Rapier & Dagger", "Broadsword", "Quarterstaff"] },
  { label: "Classical Training", key: "classical", skills: ["Beginner", "Intermediate", "Advanced", "MFA"] },
];

export function SkillsManager({ onSave }: { onSave?: (skills: Record<string, string[]>) => Promise<void> }) {
  const [selected, setSelected] = useState<Record<string, Set<string>>>({
    screen: new Set(), theatre: new Set(), vocalRange: new Set(),
    dance: new Set(), combat: new Set(), classical: new Set(),
  });

  const toggle = (group: string, skill: string) => {
    setSelected((prev) => {
      const next = { ...prev };
      const set = new Set(prev[group]);
      if (set.has(skill)) set.delete(skill);
      else set.add(skill);
      next[group] = set;
      return next;
    });
  };

  const handleSave = async () => {
    const skills: Record<string, string[]> = {};
    for (const [key, set] of Object.entries(selected)) {
      skills[key] = [...set];
    }
    try { await onSave?.(skills); } catch {}
    toast.success("Skills saved");
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-bold text-sm">Skills & Training</h3>
        <Button size="sm" onClick={handleSave}>Save Skills</Button>
      </div>
      {SKILL_GROUPS.map((group) => (
        <Card key={group.label} className="border-border/60"><CardContent className="p-4">
          <p className="text-xs font-bold mb-2 text-muted-foreground uppercase tracking-wider">{group.label}</p>
          <div className="flex flex-wrap gap-1.5">
            {group.skills.map((skill) => (
              <Badge key={skill} variant={selected[group.key]?.has(skill) ? "default" : "outline"} className="cursor-pointer text-[11px]" onClick={() => toggle(group.key, skill)}>
                {skill}
              </Badge>
            ))}
          </div>
        </CardContent></Card>
      ))}
    </div>
  );
}
