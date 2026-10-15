import { useState, useEffect } from "react";
import { useConvex, useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { motion } from "framer-motion";
import {
  Search,
  Users,
  Theater,
  Clapperboard,
  Star,
  MessageCircle,
  ArrowRight,
  CheckCircle2,
  Sparkles,
  Shield,
  Palette,
  Mail,
  Loader2,
  Phone,
  MapPin,
  Camera,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/use-auth";
import { PasswordField } from "@/components/PasswordField";
import { MIN_PASSWORD_LENGTH, passwordProblem } from "@/lib/password";

const fadeUp = {
  initial: { opacity: 0, y: 24 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] },
};

const stagger = {
  animate: { transition: { staggerChildren: 0.1 } },
};

const personas = [
  {
    id: "actor" as const,
    icon: Users,
    title: "Actors",
    subtitle: "Your stage, your screen",
    desc: "Build rich profiles with headshots, reels, monologues, voice samples, and theatre credits. Get discovered for both screen and stage work.",
    color: "text-primary",
    bg: "bg-primary/10",
    borderColor: "border-primary/30",
    bullets: ["Film/TV + Theatre profiles", "Monologue library", "Application tracker", "Quick Apply to projects"],
  },
  {
    id: "director" as const,
    icon: Clapperboard,
    title: "Directors",
    subtitle: "Find your cast",
    desc: "Search actors with advanced filters, save shortlists, request self-tapes, and contact talent via WhatsApp or Gmail.",
    color: "text-accent",
    bg: "bg-accent/10",
    borderColor: "border-accent/30",
    bullets: ["Advanced talent search", "Project-based shortlists", "Self-tape requests", "Trackable outreach"],
  },
  {
    id: "theatre_maker" as const,
    icon: Palette,
    title: "Theatre Makers",
    subtitle: "Build productions",
    desc: "Post productions, assemble creative teams, manage casting breakdowns, and discover collaborators across every discipline.",
    color: "text-chart-3",
    bg: "bg-chart-3/10",
    borderColor: "border-chart-3/30",
    bullets: ["Multi-role project posting", "Casting breakdown builder", "Designer & SM search", "Company ensemble pages"],
  },
];

const features = [
  { icon: Search, title: "Discover Talent", desc: "Search actors by vocal range, stage combat certs, classical training, and 50+ theatre-specific filters." },
  { icon: Theater, title: "Post Productions", desc: "Post readings, workshops, fringe, mainstage, and touring productions with full casting breakdowns." },
  { icon: Users, title: "Assemble Teams", desc: "From playwrights to designers, stage managers to choreographers — build your entire creative team." },
  { icon: MessageCircle, title: "Connect Directly", desc: "Contact via WhatsApp or Gmail with pre-filled, trackable templates. No more lost emails." },
  { icon: Star, title: "Shortlist & Track", desc: "Organize talent by project, track applications from audition to booking, and manage your pipeline." },
  { icon: Shield, title: "Verified & Safe", desc: "Tiered trust system with verified theatre company emails, known credits, and admin approval." },
];

const stats = [
  { value: "50+", label: "Theatre-specific filters" },
  { value: "12", label: "Creative disciplines" },
  { value: "7", label: "Application stages" },
  { value: "3", label: "Contact channels" },
];

const SKILL_OPTIONS = [
  "On-Camera Acting", "Commercial", "Motion Capture", "Green Screen",
  "Improv", "Stunts", "Classical Text", "Stage Combat",
  "Musical Theatre", "Puppetry", "Devised Theatre", "Immersive Theatre",
  "Dialects & Accents", "Live Singing", "Voiceover", "Self-Tape",
];

type PersonaId = "actor" | "director" | "theatre_maker";

export default function Landing({ onGetStarted }: { onGetStarted?: () => void }) {
  const { isAuthenticated, user, signIn, signOut } = useAuth();
  const convex = useConvex();
  const [authStep, setAuthStep] = useState<"persona" | "email" | "signingIn" | "reset" | "resetVerify" | "profile" | "done">("persona");
  const [selectedPersona, setSelectedPersona] = useState<PersonaId | null>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [resetCode, setResetCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Profile creation state
  const [profileName, setProfileName] = useState("");
  const [profilePhone, setProfilePhone] = useState("");
  const [profileCity, setProfileCity] = useState("");
  const [profileBio, setProfileBio] = useState("");
  const [profileSkills, setProfileSkills] = useState<string[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  const upsertProfile = useMutation(api.actors.upsertProfile);
  const updateProfile = useMutation(api.users.updateProfile);
  const markOnboarding = useMutation(api.users.markOnboardingComplete);
  const updateRole = useMutation(api.users.updateRole);
  const existingUser = useQuery(
    api.users.getUserByEmail,
    email && email.includes("@") ? { email } : "skip"
  );

  // Returning user: if authenticated with a role, go to dashboard
  useEffect(() => {
    if (isAuthenticated && user?.role && authStep !== "profile") {
      onGetStarted?.();
    }
  }, [isAuthenticated, user?.role, authStep]);

  // After profile creation, go to dashboard
  useEffect(() => {
    if (isAuthenticated && authStep === "done") {
      onGetStarted?.();
    }
  }, [isAuthenticated, authStep]);

  // After a password sign-in, check if the email already has a role
  useEffect(() => {
    if (!isAuthenticated || authStep !== "signingIn") return;
    // existingUser is a reactive query — it resolves after sign-in populates the user record
    if (existingUser === undefined) return; // still loading
    if (existingUser === null) {
      // No existing user with this email — proceed to profile creation
      setAuthStep("profile");
      return;
    }
    // Email already registered — check role
    if (existingUser.role) {
      if (existingUser.role === selectedPersona) {
        // Same role — skip to dashboard
        onGetStarted?.();
      } else {
        // Different role — deny, sign out, and show error
        signOut();
        setError(
          `This email is already registered as a ${existingUser.role.replace("_", " ")}. ` +
          `Use a different email to create a ${selectedPersona?.replace("_", " ")} account, ` +
          `or sign in with the correct role.`
        );
        setAuthStep("email");
      }
    } else {
      // User exists but has no role yet — proceed to profile creation
      setAuthStep("profile");
    }
  }, [isAuthenticated, existingUser, authStep, selectedPersona, signOut, onGetStarted]);

  // ── Account lookup ──
  // Accounts created before passwords existed have no password yet — they set
  // one on this visit, attached to the same user row.
  const legacyAccount = existingUser != null && !existingUser.hasPassword;
  // Brand-new emails — and pre-password accounts — are setting a password, so
  // the full complexity rules apply. Unknown (still loading) counts as "no".
  const needsNewPassword =
    existingUser === null || (existingUser != null && !existingUser.hasPassword);

  // Looks the email up on the server (no stale reactive state) and enforces the
  // role lock-in. Returns `blocked: true` when an error was already shown.
  const resolveAccount = async (address: string) => {
    const found = await convex.query(api.users.getUserByEmail, { email: address });
    if (found?.role && found.role !== selectedPersona) {
      setError(
        `This email is already registered as a ${found.role.replace("_", " ")}. ` +
          `Use a different email to create a ${(selectedPersona ?? "new").replace("_", " ")} account.`,
      );
      return { blocked: true, found };
    }
    return { blocked: false, found };
  };

  // ── Step 1: email + password — no codes, no waiting ──
  const handlePasswordAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    const address = email.trim();
    if (!address) return;
    setIsLoading(true);
    setError(null);
    let flow: "signIn" | "signUp" = "signIn";
    try {
      const { blocked, found } = await resolveAccount(address);
      if (blocked) {
        setIsLoading(false);
        return;
      }
      // Existing password accounts sign in; brand-new and pre-password
      // accounts go through sign-up, which attaches the password to the
      // existing user row when there is one (see src/convex/auth.ts).
      flow = found?.hasPassword ? "signIn" : "signUp";
      if (flow === "signUp") {
        const problem = passwordProblem(password, address);
        if (problem) {
          setError(problem);
          setIsLoading(false);
          return;
        }
      }
      const formData = new FormData();
      formData.set("email", address);
      formData.set("password", password);
      formData.set("flow", flow);
      await signIn("password", formData);
      setEmail(address);
      setAuthStep("signingIn");
    } catch (err) {
      console.error("Password sign-in error:", err);
      setError(
        flow === "signIn"
          ? "Incorrect email or password. Please try again."
          : "Could not create your account. Please try again.",
      );
    }
    setIsLoading(false);
  };

  // ── Step 1b: Forgot password ──
  // Only accounts that already have a password can reset one; everyone else
  // just sets a password with the form above.
  const handleStartReset = async () => {
    const address = email.trim();
    if (!address) {
      setError('Type your email above first, then tap "Forgot password?".');
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const { blocked, found } = await resolveAccount(address);
      if (blocked) {
        setIsLoading(false);
        return;
      }
      if (!found?.hasPassword) {
        setError("This email doesn't have a password yet — use the form above to set one.");
        setIsLoading(false);
        return;
      }
      setResetCode("");
      setNewPassword("");
      setAuthStep("reset");
    } catch (err) {
      console.error("Password reset error:", err);
      setError("Something went wrong. Please try again.");
    }
    setIsLoading(false);
  };

  // ── Step 1b: reset by email ──
  const handleSendReset = async () => {
    const address = email.trim();
    setIsLoading(true);
    setError(null);
    try {
      const formData = new FormData();
      formData.set("email", address);
      formData.set("flow", "reset");
      await signIn("password", formData);
      setResetCode("");
      setNewPassword("");
      setAuthStep("resetVerify");
    } catch (err) {
      console.error("Password reset email error:", err);
      setError("We couldn't send a reset code to that email. Please try again.");
    }
    setIsLoading(false);
  };


  const handleCompleteReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (resetCode.length !== 6) return;
    const problem = passwordProblem(newPassword, email.trim());
    if (problem) {
      setError(problem);
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const formData = new FormData();
      formData.set("email", email.trim());
      formData.set("flow", "reset-verification");
      formData.set("code", resetCode);
      formData.set("newPassword", newPassword);
      await signIn("password", formData);
      setPassword(newPassword);
      setAuthStep("signingIn");
    } catch (err) {
      console.error("Password reset verification error:", err);
      setError("That code didn't work — check your email and try again.");
      setResetCode("");
    }
    setIsLoading(false);
  };

  const submitLabel = legacyAccount
    ? "Set my password"
    : existingUser === null
      ? "Create my account"
      : existingUser && existingUser.hasPassword
        ? "Sign in"
        : "Continue";

  // ── Step 2: Save Profile ──
  const toggleSkill = (skill: string) => {
    setProfileSkills((prev) =>
      prev.includes(skill) ? prev.filter((s) => s !== skill) : [...prev, skill],
    );
  };

  const handleSaveProfile = async () => {
    if (!profileName.trim() || !selectedPersona) return;
    setIsSaving(true);
    setError(null);
    try {
      // Always save name, email, and role
      await updateProfile({ name: profileName, email });
      await updateRole({ role: selectedPersona });
      // Only create actor profile for actors
      if (selectedPersona === "actor") {
        await upsertProfile({
          stageName: profileName,
          phone: profilePhone || undefined,
          city: profileCity || undefined,
          primaryDiscipline: "both",
          screenSkills: profileSkills.filter((s) =>
            ["On-Camera Acting", "Commercial", "Motion Capture", "Green Screen", "Improv", "Stunts", "Voiceover", "Self-Tape"].includes(s),
          ),
          theatreSkills: profileSkills.filter((s) =>
            ["Classical Text", "Stage Combat", "Musical Theatre", "Puppetry", "Devised Theatre", "Immersive Theatre", "Dialects & Accents", "Live Singing"].includes(s),
          ),
        });
      }
      await markOnboarding();
      setAuthStep("done");
    } catch (err) {
      setError(`Failed to save profile: ${err instanceof Error ? err.message : "Unknown error"}`);
    }
    setIsSaving(false);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Nav */}
      <nav className="sticky top-0 border-b border-border/50 bg-background/80 backdrop-blur-xl" style={{ position: "relative", zIndex: 100 }}>
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2.5">
            <div className="flex size-9 items-center justify-center rounded-xl bg-primary text-primary-foreground font-extrabold text-lg">F</div>
            <span className="text-xl font-extrabold tracking-tight">FINDME</span>
          </div>
        </div>
      </nav>

      {/* ═══════════════════════════════════════════════════════════
          STEP 1: Persona Selection — Always visible as the hero
          ═══════════════════════════════════════════════════════════ */}
      <section className="cc-gradient-hero relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,oklch(0.55_0.26_260/0.1),transparent)]" />
        <div className="relative mx-auto max-w-7xl px-4 pb-20 pt-16 sm:px-6 sm:pt-24 lg:px-8 lg:pt-32" style={{ position: "relative", zIndex: 100 }}>
          <motion.div initial="initial" animate="animate" variants={stagger} className="text-center mb-12">
            <motion.div variants={fadeUp} className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/10 px-4 py-1.5 text-sm font-medium text-white backdrop-blur-sm">
              <Sparkles className="size-4" /> The creative industry marketplace
            </motion.div>
            <motion.h1 variants={fadeUp} className="text-4xl font-extrabold tracking-tight text-white sm:text-5xl lg:text-6xl">
              Where{" "}
              <span className="bg-gradient-to-r from-primary via-primary/80 to-accent bg-clip-text text-transparent">actors</span>,{" "}
              <span className="bg-gradient-to-r from-accent via-accent/80 to-primary bg-clip-text text-transparent">directors</span>{" "}
              &amp;{" "}
              <span className="bg-gradient-to-r from-chart-3 via-chart-3/80 to-primary bg-clip-text text-transparent">theatre makers</span>{" "}
              connect
            </motion.h1>
            <motion.p variants={fadeUp} className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-white/80">
              FINDME is a two-sided marketplace connecting actors, film/TV directors, and theatre
              makers. Build profiles, post productions, discover collaborators, and make your next
              creative project happen.
            </motion.p>
          </motion.div>

          {/* Persona Cards */}
          <motion.div initial="initial" animate="animate" variants={stagger} className="grid gap-6 md:grid-cols-3 max-w-5xl mx-auto">
            {personas.map((p, i) => (
              <motion.div key={p.id} variants={fadeUp}>
                <Card
                  className={`h-full border-2 cursor-pointer transition-all hover:shadow-lg ${
                    authStep === "persona" || selectedPersona === p.id
                      ? `${p.borderColor} ${p.bg}`
                      : "border-border/60 hover:border-border"
                  }`}
                  onClick={() => {
                    setSelectedPersona(p.id);
                    setAuthStep("email");
                  }}
                >
                  <CardContent className="p-6">
                    <div className={`flex size-12 items-center justify-center rounded-2xl ${p.bg} ${p.color} mb-4`}>
                      <p.icon className="size-6" />
                    </div>
                    <p className={`text-xs font-bold uppercase tracking-wider ${p.color}`}>{p.subtitle}</p>
                    <h3 className="mt-1 text-xl font-extrabold">{p.title}</h3>
                    <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{p.desc}</p>
                    <ul className="mt-4 space-y-2">
                      {p.bullets.map((b) => (
                        <li key={b} className="flex items-center gap-2 text-sm">
                          <CheckCircle2 className={`size-4 ${p.color} shrink-0`} /> {b}
                        </li>
                      ))}
                    </ul>
                    <div className="mt-4 flex items-center gap-1 text-sm font-medium text-primary">
                      Create your profile <ChevronRight className="size-4" />
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════
          STEP 2 & 3: Email + password sign-in, then Profile Creation
          ═══════════════════════════════════════════════════════════ */}
      {(authStep === "email" || authStep === "signingIn" || authStep === "reset" || authStep === "resetVerify" || authStep === "profile") && (
        <section className="mx-auto max-w-lg px-4 py-16 sm:px-6" style={{ position: "relative", zIndex: 100 }}>
          {/* Already authenticated but loading profile */}
          {isAuthenticated && authStep === "email" && (
            <Card className="border-border/60 shadow-lg">
              <CardContent className="p-6 text-center">
                <Loader2 className="mx-auto size-6 animate-spin text-primary mb-3" />
                <p className="text-sm text-muted-foreground">Setting up your account…</p>
              </CardContent>
            </Card>
          )}

          {/* Signing in with a password */}
          {authStep === "signingIn" && (
            <Card className="border-border/60 shadow-lg">
              <CardContent className="p-6 text-center">
                <Loader2 className="mx-auto size-6 animate-spin text-primary mb-3" />
                <p className="text-sm text-muted-foreground">Signing you in…</p>
              </CardContent>
            </Card>
          )}

          {/* Email + password */}
          {authStep === "email" && (
            <Card className="border-border/60 shadow-lg">
              <CardHeader className="text-center pb-2">
                <CardTitle className="text-lg">
                  {selectedPersona === "actor" && "Actor Profile"}
                  {selectedPersona === "director" && "Director Profile"}
                  {selectedPersona === "theatre_maker" && "Theatre Maker Profile"}
                </CardTitle>
                <CardDescription>
                  {legacyAccount
                    ? "Welcome back — set a password to keep your role, profile, and projects"
                    : existingUser
                      ? "Welcome back — sign in with your email and password"
                      : "Create your profile in under a minute — email and password only"}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handlePasswordAuth} className="space-y-3">
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input placeholder="name@example.com" type="email" className="pl-9" value={email} onChange={(e) => setEmail(e.target.value)} disabled={isLoading} required autoFocus />
                  </div>

                  {legacyAccount && (
                    <div className="rounded-xl border border-border bg-muted/40 p-3 text-xs text-muted-foreground">
                      This email already has a FINDME account. Set a password now — your role,
                      profile, projects, and messages all stay exactly as they are.
                    </div>
                  )}

                  {needsNewPassword && (
                    <p className="text-xs text-muted-foreground">
                      New passwords need at least {MIN_PASSWORD_LENGTH} characters, with a
                      capital, a number, and a symbol.
                    </p>
                  )}

                  <PasswordField
                    value={password}
                    onChange={setPassword}
                    email={email.trim()}
                    showRules={needsNewPassword}
                    placeholder={needsNewPassword ? "Create a password" : "Your password"}
                    autoComplete={needsNewPassword ? "new-password" : "current-password"}
                    disabled={isLoading}
                  />

                  {error && <p className="text-sm text-red-500">{error}</p>}

                  <Button type="submit" className="w-full gap-2" disabled={isLoading || !email.includes("@") || password.length === 0 || (needsNewPassword && passwordProblem(password, email.trim()) !== null)}>
                    {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                    {isLoading ? "Please wait…" : submitLabel}
                    {!isLoading && <ArrowRight className="h-4 w-4" />}
                  </Button>

                  <div className="pt-1 text-center">
                    <button
                      type="button"
                      onClick={handleStartReset}
                      disabled={isLoading}
                      className="text-xs text-muted-foreground underline-offset-4 hover:text-foreground hover:underline disabled:opacity-50"
                    >
                      Forgot password?
                    </button>
                  </div>
                </form>

                <Button variant="link" className="mt-2 w-full text-xs" onClick={() => { setAuthStep("persona"); setSelectedPersona(null); setError(null); }}>
                  ← Choose a different role
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Password reset — request a code */}
          {authStep === "reset" && (
            <Card className="border-border/60 shadow-lg">
              <CardHeader className="text-center pb-2">
                <CardTitle className="text-lg">Reset your password</CardTitle>
                <CardDescription>We'll email a 6-digit reset code to {email.trim()}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="rounded-xl border border-border bg-muted/40 p-3 text-xs text-muted-foreground">
                  The email comes from {" "}
                  <span className="font-medium text-foreground">FIND ME</span> — if it hasn't
                  landed within a minute, check your spam folder.
                </div>
                {error && <p className="text-sm text-red-500">{error}</p>}
                <Button onClick={handleSendReset} disabled={isLoading} className="w-full gap-2">
                  {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Mail className="h-4 w-4" />}
                  {isLoading ? "Sending…" : "Email me a reset code"}
                </Button>
                <Button variant="link" className="w-full text-xs" onClick={() => { setAuthStep("email"); setError(null); }} disabled={isLoading}>
                  ← Back to sign in
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Password reset — code + new password */}
          {authStep === "resetVerify" && (
            <Card className="border-border/60 shadow-lg">
              <CardHeader className="text-center pb-2">
                <CardTitle className="text-lg">Enter your reset code</CardTitle>
                <CardDescription>We sent a 6-digit code to {email.trim()}</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleCompleteReset} className="space-y-3">
                  <div className="flex justify-center">
                    <InputOTP value={resetCode} onChange={setResetCode} maxLength={6} disabled={isLoading}>
                      <InputOTPGroup>
                        {Array.from({ length: 6 }).map((_, i) => (
                          <InputOTPSlot key={i} index={i} />
                        ))}
                      </InputOTPGroup>
                    </InputOTP>
                  </div>

                  <PasswordField
                    value={newPassword}
                    onChange={setNewPassword}
                    email={email.trim()}
                    showRules
                    placeholder="New password"
                    autoComplete="new-password"
                    disabled={isLoading}
                  />

                  {error && <p className="text-sm text-red-500 text-center">{error}</p>}

                  <Button type="submit" className="w-full gap-2" disabled={isLoading || resetCode.length !== 6 || passwordProblem(newPassword, email.trim()) !== null}>
                    {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                    {isLoading ? "Setting…" : "Set new password"}
                  </Button>
                </form>
                <Button variant="link" className="mt-2 w-full text-xs" onClick={() => { setAuthStep("reset"); setError(null); }} disabled={isLoading}>
                  Didn't get the code? Send again
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Profile creation */}
          {isAuthenticated && authStep === "profile" && (
            <Card className="border-border/60 shadow-lg text-left">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-3">
                  <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <Camera className="size-5" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">Create your profile</CardTitle>
                    <CardDescription>Tell the industry about yourself — this appears in search results</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-sm font-bold">Full Name *</label>
                  <Input placeholder="Your name or stage name" value={profileName} onChange={(e) => setProfileName(e.target.value)} />
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-bold flex items-center gap-1.5"><Phone className="size-3.5" /> Phone Number</label>
                  <Input type="tel" placeholder="+1 (555) 123-4567" value={profilePhone} onChange={(e) => setProfilePhone(e.target.value)} />
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-bold flex items-center gap-1.5"><MapPin className="size-3.5" /> City / Region</label>
                  <Input placeholder="e.g. New York, London, Mumbai" value={profileCity} onChange={(e) => setProfileCity(e.target.value)} />
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-bold">Skills & Training</label>
                  <div className="flex flex-wrap gap-1.5">
                    {SKILL_OPTIONS.map((skill) => (
                      <Badge key={skill} variant={profileSkills.includes(skill) ? "default" : "outline"} className="cursor-pointer select-none text-xs" onClick={() => toggleSkill(skill)}>
                        {skill}
                      </Badge>
                    ))}
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-bold">Short Bio</label>
                  <textarea placeholder="Your experience, training, and what you're looking for…" value={profileBio} onChange={(e) => setProfileBio(e.target.value)} rows={3} className="w-full rounded-xl border border-input bg-background px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/30" />
                </div>

                {error && (
                  <div className="rounded-xl bg-red-500/10 border border-red-500/20 p-3 text-red-500 text-sm">{error}</div>
                )}

                <Button onClick={handleSaveProfile} disabled={isSaving || !profileName.trim()} className="w-full gap-2">
                  {isSaving ? <Loader2 className="size-4 animate-spin" /> : <CheckCircle2 className="size-4" />}
                  {isSaving ? "Saving…" : "Create Profile & Enter"}
                </Button>
              </CardContent>
            </Card>
          )}
        </section>
      )}

      {/* Stats */}
      <section className="border-y border-border/50 bg-muted/30">
        <div className="mx-auto grid max-w-7xl grid-cols-2 gap-6 px-4 py-10 sm:px-6 md:grid-cols-4">
          {stats.map((s) => (
            <motion.div key={s.label} initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center">
              <p className="text-3xl font-extrabold">{s.value}</p>
              <p className="mt-1 text-sm text-muted-foreground">{s.label}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-extrabold tracking-tight">Everything you need to cast &amp; create</h2>
          <p className="mt-3 text-lg text-muted-foreground">Built specifically for the performing arts industry</p>
        </div>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((f, i) => (
            <motion.div key={f.title} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.08 }}>
              <Card className="h-full border-border/60 hover:border-primary/30 transition-colors">
                <CardContent className="p-6">
                  <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary mb-4"><f.icon className="size-5" /></div>
                  <h3 className="font-bold">{f.title}</h3>
                  <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/50 bg-muted/30">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 text-center text-sm text-muted-foreground">
          <p>© 2025 FINDME. The creative industry marketplace.</p>
          <div className="mt-3 inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-4 py-1.5">
            <Shield className="size-3.5 text-emerald-500" />
            <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">Secured by TxTheatre</span>
          </div>
          <p className="mt-2 text-xs text-muted-foreground/60">Verified profiles · Protected messaging · Trusted industry platform</p>
        </div>
      </footer>
    </div>
  );
}
