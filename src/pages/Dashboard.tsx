import { useState } from "react";
import { useNavigate } from "react-router";
import { useQuery, useMutation } from "convex/react";
import { useAuthActions } from "@convex-dev/auth/react";
import { useConvexAuth } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Theater, Users, Palette, Star, MessageCircle, Briefcase, Search, Plus,
  FileText, TrendingUp, Eye, Bell, Image, Film, ChevronLeft, Loader2, CheckCircle2, Home, Shield,
} from "lucide-react";
import { ContactModal } from "@/components/ContactModal";
import { ProjectCard } from "@/components/ProjectCard";
import { ProjectDetail } from "@/components/ProjectDetail";
import { ShortlistPanel, ShortlistButton } from "@/components/ShortlistManager";
import { ConversationList, ChatThread } from "@/components/ChatThread";
import { MediaUploader, CreditsManager, SkillsManager } from "@/components/MediaUploader";

export default function Dashboard() {
  const navigate = useNavigate();
  const { isAuthenticated, isLoading: authLoading } = useConvexAuth();
  const { signIn, signOut } = useAuthActions();
  const user = useQuery(api.users.currentUser);
  const openProjects = useQuery(api.projects.listOpen, {});
  const myProjects = useQuery(api.projects.getMyProjects);
  const myInquiries = useQuery(api.inquiries.getMyInquiries);
  const myActorProfile = useQuery(api.actors.getProfile);
  const myTmProfile = useQuery(api.theatreMakers.getProfile);

  const [contactTarget, setContactTarget] = useState<{ name: string; userId?: string; phone?: string; email?: string } | null>(null);
  const [mobileTab, setMobileTab] = useState("overview");
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);

  const role = user?.role;
  const onboardingDone = user?.onboardingComplete;
  const isActor = role === "actor";
  const isDirector = role === "director";
  const isTheatreMaker = role === "theatre_maker";

  if (!isAuthenticated || !user) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4 p-4 text-center">
        <div className="flex size-12 items-center justify-center rounded-xl bg-primary text-primary-foreground font-extrabold text-xl">F</div>
        <p className="text-sm font-semibold">You're signed out</p>
        <p className="max-w-sm text-sm text-muted-foreground">
          Sign in with your email and password to get to your dashboard.
        </p>
        <a
          href="/"
          className="inline-flex h-9 items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
        >
          Go to FINDME
        </a>
      </div>
    );
  }
  if (!user.role) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4 p-4 text-center">
        <div className="flex size-12 items-center justify-center rounded-xl bg-primary text-primary-foreground font-extrabold text-xl">F</div>
        <p className="text-sm font-semibold">One more step</p>
        <p className="max-w-sm text-sm text-muted-foreground">
          Pick your role on the FINDME home page to finish setting up your profile —
          it takes less than a minute.
        </p>
        <a
          href="/"
          className="inline-flex h-9 items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
        >
          Finish my profile
        </a>
      </div>
    );
  }
  // Skip role selector and onboarding — go straight to dashboard

  const completionPct = myActorProfile?.profileCompletionPct ?? 0;

  return (
    <main className="min-h-screen bg-background pb-20 sm:pb-0">
      <header className="sticky top-0 z-40 border-b border-border/50 bg-background/80 backdrop-blur-xl">
        <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-2.5">
            <Button variant="ghost" size="icon" className="size-8" onClick={async () => { try { await signOut(); } catch {} window.location.href = "/"; }} title="Back to Home">
              <Home className="size-4" />
            </Button>
            <div className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground font-extrabold text-sm">F</div>
            <span className="font-extrabold tracking-tight">FINDME</span>
            <Badge variant="secondary" className="text-[10px] ml-1">{isActor ? "Actor" : isDirector ? "Director" : "Theatre Maker"}</Badge>
          </div>
          <div className="flex items-center gap-2">
            <div className="hidden sm:flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1">
              <Shield className="size-3 text-emerald-500" />
              <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">Secured by TxTheatre</span>
            </div>
            <Button variant="ghost" size="icon" className="relative"><Bell className="size-4" /><span className="absolute -top-0.5 -right-0.5 size-2 rounded-full bg-accent" /></Button>
            <Avatar className="size-8"><AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">{user?.name?.charAt(0)?.toUpperCase() || "?"}</AvatarFallback></Avatar>
            <SignOutButton />
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
        <div className="mb-6">
          <h1 className="text-2xl font-extrabold tracking-tight">Welcome{user?.name ? `, ${user.name}` : ""}!</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {isActor ? "Build your profile, discover projects, and get discovered."
              : isDirector ? "Search talent, shortlist actors, and connect directly."
              : "Create productions, assemble teams, and manage casting."}
          </p>
        </div>

        {isActor && <ActorDashboard completionPct={completionPct} projects={openProjects} inquiries={myInquiries} profile={myActorProfile} onContact={setContactTarget} onSelectProject={setSelectedProjectId} mobileTab={mobileTab} setMobileTab={setMobileTab} />}
        {isDirector && <DirectorDashboard inquiries={myInquiries} onContact={setContactTarget} mobileTab={mobileTab} setMobileTab={setMobileTab} />}
        {isTheatreMaker && <TheatreMakerDashboard projects={myProjects} inquiries={myInquiries} profile={myTmProfile} onSelectProject={setSelectedProjectId} mobileTab={mobileTab} setMobileTab={setMobileTab} onContact={setContactTarget} />}
      </div>

      {contactTarget && (
        <ContactModal open={!!contactTarget} onOpenChange={(o: boolean) => !o && setContactTarget(null)}
          targetName={contactTarget.name} targetUserId={contactTarget.userId} targetPhone={contactTarget.phone} targetEmail={contactTarget.email} />
      )}

      {selectedProjectId && (
        <ProjectDetail projectId={selectedProjectId} onClose={() => setSelectedProjectId(null)} />
      )}

      {/* Mobile bottom nav — ACTUALLY CLICKABLE */}
      <nav className="fixed bottom-0 inset-x-0 z-50 border-t border-border/50 bg-background/95 backdrop-blur-xl sm:hidden">
        <div className="flex items-center justify-around h-14 px-2">
          {(isActor ? [
            { icon: TrendingUp, label: "Home", tab: "overview" },
            { icon: Briefcase, label: "Projects", tab: "projects" },
            { icon: Image, label: "Media", tab: "media" },
            { icon: Star, label: "Skills", tab: "skills" },
            { icon: MessageCircle, label: "Inbox", tab: "inbox" },
          ] : isDirector ? [
            { icon: Search, label: "Search", tab: "search" },
            { icon: Star, label: "Lists", tab: "shortlists" },
            { icon: MessageCircle, label: "Messages", tab: "inbox" },
          ] : [
            { icon: TrendingUp, label: "Home", tab: "overview" },
            { icon: Search, label: "Discover", tab: "search" },
            { icon: Theater, label: "Shows", tab: "projects" },
            { icon: Plus, label: "Create", tab: "create" },
            { icon: MessageCircle, label: "Inbox", tab: "inbox" },
          ]).map((n) => (
            <button
              key={n.tab}
              onClick={() => setMobileTab(n.tab)}
              className={`flex flex-col items-center gap-0.5 text-[10px] py-1 px-2 rounded-lg transition-colors ${
                mobileTab === n.tab ? "text-primary font-bold" : "text-muted-foreground"
              }`}
            >
              <n.icon className="size-5" />
              {n.label}
            </button>
          ))}
        </div>
      </nav>
    </main>
  );
}

function SignOutButton() {
  const { signOut } = useAuthActions();
  return (
    <Button variant="ghost" size="sm" className="text-xs text-muted-foreground gap-1" onClick={async () => {
      try { await signOut(); } catch {}
      window.location.href = "/";
    }}>Sign Out</Button>
  );
}

function InboxView() {
  const [chatPartner, setChatPartner] = useState<{ userId: string; name: string } | null>(null);

  if (chatPartner) {
    return (
      <ChatThread
        otherUserId={chatPartner.userId}
        otherUserName={chatPartner.name}
        onBack={() => setChatPartner(null)}
      />
    );
  }

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-extrabold">Messages</h2>
      <ConversationList onSelect={(userId, name) => setChatPartner({ userId, name })} />
    </div>
  );
}

// ── Actor Dashboard ──────────────────────────────────────────────
function ActorDashboard({ completionPct, projects, inquiries, profile, onContact, onSelectProject, mobileTab, setMobileTab }: {
  completionPct: number; projects: any[] | undefined; inquiries: any; profile: any;
  onContact: (t: { name: string; userId?: string; phone?: string; email?: string }) => void;
  onSelectProject: (id: string) => void;
  mobileTab: string; setMobileTab: (v: string) => void;
}) {
  // Save profile to Convex
  const saveProfile = useMutation(api.actors.upsertProfile);

  return (
    <Tabs value={mobileTab} onValueChange={setMobileTab} className="space-y-6">
      <TabsList className="hidden sm:flex">
        <TabsTrigger value="overview" className="gap-1.5"><TrendingUp className="size-3.5" /> Overview</TabsTrigger>
        <TabsTrigger value="media" className="gap-1.5"><Image className="size-3.5" /> Media</TabsTrigger>
        <TabsTrigger value="skills" className="gap-1.5"><Star className="size-3.5" /> Skills</TabsTrigger>
        <TabsTrigger value="projects" className="gap-1.5"><Briefcase className="size-3.5" /> Projects</TabsTrigger>
        <TabsTrigger value="inbox" className="gap-1.5"><MessageCircle className="size-3.5" /> Inbox</TabsTrigger>
      </TabsList>

      <TabsContent value="overview" className="space-y-6">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { label: "Profile Strength", value: `${completionPct}%`, icon: TrendingUp, color: "text-primary" },
            { label: "Applications", value: "0", icon: FileText, color: "text-accent" },
            { label: "Profile Views", value: "0", icon: Eye, color: "text-chart-3" },
            { label: "Inquiries", value: inquiries?.received?.length ?? 0, icon: MessageCircle, color: "text-chart-4" },
          ].map((s) => (
            <Card key={s.label} className="border-border/60"><CardContent className="p-4 flex items-center justify-between">
              <div><p className="text-xs text-muted-foreground">{s.label}</p><p className="text-2xl font-extrabold mt-1">{s.value}</p></div>
              <div className={`flex size-10 items-center justify-center rounded-xl bg-muted/50 ${s.color}`}><s.icon className="size-5" /></div>
            </CardContent></Card>
          ))}
        </div>
        <Card className="border-border/60"><CardContent className="p-5">
          <div className="flex items-center justify-between mb-3"><h3 className="font-bold text-sm">Profile Completion</h3><span className="text-xs text-muted-foreground">{completionPct}%</span></div>
          <Progress value={completionPct} className="h-2" />
          {completionPct < 70 && <p className="mt-3 text-xs text-muted-foreground">Complete your profile — add headshots, reels, credits, and skills to get discovered.</p>}
        </CardContent></Card>
        <CreditsManager onSave={async (screenCredits, theatreCredits) => {
          await saveProfile({ screenCredits: screenCredits as any, theatreCredits: theatreCredits as any });
        }} />
      </TabsContent>

      <TabsContent value="media" className="space-y-4">
        <h2 className="text-lg font-extrabold">Your Media</h2>
        <MediaUploader />
      </TabsContent>

      <TabsContent value="skills" className="space-y-4">
        <SkillsManager onSave={async (skills) => {
          await saveProfile({
            screenSkills: skills.screen,
            theatreSkills: skills.theatre,
            vocalRange: skills.vocalRange[0],
            danceStyles: skills.dance,
            stageCombatCertification: skills.combat,
            classicalTrainingLevel: skills.classical[0],
          });
        }} />
      </TabsContent>

      <TabsContent value="projects" className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-extrabold">Browse Projects</h2>
          <div className="flex gap-2"><Badge variant="outline" className="cursor-pointer">All</Badge><Badge variant="outline" className="cursor-pointer">Theatre</Badge><Badge variant="outline" className="cursor-pointer">Film/TV</Badge></div>
        </div>
        {projects && projects.length > 0 ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {projects.map((p) => (
              <ProjectCard key={p._id} title={p.title} projectType={p.projectType} venueCity={p.venueCity} compensationType={p.compensationType}
                submissionDeadline={p.submissionDeadline} status={p.status} openRolesCount={p.roles.length} creatorName={p.creatorName}
                imageUrl={p.resolvedImageUrl ?? p.imageUrl} videoUrls={p.videoUrls ?? []}
                onView={() => onSelectProject(p._id)} />
            ))}
          </div>
        ) : <Card className="border-dashed border-2 border-border/60"><CardContent className="p-8 text-center"><Briefcase className="mx-auto size-10 text-muted-foreground/50 mb-3" /><p className="text-sm text-muted-foreground">No open projects yet.</p></CardContent></Card>}
      </TabsContent>

      <TabsContent value="inbox" className="space-y-4">
        <InboxView />
      </TabsContent>
    </Tabs>
  );
}

// ── Director Dashboard ───────────────────────────────────────────
function DirectorDashboard({ inquiries, onContact, mobileTab, setMobileTab }: {
  inquiries: any; onContact: (t: { name: string; userId?: string; phone?: string; email?: string }) => void;
  mobileTab: string; setMobileTab: (v: string) => void;
}) {
  const [searchText, setSearchText] = useState("");
  const [filterDiscipline, setFilterDiscipline] = useState<string | undefined>(undefined);
  const [filterGender, setFilterGender] = useState<string | undefined>(undefined);
  const [selectedActor, setSelectedActor] = useState<any>(null);

  const actors = useQuery(api.actors.searchActors, {
    search: searchText || undefined,
    discipline: filterDiscipline,
    gender: filterGender,
  });

  return (
    <Tabs value={mobileTab} onValueChange={setMobileTab} className="space-y-6">
      <TabsList className="hidden sm:flex">
        <TabsTrigger value="search" className="gap-1.5"><Search className="size-3.5" /> Search</TabsTrigger>
        <TabsTrigger value="shortlists" className="gap-1.5"><Star className="size-3.5" /> Shortlists</TabsTrigger>
        <TabsTrigger value="inbox" className="gap-1.5"><MessageCircle className="size-3.5" /> Messages</TabsTrigger>
      </TabsList>

      <TabsContent value="search" className="space-y-4">
        <h2 className="text-lg font-extrabold">Discover Actors</h2>

        {/* Search bar */}
        <Card className="border-border/60"><CardContent className="p-4"><div className="flex gap-3">
          <Input placeholder="Search by name, skill, vocal range, city..." value={searchText} onChange={(e) => setSearchText(e.target.value)} className="flex-1" />
        </div></CardContent></Card>

        {/* Filters */}
        <div className="flex gap-2 flex-wrap">
          <Badge variant={filterDiscipline === undefined ? "default" : "outline"} className="cursor-pointer" onClick={() => setFilterDiscipline(undefined)}>All</Badge>
          <Badge variant={filterDiscipline === "film_tv" ? "default" : "outline"} className="cursor-pointer" onClick={() => setFilterDiscipline(filterDiscipline === "film_tv" ? undefined : "film_tv")}>Film & TV</Badge>
          <Badge variant={filterDiscipline === "theatre" ? "default" : "outline"} className="cursor-pointer" onClick={() => setFilterDiscipline(filterDiscipline === "theatre" ? undefined : "theatre")}>Theatre</Badge>
          <Badge variant={filterDiscipline === "both" ? "default" : "outline"} className="cursor-pointer" onClick={() => setFilterDiscipline(filterDiscipline === "both" ? undefined : "both")}>Both</Badge>
          <span className="w-px h-5 bg-border/60" />
          <Badge variant={filterGender === undefined ? "default" : "outline"} className="cursor-pointer" onClick={() => setFilterGender(undefined)}>Any Gender</Badge>
          <Badge variant={filterGender === "female" ? "default" : "outline"} className="cursor-pointer" onClick={() => setFilterGender(filterGender === "female" ? undefined : "female")}>Female</Badge>
          <Badge variant={filterGender === "male" ? "default" : "outline"} className="cursor-pointer" onClick={() => setFilterGender(filterGender === "male" ? undefined : "male")}>Male</Badge>
          <Badge variant={filterGender === "non_binary" ? "default" : "outline"} className="cursor-pointer" onClick={() => setFilterGender(filterGender === "non_binary" ? undefined : "non_binary")}>Non-binary</Badge>
        </div>

        {/* Results count */}
        <p className="text-xs text-muted-foreground">
          {actors === undefined ? "Loading..." : `${actors.length} actor${actors.length !== 1 ? "s" : ""} found`}
        </p>

        {/* Actor grid */}
        {actors && actors.length > 0 ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {actors.map((actor) => (
              <Card key={actor._id} className="cc-card-hover group overflow-hidden border-border/60 cursor-pointer" onClick={() => setSelectedActor(actor)}>
                {/* Headshot */}
                <div className="aspect-[3/4] overflow-hidden bg-muted relative">
                  {actor.headshotUrls && actor.headshotUrls.length > 0 ? (
                    <img src={actor.headshotUrls[0]} alt={actor.userName} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                  ) : (
                    <div className="flex items-center justify-center h-full">
                      <Avatar className="size-20"><AvatarFallback className="text-3xl bg-primary/10 text-primary">{(actor.userName ?? "?").charAt(0)}</AvatarFallback></Avatar>
                    </div>
                  )}
                  {/* Verification badge */}
                  {actor.verificationTier === "verified" && (
                    <div className="absolute top-2 right-2 rounded-full bg-emerald-500 px-2 py-0.5 text-[10px] text-white font-medium">✓ Verified</div>
                  )}
                  {/* Reel indicator */}
                  {actor.screenReelUrl && (
                    <div className="absolute top-2 left-2 rounded-full bg-black/60 px-2 py-0.5 text-[10px] text-white flex items-center gap-1"><Film className="size-3" /> Reel</div>
                  )}
                </div>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-semibold text-sm">{actor.stageName || actor.userName}</h3>
                      {actor.stageName && <p className="text-[10px] text-muted-foreground">{actor.userName}</p>}
                    </div>
                    <Badge variant="secondary" className="text-[10px] shrink-0">
                      {actor.primaryDiscipline === "film_tv" ? "Film/TV" : actor.primaryDiscipline === "theatre" ? "Theatre" : "Both"}
                    </Badge>
                  </div>
                  <div className="mt-2 flex flex-wrap gap-1">
                    {actor.city && <span className="text-[10px] text-muted-foreground">📍 {actor.city}</span>}
                    {actor.gender && <span className="text-[10px] text-muted-foreground capitalize">{actor.gender.replace("_", " ")}</span>}
                    {actor.height && <span className="text-[10px] text-muted-foreground">{actor.height}</span>}
                  </div>
                  {/* Top skills */}
                  <div className="mt-2 flex flex-wrap gap-1">
                    {[...(actor.screenSkills ?? []).slice(0, 2), ...(actor.theatreSkills ?? []).slice(0, 2)].slice(0, 3).map((s) => (
                      <Badge key={s} variant="outline" className="text-[9px] px-1.5 py-0">{s}</Badge>
                    ))}
                  </div>
                  {/* Quick stats */}
                  <div className="mt-2 flex items-center gap-3 text-[10px] text-muted-foreground">
                    {actor.monologueUrls && actor.monologueUrls.length > 0 && <span>🎭 {actor.monologueUrls.length} monologues</span>}
                    {actor.voiceSampleUrls && actor.voiceSampleUrls.length > 0 && <span>🎤 {actor.voiceSampleUrls.length} voice samples</span>}
                    {actor.screenCredits && actor.screenCredits.length > 0 && <span>🎬 {actor.screenCredits.length} screen credits</span>}
                    {actor.theatreCredits && actor.theatreCredits.length > 0 && <span>🎭 {actor.theatreCredits.length} stage credits</span>}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : actors && actors.length === 0 ? (
          <Card className="border-dashed border-2 border-border/60"><CardContent className="p-12 text-center">
            <Search className="mx-auto size-10 text-muted-foreground/50 mb-3" />
            <p className="text-sm text-muted-foreground">No actors found. Try adjusting your filters.</p>
          </CardContent></Card>
        ) : (
          <Card className="border-dashed border-2 border-border/60"><CardContent className="p-12 text-center">
            <div className="size-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">Loading actors...</p>
          </CardContent></Card>
        )}
      </TabsContent>

      <TabsContent value="shortlists" className="space-y-4"><ShortlistPanel /></TabsContent>
      <TabsContent value="inbox" className="space-y-4">
        <InboxView />
      </TabsContent>

      {/* Actor detail overlay */}
      {selectedActor && (
        <ActorDetailOverlay actor={selectedActor} onClose={() => setSelectedActor(null)} onContact={onContact} />
      )}
    </Tabs>
  );
}

// ── Actor Detail Overlay (Director view) ────────────────────────
function ActorDetailOverlay({ actor, onClose, onContact }: { actor: any; onClose: () => void; onContact: (t: { name: string; userId?: string; phone?: string; email?: string }) => void }) {
  const [activeVideo, setActiveVideo] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"overview" | "media" | "credits">("overview");

  return (
    <div className="fixed inset-0 z-50 bg-background overflow-y-auto">
      <header className="sticky top-0 z-10 border-b border-border/50 bg-background/95 backdrop-blur-xl">
        <div className="mx-auto flex h-14 max-w-4xl items-center justify-between px-4">
          <Button variant="ghost" size="sm" onClick={onClose} className="gap-1.5"><ChevronLeft className="size-4" /> Back</Button>
          <h1 className="font-extrabold text-sm truncate max-w-[200px]">{actor.stageName || actor.userName}</h1>
          <div className="w-20" />
        </div>
      </header>

      <div className="mx-auto max-w-4xl px-4 py-6 space-y-6">
        {/* Hero section */}
        <div className="grid gap-6 sm:grid-cols-[280px_1fr]">
          {/* Headshot gallery */}
          <div className="space-y-2">
            {actor.headshotUrls && actor.headshotUrls.length > 0 ? (
              <div className="aspect-[3/4] rounded-2xl overflow-hidden bg-muted">
                <img src={actor.headshotUrls[0]} alt={actor.userName} className="w-full h-full object-cover" />
              </div>
            ) : (
              <div className="aspect-[3/4] rounded-2xl overflow-hidden bg-muted flex items-center justify-center">
                <Avatar className="size-24"><AvatarFallback className="text-4xl bg-primary/10 text-primary">{(actor.userName ?? "?").charAt(0)}</AvatarFallback></Avatar>
              </div>
            )}
            {/* Thumbnail strip */}
            {actor.headshotUrls && actor.headshotUrls.length > 1 && (
              <div className="flex gap-2 overflow-x-auto">
                {actor.headshotUrls.map((url: string, i: number) => (
                  <img key={i} src={url} className="size-16 rounded-lg object-cover shrink-0 border border-border/40" alt={`Headshot ${i + 1}`} />
                ))}
              </div>
            )}
          </div>

          {/* Info */}
          <div className="space-y-4">
            <div>
              <h2 className="text-2xl font-extrabold">{actor.stageName || actor.userName}</h2>
              {actor.stageName && <p className="text-sm text-muted-foreground">{actor.userName}</p>}
              <div className="flex items-center gap-2 mt-2">
                <Badge variant="secondary">{actor.primaryDiscipline === "film_tv" ? "Film/TV" : actor.primaryDiscipline === "theatre" ? "Theatre" : "Both"}</Badge>
                {actor.verificationTier === "verified" && <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20">✓ Verified</Badge>}
              </div>
            </div>

            {/* Quick stats */}
            <div className="grid grid-cols-2 gap-3 text-sm">
              {actor.city && <div><span className="text-muted-foreground">City:</span> {actor.city}</div>}
              {actor.gender && <div><span className="text-muted-foreground">Gender:</span> <span className="capitalize">{actor.gender.replace("_", " ")}</span></div>}
              {actor.height && <div><span className="text-muted-foreground">Height:</span> {actor.height}</div>}
              {actor.ethnicity && <div><span className="text-muted-foreground">Ethnicity:</span> {actor.ethnicity}</div>}
              {actor.eyeColor && <div><span className="text-muted-foreground">Eyes:</span> {actor.eyeColor}</div>}
              {actor.hairColor && <div><span className="text-muted-foreground">Hair:</span> {actor.hairColor}</div>}
              {actor.vocalRange && <div><span className="text-muted-foreground">Vocal Range:</span> {actor.vocalRange}</div>}
              {actor.classicalTrainingLevel && <div><span className="text-muted-foreground">Training:</span> {actor.classicalTrainingLevel}</div>}
            </div>

            {/* Skills */}
            <div>
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">Skills</p>
              <div className="flex flex-wrap gap-1.5">
                {[...(actor.screenSkills ?? []), ...(actor.theatreSkills ?? [])].map((s: string) => (
                  <Badge key={s} variant="outline" className="text-[11px]">{s}</Badge>
                ))}
                {actor.danceStyles?.map((s: string) => <Badge key={s} variant="outline" className="text-[11px]">{s}</Badge>)}
                {actor.stageCombatCertification?.map((s: string) => <Badge key={s} variant="outline" className="text-[11px]">{s}</Badge>)}
              </div>
            </div>

            {/* Contact buttons */}
            <div className="flex gap-2">
              <Button className="rounded-xl gap-1.5" onClick={() => onContact({ name: actor.stageName || actor.userName, userId: actor.userId, phone: actor.phone, email: actor.email })}>
                <MessageCircle className="size-4" /> Contact Actor
              </Button>
              <ShortlistButton targetUserId={actor.userId} targetName={actor.stageName || actor.userName} />
            </div>
          </div>
        </div>

        {/* Tabbed content */}
        <div className="flex gap-2 border-b border-border/40">
          {(["overview", "media", "credits"] as const).map((tab) => (
            <button key={tab} onClick={() => setActiveTab(tab)} className={`px-4 py-2 text-sm font-medium capitalize border-b-2 transition-colors ${activeTab === tab ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"}`}>{tab}</button>
          ))}
        </div>

        {activeTab === "overview" && (
          <div className="space-y-4">
            {actor.distinguishingFeatures && (
              <Card className="border-border/60"><CardContent className="p-4">
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1">Distinguishing Features</p>
                <p className="text-sm">{actor.distinguishingFeatures}</p>
              </CardContent></Card>
            )}
            <div className="grid grid-cols-2 gap-3">
              {actor.willingToTravel && <div className="text-sm"><span className="text-muted-foreground">Willing to travel:</span> <span className="capitalize">{actor.willingToTravel}</span></div>}
              {actor.remoteWorkCapable !== undefined && <div className="text-sm"><span className="text-muted-foreground">Remote work:</span> {actor.remoteWorkCapable ? "Yes" : "No"}</div>}
              {actor.openToUnpaid !== undefined && <div className="text-sm"><span className="text-muted-foreground">Open to unpaid:</span> {actor.openToUnpaid ? "Yes" : "No"}</div>}
              {actor.openToFringe !== undefined && <div className="text-sm"><span className="text-muted-foreground">Open to fringe:</span> {actor.openToFringe ? "Yes" : "No"}</div>}
              {actor.unionStatus && actor.unionStatus.length > 0 && <div className="text-sm"><span className="text-muted-foreground">Unions:</span> {actor.unionStatus.join(", ")}</div>}
              {actor.agentContact && <div className="text-sm"><span className="text-muted-foreground">Agent:</span> {actor.agentContact}</div>}
            </div>
          </div>
        )}

        {activeTab === "media" && (
          <div className="space-y-6">
            {/* Screen reel */}
            {actor.screenReelUrl && (
              <div>
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">Screen Reel</p>
                <div className="relative rounded-2xl overflow-hidden bg-black aspect-video">
                  <video src={actor.screenReelUrl} controls className="w-full h-full" />
                </div>
              </div>
            )}

            {/* Monologues */}
            {actor.monologueUrls && actor.monologueUrls.length > 0 && (
              <div>
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">Monologues</p>
                <div className="grid gap-4 sm:grid-cols-2">
                  {actor.monologueUrls.map((url: string, i: number) => (
                    <div key={i} className="rounded-xl overflow-hidden bg-black aspect-video">
                      <video src={url} controls className="w-full h-full" preload="metadata" />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Voice samples */}
            {actor.voiceSampleUrls && actor.voiceSampleUrls.length > 0 && (
              <div>
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">Voice Samples</p>
                <div className="space-y-2">
                  {actor.voiceSampleUrls.map((url: string, i: number) => (
                    <div key={i} className="rounded-xl border border-border/40 bg-muted/20 p-3">
                      <p className="text-xs text-muted-foreground mb-2">Voice Sample {i + 1}</p>
                      <audio src={url} controls className="w-full h-10" />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {!actor.screenReelUrl && (!actor.monologueUrls || actor.monologueUrls.length === 0) && (!actor.voiceSampleUrls || actor.voiceSampleUrls.length === 0) && (
              <Card className="border-dashed border-2 border-border/60"><CardContent className="p-8 text-center">
                <Film className="mx-auto size-10 text-muted-foreground/50 mb-3" />
                <p className="text-sm text-muted-foreground">No media uploaded yet.</p>
              </CardContent></Card>
            )}
          </div>
        )}

        {activeTab === "credits" && (
          <div className="space-y-6">
            {actor.screenCredits && actor.screenCredits.length > 0 && (
              <div>
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">Screen Credits</p>
                <div className="space-y-2">
                  {actor.screenCredits.map((c: any, i: number) => (
                    <div key={i} className="flex items-center gap-3 rounded-lg bg-muted/20 px-3 py-2">
                      <Film className="size-4 text-muted-foreground shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium">{c.projectName}</p>
                        <p className="text-[10px] text-muted-foreground">{c.role} · {c.platform} · {c.year}{c.director ? ` · Dir. ${c.director}` : ""}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {actor.theatreCredits && actor.theatreCredits.length > 0 && (
              <div>
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">Theatre Credits</p>
                <div className="space-y-2">
                  {actor.theatreCredits.map((c: any, i: number) => (
                    <div key={i} className="flex items-center gap-3 rounded-lg bg-muted/20 px-3 py-2">
                      <Theater className="size-4 text-muted-foreground shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium">{c.productionName}</p>
                        <p className="text-[10px] text-muted-foreground">{c.role} · {c.venue} · {c.company}{c.director ? ` · Dir. ${c.director}` : ""}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {(!actor.screenCredits || actor.screenCredits.length === 0) && (!actor.theatreCredits || actor.theatreCredits.length === 0) && (
              <Card className="border-dashed border-2 border-border/60"><CardContent className="p-8 text-center">
                <FileText className="mx-auto size-10 text-muted-foreground/50 mb-3" />
                <p className="text-sm text-muted-foreground">No credits added yet.</p>
              </CardContent></Card>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Theatre Maker Dashboard ──────────────────────────────────────
function TheatreMakerDashboard({ projects, inquiries, profile, onSelectProject, mobileTab, setMobileTab, onContact }: {
  projects: any[] | undefined; inquiries: any; profile: any;
  onSelectProject: (id: string) => void;
  mobileTab: string; setMobileTab: (v: string) => void;
  onContact: (t: { name: string; userId?: string; phone?: string; email?: string }) => void;
}) {
  return (
    <Tabs value={mobileTab} onValueChange={setMobileTab} className="space-y-6">
      <TabsList className="hidden sm:flex">
        <TabsTrigger value="overview" className="gap-1.5"><TrendingUp className="size-3.5" /> Overview</TabsTrigger>
        <TabsTrigger value="search" className="gap-1.5"><Search className="size-3.5" /> Discover</TabsTrigger>
        <TabsTrigger value="projects" className="gap-1.5"><Theater className="size-3.5" /> Productions</TabsTrigger>
        <TabsTrigger value="create" className="gap-1.5"><Plus className="size-3.5" /> Create</TabsTrigger>
        <TabsTrigger value="applications" className="gap-1.5"><FileText className="size-3.5" /> Applications</TabsTrigger>
        <TabsTrigger value="shortlists" className="gap-1.5"><Star className="size-3.5" /> Lists</TabsTrigger>
        <TabsTrigger value="inbox" className="gap-1.5"><MessageCircle className="size-3.5" /> Inbox</TabsTrigger>
      </TabsList>

      <TabsContent value="overview"><TmOverview projects={projects} inquiries={inquiries} /></TabsContent>
      <TabsContent value="search"><TmSearch onContact={onContact} /></TabsContent>
      <TabsContent value="projects"><TmProductions projects={projects} onSelectProject={onSelectProject} /></TabsContent>
      <TabsContent value="create"><TmCreate /></TabsContent>
      <TabsContent value="applications"><TmApplications projects={projects} /></TabsContent>
      <TabsContent value="shortlists"><ShortlistPanel /></TabsContent>
      <TabsContent value="inbox"><InboxView /></TabsContent>
    </Tabs>
  );
}

function TmOverview({ projects, inquiries }: { projects: any[] | undefined; inquiries: any }) {
  const stats = useQuery(api.projects.getProductionStats);
  const openCount = projects?.filter((p: any) => p.status === "open").length ?? 0;
  const draftCount = projects?.filter((p: any) => p.status === "draft").length ?? 0;

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: "Total Productions", value: stats?.totalProjects ?? 0, icon: Theater, color: "text-primary" },
          { label: "Active Listings", value: stats?.openProjects ?? 0, icon: Briefcase, color: "text-accent" },
          { label: "Applications Received", value: stats?.totalApplications ?? 0, icon: Users, color: "text-chart-3" },
          { label: "Open Roles", value: stats?.totalRoles ?? 0, icon: Star, color: "text-chart-4" },
        ].map((s) => (
          <Card key={s.label} className="border-border/60"><CardContent className="p-4 flex items-center justify-between">
            <div><p className="text-xs text-muted-foreground">{s.label}</p><p className="text-2xl font-extrabold mt-1">{s.value}</p></div>
            <div className={`flex size-10 items-center justify-center rounded-xl bg-muted/50 ${s.color}`}><s.icon className="size-5" /></div>
          </CardContent></Card>
        ))}
      </div>

      {/* Quick summary */}
      <div className="grid gap-4 sm:grid-cols-2">
        <Card className="border-border/60"><CardContent className="p-5">
          <h3 className="font-bold text-sm mb-3">Production Status</h3>
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm"><span className="text-muted-foreground">Drafts</span><Badge variant="outline">{draftCount}</Badge></div>
            <div className="flex items-center justify-between text-sm"><span className="text-muted-foreground">Open for applications</span><Badge>{openCount}</Badge></div>
            <div className="flex items-center justify-between text-sm"><span className="text-muted-foreground">Total productions</span><Badge variant="secondary">{projects?.length ?? 0}</Badge></div>
          </div>
        </CardContent></Card>
        <Card className="border-border/60"><CardContent className="p-5">
          <h3 className="font-bold text-sm mb-3">Recent Activity</h3>
          {inquiries?.received && inquiries.received.length > 0 ? (
            <div className="space-y-2">
              {inquiries.received.slice(0, 4).map((inq: any) => (
                <div key={inq._id} className="flex items-center gap-2 text-sm">
                  <MessageCircle className="size-3.5 text-muted-foreground shrink-0" />
                  <span className="truncate"><span className="font-medium">{inq.senderName ?? "Someone"}</span> messaged you</span>
                  <span className="text-[10px] text-muted-foreground shrink-0">{new Date(inq.createdAt).toLocaleDateString()}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No recent activity yet.</p>
          )}
        </CardContent></Card>
      </div>
    </div>
  );
}

function TmSearch({ onContact }: { onContact: (t: { name: string; userId?: string; phone?: string; email?: string }) => void }) {
  const [searchText, setSearchText] = useState("");
  const [filterDiscipline, setFilterDiscipline] = useState<string | undefined>(undefined);
  const [filterGender, setFilterGender] = useState<string | undefined>(undefined);
  const [selectedActor, setSelectedActor] = useState<any>(null);

  const actors = useQuery(api.actors.searchActors, {
    search: searchText || undefined,
    discipline: filterDiscipline,
    gender: filterGender,
  });

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-extrabold">Discover Actors</h2>
      <Card className="border-border/60"><CardContent className="p-4"><div className="flex gap-3">
        <Input placeholder="Search by name, skill, vocal range, city..." value={searchText} onChange={(e) => setSearchText(e.target.value)} className="flex-1" />
      </div></CardContent></Card>
      <div className="flex gap-2 flex-wrap">
        <Badge variant={filterDiscipline === undefined ? "default" : "outline"} className="cursor-pointer" onClick={() => setFilterDiscipline(undefined)}>All</Badge>
        <Badge variant={filterDiscipline === "film_tv" ? "default" : "outline"} className="cursor-pointer" onClick={() => setFilterDiscipline(filterDiscipline === "film_tv" ? undefined : "film_tv")}>Film & TV</Badge>
        <Badge variant={filterDiscipline === "theatre" ? "default" : "outline"} className="cursor-pointer" onClick={() => setFilterDiscipline(filterDiscipline === "theatre" ? undefined : "theatre")}>Theatre</Badge>
        <Badge variant={filterDiscipline === "both" ? "default" : "outline"} className="cursor-pointer" onClick={() => setFilterDiscipline(filterDiscipline === "both" ? undefined : "both")}>Both</Badge>
        <span className="w-px h-5 bg-border/60" />
        <Badge variant={filterGender === undefined ? "default" : "outline"} className="cursor-pointer" onClick={() => setFilterGender(undefined)}>Any</Badge>
        <Badge variant={filterGender === "female" ? "default" : "outline"} className="cursor-pointer" onClick={() => setFilterGender(filterGender === "female" ? undefined : "female")}>Female</Badge>
        <Badge variant={filterGender === "male" ? "default" : "outline"} className="cursor-pointer" onClick={() => setFilterGender(filterGender === "male" ? undefined : "male")}>Male</Badge>
        <Badge variant={filterGender === "non_binary" ? "default" : "outline"} className="cursor-pointer" onClick={() => setFilterGender(filterGender === "non_binary" ? undefined : "non_binary")}>Non-binary</Badge>
      </div>
      <p className="text-xs text-muted-foreground">
        {actors === undefined ? "Loading..." : `${actors.length} actor${actors.length !== 1 ? "s" : ""} found`}
      </p>
      {actors && actors.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {actors.map((actor) => (
            <Card key={actor._id} className="cc-card-hover group overflow-hidden border-border/60 cursor-pointer" onClick={() => setSelectedActor(actor)}>
              <div className="aspect-[3/4] overflow-hidden bg-muted relative">
                {actor.headshotUrls && actor.headshotUrls.length > 0 ? (
                  <img src={actor.headshotUrls[0]} alt={actor.userName} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <Avatar className="size-20"><AvatarFallback className="text-3xl bg-primary/10 text-primary">{(actor.userName ?? "?").charAt(0)}</AvatarFallback></Avatar>
                  </div>
                )}
                {actor.verificationTier === "verified" && (
                  <div className="absolute top-2 right-2 rounded-full bg-emerald-500 px-2 py-0.5 text-[10px] text-white font-medium">✓ Verified</div>
                )}
              </div>
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-semibold text-sm">{actor.stageName || actor.userName}</h3>
                    {actor.stageName && <p className="text-[10px] text-muted-foreground">{actor.userName}</p>}
                  </div>
                  <Badge variant="secondary" className="text-[10px] shrink-0">
                    {actor.primaryDiscipline === "film_tv" ? "Film/TV" : actor.primaryDiscipline === "theatre" ? "Theatre" : "Both"}
                  </Badge>
                </div>
                <div className="mt-2 flex flex-wrap gap-1">
                  {actor.city && <span className="text-[10px] text-muted-foreground">📍 {actor.city}</span>}
                  {actor.gender && <span className="text-[10px] text-muted-foreground capitalize">{actor.gender.replace("_", " ")}</span>}
                  {actor.height && <span className="text-[10px] text-muted-foreground">{actor.height}</span>}
                </div>
                <div className="mt-2 flex flex-wrap gap-1">
                  {[...(actor.screenSkills ?? []).slice(0, 2), ...(actor.theatreSkills ?? []).slice(0, 2)].slice(0, 3).map((s) => (
                    <Badge key={s} variant="outline" className="text-[9px] px-1.5 py-0">{s}</Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : actors && actors.length === 0 ? (
        <Card className="border-dashed border-2 border-border/60"><CardContent className="p-12 text-center">
          <Search className="mx-auto size-10 text-muted-foreground/50 mb-3" />
          <p className="text-sm text-muted-foreground">No actors found. Try adjusting your filters.</p>
        </CardContent></Card>
      ) : (
        <Card className="border-dashed border-2 border-border/60"><CardContent className="p-12 text-center">
          <div className="size-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">Loading actors...</p>
        </CardContent></Card>
      )}
      {selectedActor && (
        <ActorDetailOverlay actor={selectedActor} onClose={() => setSelectedActor(null)} onContact={onContact} />
      )}
    </div>
  );
}

function TmProductions({ projects, onSelectProject }: { projects: any[] | undefined; onSelectProject: (id: string) => void }) {
  return (
    <div className="space-y-4">
      <h2 className="text-lg font-extrabold">My Productions</h2>
      {projects && projects.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {projects.map((p) => (
            <ProjectCard key={p._id} title={p.title} projectType={p.projectType} venueCity={p.venueCity} compensationType={p.compensationType} status={p.status} creatorName={p.creatorName}
              imageUrl={p.resolvedImageUrl ?? p.imageUrl} videoUrls={p.videoUrls ?? []}
              onView={() => onSelectProject(p._id)} />
          ))}
        </div>
      ) : (
        <Card className="border-dashed border-2 border-border/60"><CardContent className="p-12 text-center">
          <Theater className="mx-auto size-10 text-muted-foreground/50 mb-3" />
          <p className="text-sm text-muted-foreground mb-1">No productions yet.</p>
          <p className="text-xs text-muted-foreground/60">Create your first production to start assembling your team.</p>
        </CardContent></Card>
      )}
    </div>
  );
}

function TmCreate() {
  const [title, setTitle] = useState("");
  const [playwright, setPlaywright] = useState("");
  const [synopsis, setSynopsis] = useState("");
  const [projectType, setProjectType] = useState("mainstage");
  const [venueName, setVenueName] = useState("");
  const [venueCity, setVenueCity] = useState("");
  const [compensationType, setCompensationType] = useState("equity_showcase");
  const [rehearsalStart, setRehearsalStart] = useState("");
  const [firstPreview, setFirstPreview] = useState("");
  const [closingDate, setClosingDate] = useState("");
  const [submissionDeadline, setSubmissionDeadline] = useState("");
  const [rolesNeeded, setRolesNeeded] = useState<string[]>(["Actor"]);
  const [creating, setCreating] = useState(false);
  const createProject = useMutation(api.projects.createProject);
  const publishProject = useMutation(api.projects.publishProject);

  const CREATIVE_ROLES = ["Director", "Stage Manager", "Set Designer", "Costume Designer", "Lighting Designer", "Sound Designer", "Composer", "Choreographer", "Dramaturg", "Intimacy Coordinator"];

  const handleCreate = async () => {
    if (!title.trim()) return;
    setCreating(true);
    try {
      const roles = rolesNeeded.map((r) => ({ roleName: r, roleType: (r === "Actor" ? "actor" : "creative_team") as "actor" | "creative_team" }));
      const projectId = await createProject({
        title, playwright: playwright || undefined, synopsis, projectType: projectType as any,
        venueName, venueCity, compensationType: compensationType as any,
        rehearsalStart: rehearsalStart || undefined, firstPreview: firstPreview || undefined,
        closingDate: closingDate || undefined, submissionDeadline: submissionDeadline || undefined,
        roles,
      });
      await publishProject({ projectId });
      setTitle(""); setPlaywright(""); setSynopsis(""); setVenueName(""); setVenueCity("");
      setRehearsalStart(""); setFirstPreview(""); setClosingDate(""); setSubmissionDeadline("");
      setRolesNeeded(["Actor"]);
    } catch {}
    setCreating(false);
  };

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-extrabold">Create New Project</h2>
      <Card className="border-border/60"><CardContent className="p-6 space-y-5">
        {/* Title & Playwright */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2"><label className="text-sm font-bold">Project Title *</label><Input placeholder="e.g. Hamlet — Mainstage Production" value={title} onChange={(e) => setTitle(e.target.value)} /></div>
          <div className="space-y-2"><label className="text-sm font-bold">Playwright</label><Input placeholder="e.g. William Shakespeare" value={playwright} onChange={(e) => setPlaywright(e.target.value)} /></div>
        </div>

        {/* Type & Compensation */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2"><label className="text-sm font-bold">Project Type</label>
            <select className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={projectType} onChange={(e) => setProjectType(e.target.value)}>
              <option value="reading">Reading</option><option value="workshop">Workshop</option><option value="fringe_production">Fringe</option><option value="mainstage">Mainstage</option><option value="touring">Touring</option><option value="developmental">Developmental</option><option value="concert_staged_reading">Concert / Staged Reading</option><option value="film">Film</option><option value="tv">TV</option><option value="short_film">Short Film</option>
            </select>
          </div>
          <div className="space-y-2"><label className="text-sm font-bold">Compensation</label>
            <select className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={compensationType} onChange={(e) => setCompensationType(e.target.value)}>
              <option value="equity_showcase">Equity Showcase</option><option value="lort">LORT</option><option value="stipend">Stipend</option><option value="profit_share">Profit-Share</option><option value="paid">Paid</option><option value="unpaid">Unpaid</option><option value="deferred">Deferred</option>
            </select>
          </div>
        </div>

        {/* Synopsis */}
        <div className="space-y-2"><label className="text-sm font-bold">Synopsis</label><Textarea rows={3} placeholder="Brief synopsis, logline, or description of the production..." value={synopsis} onChange={(e) => setSynopsis(e.target.value)} /></div>

        {/* Venue */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2"><label className="text-sm font-bold">Venue</label><Input placeholder="Theatre name" value={venueName} onChange={(e) => setVenueName(e.target.value)} /></div>
          <div className="space-y-2"><label className="text-sm font-bold">City</label><Input placeholder="New York" value={venueCity} onChange={(e) => setVenueCity(e.target.value)} /></div>
        </div>

        {/* Dates */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="space-y-2"><label className="text-sm font-bold">Rehearsals Start</label><Input type="date" value={rehearsalStart} onChange={(e) => setRehearsalStart(e.target.value)} /></div>
          <div className="space-y-2"><label className="text-sm font-bold">First Preview</label><Input type="date" value={firstPreview} onChange={(e) => setFirstPreview(e.target.value)} /></div>
          <div className="space-y-2"><label className="text-sm font-bold">Closing Date</label><Input type="date" value={closingDate} onChange={(e) => setClosingDate(e.target.value)} /></div>
        </div>
        <div className="space-y-2"><label className="text-sm font-bold">Application Deadline</label><Input type="date" value={submissionDeadline} onChange={(e) => setSubmissionDeadline(e.target.value)} /></div>

        {/* Roles */}
        <div className="space-y-2">
          <label className="text-sm font-bold">Roles Needed</label>
          <div className="flex flex-wrap gap-1.5">
            {["Actor", ...CREATIVE_ROLES].map((r) => (
              <Badge key={r} variant={rolesNeeded.includes(r) ? "default" : "outline"} className="cursor-pointer text-[11px]" onClick={() => {
                setRolesNeeded((p) => p.includes(r) ? p.filter((x) => x !== r) : [...p, r]);
              }}>{r}</Badge>
            ))}
          </div>
        </div>

        <Button className="w-full rounded-xl" onClick={handleCreate} disabled={creating || !title.trim()}>
          {creating ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Publishing...</> : "Publish Project"}
        </Button>
      </CardContent></Card>
    </div>
  );
}

function TmApplications({ projects }: { projects: any[] | undefined }) {
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const applications = useQuery(
    api.projects.getApplicationsForProject,
    selectedProjectId ? { projectId: selectedProjectId as any } : "skip"
  );
  const updateStatus = useMutation(api.projects.updateApplicationStatus);

  const selectedProject = projects?.find((p: any) => p._id === selectedProjectId);

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-extrabold">Applications</h2>

      {/* Project selector */}
      <div className="flex gap-2 flex-wrap">
        {projects && projects.length > 0 ? projects.map((p: any) => (
          <Badge
            key={p._id}
            variant={selectedProjectId === p._id ? "default" : "outline"}
            className="cursor-pointer"
            onClick={() => setSelectedProjectId(p._id)}
          >{p.title}</Badge>
        )) : (
          <p className="text-sm text-muted-foreground">No productions yet. Create one to start receiving applications.</p>
        )}
      </div>

      {/* Applications list */}
      {selectedProjectId && (
        <div className="space-y-3">
          <p className="text-xs text-muted-foreground">
            {applications === undefined ? "Loading..." : `${applications.length} application${applications.length !== 1 ? "s" : ""} for ${selectedProject?.title ?? "this project"}`}
          </p>
          {applications && applications.length > 0 ? (
            applications.map((app: any) => (
              <Card key={app._id} className="border-border/60">
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    {/* Headshot */}
                    <Avatar className="size-12 shrink-0">
                      {app.headshotUrls?.[0] ? (
                        <img src={app.headshotUrls[0]} alt="" className="w-full h-full object-cover rounded-full" />
                      ) : (
                        <AvatarFallback className="bg-primary/10 text-primary text-sm font-semibold">
                          {(app.actorName ?? "?").charAt(0)}
                        </AvatarFallback>
                      )}
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-bold">{app.stageName || app.actorName}</p>
                          {app.stageName && <p className="text-[10px] text-muted-foreground">{app.actorName}</p>}
                        </div>
                        <Badge variant={
                          app.status === "booked" ? "default" :
                          app.status === "audition_offered" ? "default" :
                          app.status === "released" ? "destructive" : "secondary"
                        } className="text-[10px] shrink-0">
                          {app.status === "applied" ? "New" : app.status?.replace("_", " ")}
                        </Badge>
                      </div>
                      <div className="mt-1 flex items-center gap-2 text-[10px] text-muted-foreground">
                        {app.roleName && <span>Role: {app.roleName}</span>}
                        {app.city && <span>📍 {app.city}</span>}
                        {app.appliedAt && <span>{new Date(app.appliedAt).toLocaleDateString()}</span>}
                      </div>
                      {app.skills && app.skills.length > 0 && (
                        <div className="mt-1.5 flex flex-wrap gap-1">
                          {app.skills.slice(0, 4).map((s: string) => (
                            <Badge key={s} variant="outline" className="text-[9px] px-1.5 py-0">{s}</Badge>
                          ))}
                        </div>
                      )}
                      {app.message && (
                        <p className="mt-2 text-xs text-muted-foreground italic">&ldquo;{app.message}&rdquo;</p>
                      )}
                      {/* Action buttons */}
                      <div className="mt-2 flex gap-2">
                        <Button size="sm" variant="outline" className="text-[10px] h-7 rounded-lg" onClick={() => updateStatus({ applicationId: app._id, status: "under_review" })}>
                          Review
                        </Button>
                        <Button size="sm" variant="outline" className="text-[10px] h-7 rounded-lg" onClick={() => updateStatus({ applicationId: app._id, status: "audition_offered" })}>
                          Offer Audition
                        </Button>
                        <Button size="sm" className="text-[10px] h-7 rounded-lg" onClick={() => updateStatus({ applicationId: app._id, status: "booked" })}>
                          Book
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <Card className="border-dashed border-2 border-border/60"><CardContent className="p-8 text-center">
              <Users className="mx-auto size-10 text-muted-foreground/50 mb-3" />
              <p className="text-sm text-muted-foreground">No applications yet for this production.</p>
            </CardContent></Card>
          )}
        </div>
      )}
    </div>
  );
}
