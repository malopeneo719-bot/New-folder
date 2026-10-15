import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Search,
  Upload,
  Calendar,
  MessageCircle,
  BarChart3,
  Settings,
  Home,
  List,
  Plus,
  ArrowLeft,
  Star,
  Clock,
  MapPin,
  Phone,
  Send,
  ChevronRight,
  CheckCircle2,
  Users,
  Flag,
  Eye,
  TrendingUp,
  Bell,
} from "lucide-react";

// ── Mock Data ───────────────────────────────────────────────────
const LISTINGS = [
  { id: "1", title: "Morning Yoga Class", category: "Fitness", price: "$15", location: "Downtown Studio", rating: 4.8, reviews: 124, image: null, desc: "Start your day with a revitalizing 60-minute yoga flow suitable for all levels. Mats and water provided.", provider: "Wellness Co.", slots: ["7:00 AM", "8:30 AM", "10:00 AM"] },
  { id: "2", title: "House Cleaning Service", category: "Home", price: "$89", location: "Citywide", rating: 4.9, reviews: 87, image: null, desc: "Professional deep-cleaning for apartments and houses. Eco-friendly products, satisfaction guaranteed.", provider: "CleanPro", slots: ["Mon", "Wed", "Fri"] },
  { id: "3", title: "Photography Session", category: "Creative", price: "$250", location: "Studio B", rating: 4.7, reviews: 53, image: null, desc: "2-hour portrait session with professional editing. 20 retouched photos included.", provider: "Lens Studio", slots: ["Sat 10am", "Sun 2pm"] },
  { id: "4", title: "Piano Lessons", category: "Education", price: "$45/hr", location: "Music Hall", rating: 5.0, reviews: 31, image: null, desc: "Private one-on-one piano instruction for beginners to advanced. All genres welcome.", provider: "Keys Academy", slots: ["Tue", "Thu", "Sat"] },
  { id: "5", title: "Landscaping Design", category: "Home", price: "$500", location: "On-site", rating: 4.6, reviews: 42, image: null, desc: "Custom garden and landscape design consultation with 3D renders and planting plan.", provider: "Green Thumb Co.", slots: ["By appointment"] },
  { id: "6", title: "Web Design Package", category: "Technology", price: "$1,200", location: "Remote", rating: 4.8, reviews: 67, image: null, desc: "Full website design and build — responsive, fast, and beautiful. Includes hosting setup.", provider: "PixelCraft", slots: ["Start anytime"] },
];

const CATEGORIES = ["All", "Fitness", "Home", "Creative", "Education", "Technology"];

// ── Main App ────────────────────────────────────────────────────
export default function App() {
  const [view, setView] = useState<"home" | "catalog" | "detail" | "post" | "bookings" | "messages" | "admin">("home");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("All");
  const [role, setRole] = useState<"customer" | "provider" | "admin">("customer");
  const [commentText, setCommentText] = useState("");
  const [comments, setComments] = useState<{ user: string; text: string }[]>([
    { user: "Alex", text: "Great service, highly recommend!" },
    { user: "Sam", text: "Very professional and quick." },
  ]);
  const [newTitle, setNewTitle] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [newPrice, setNewPrice] = useState("");
  const [newCategory, setNewCategory] = useState("Fitness");
  const [bookings, setBookings] = useState<{ listing: string; slot: string; date: string }[]>([]);
  const [messages, setMessages] = useState<{ from: string; text: string }[]>([
    { from: "Wellness Co.", text: "Thanks for your interest! Let us know if you have questions." },
  ]);
  const [newMessage, setNewMessage] = useState("");
  const [showBookingConfirm, setShowBookingConfirm] = useState(false);

  const selectedListing = useMemo(() => LISTINGS.find((l) => l.id === selectedId), [selectedId]);

  const filteredListings = useMemo(() => {
    return LISTINGS.filter((l) => {
      const matchSearch = !searchQuery || l.title.toLowerCase().includes(searchQuery.toLowerCase()) || l.category.toLowerCase().includes(searchQuery.toLowerCase());
      const matchCategory = activeCategory === "All" || l.category === activeCategory;
      return matchSearch && matchCategory;
    });
  }, [searchQuery, activeCategory]);

  const handleBook = () => {
    if (!selectedListing || !selectedSlot) return;
    setBookings((prev) => [...prev, { listing: selectedListing.title, slot: selectedSlot, date: new Date().toLocaleDateString() }]);
    setShowBookingConfirm(true);
    setTimeout(() => setShowBookingConfirm(false), 3000);
  };

  const handlePost = () => {
    if (!newTitle.trim()) return;
    setNewTitle("");
    setNewDesc("");
    setNewPrice("");
    setView("catalog");
  };

  const handleComment = () => {
    if (!commentText.trim()) return;
    setComments((prev) => [...prev, { user: "You", text: commentText }]);
    setCommentText("");
  };

  const handleSendMessage = () => {
    if (!newMessage.trim()) return;
    setMessages((prev) => [...prev, { from: "You", text: newMessage }]);
    setNewMessage("");
  };

  return (
    <div className="min-h-screen bg-background">
      {/* ── Top Bar ──────────────────────────────────────────── */}
      <header className="sticky top-0 z-40 border-b border-border/50 bg-background/80 backdrop-blur-xl">
        <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-2.5">
            {view !== "home" ? (
              <Button variant="ghost" size="icon" onClick={() => { setView("home"); setSelectedId(null); setSelectedSlot(null); }}>
                <ArrowLeft className="size-4" />
              </Button>
            ) : (
              <div className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground font-extrabold text-sm">F</div>
            )}
            <span className="font-extrabold tracking-tight">FINDME</span>
            <Badge variant="secondary" className="text-[10px] ml-1 capitalize">{role}</Badge>
          </div>
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" className="relative">
              <Bell className="size-4" />
              <span className="absolute -top-0.5 -right-0.5 size-2 rounded-full bg-accent" />
            </Button>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
        {/* ── HOME ────────────────────────────────────────────── */}
        {view === "home" && (
          <div className="space-y-6">
            {/* Role switcher */}
            <Card className="border-border/60">
              <CardContent className="p-4 flex items-center gap-3">
                <p className="text-sm font-medium shrink-0">I am a:</p>
                <div className="flex gap-2">
                  {(["customer", "provider", "admin"] as const).map((r) => (
                    <Badge
                      key={r}
                      variant={role === r ? "default" : "outline"}
                      className="cursor-pointer capitalize"
                      onClick={() => setRole(r)}
                    >
                      {r}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Quick actions */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {[
                { icon: Search, label: "Browse Catalog", color: "bg-primary text-primary-foreground", action: () => setView("catalog") },
                { icon: Upload, label: "Post a Listing", color: "bg-accent text-accent-foreground", action: () => setView("post") },
                { icon: Calendar, label: "My Bookings", color: "bg-chart-3 text-white", action: () => setView("bookings") },
                { icon: MessageCircle, label: "Messages", color: "bg-chart-5 text-white", action: () => setView("messages") },
              ].map((a) => (
                <button
                  key={a.label}
                  onClick={a.action}
                  className="cc-card-hover flex items-center gap-3 rounded-2xl border border-border/60 bg-card p-5 text-left"
                >
                  <div className={`flex size-10 items-center justify-center rounded-xl ${a.color}`}>
                    <a.icon className="size-5" />
                  </div>
                  <div>
                    <p className="font-bold text-sm">{a.label}</p>
                    <ChevronRight className="size-4 text-muted-foreground" />
                  </div>
                </button>
              ))}
            </div>

            {/* Stats */}
            {role === "admin" && (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {[
                  { label: "Total Users", value: "1,247", icon: Users, color: "text-primary" },
                  { label: "Active Listings", value: LISTINGS.length.toString(), icon: List, color: "text-accent" },
                  { label: "Bookings Today", value: bookings.length.toString(), icon: Calendar, color: "text-chart-3" },
                  { label: "Reports", value: "3", icon: Flag, color: "text-destructive" },
                ].map((s) => (
                  <Card key={s.label} className="border-border/60">
                    <CardContent className="p-4 flex items-center justify-between">
                      <div>
                        <p className="text-xs text-muted-foreground">{s.label}</p>
                        <p className="text-2xl font-extrabold mt-1">{s.value}</p>
                      </div>
                      <div className={`flex size-10 items-center justify-center rounded-xl bg-muted/50 ${s.color}`}>
                        <s.icon className="size-5" />
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            {role === "admin" && (
              <Card className="border-border/60">
                <CardHeader className="pb-3"><CardTitle className="text-sm">Admin Tools</CardTitle></CardHeader>
                <CardContent className="flex flex-wrap gap-2">
                  <Button variant="outline" size="sm" className="gap-1.5"><Users className="size-3.5" /> Manage Users</Button>
                  <Button variant="outline" size="sm" className="gap-1.5"><List className="size-3.5" /> Moderate Listings</Button>
                  <Button variant="outline" size="sm" className="gap-1.5"><Flag className="size-3.5" /> Review Reports</Button>
                  <Button variant="outline" size="sm" className="gap-1.5"><Settings className="size-3.5" /> Settings</Button>
                </CardContent>
              </Card>
            )}

            {/* Recent listings */}
            <div>
              <h2 className="text-lg font-extrabold mb-4">Popular Right Now</h2>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {LISTINGS.slice(0, 3).map((l) => (
                  <ListingCard key={l.id} listing={l} onClick={() => { setSelectedId(l.id); setView("detail"); }} />
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── CATALOG ─────────────────────────────────────────── */}
        {view === "catalog" && (
          <div className="space-y-4">
            <h2 className="text-lg font-extrabold">Browse Listings</h2>
            <div className="flex gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-2.5 size-4 text-muted-foreground" />
                <Input placeholder="Search listings..." className="pl-9" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
              </div>
            </div>
            <div className="flex gap-2 overflow-x-auto pb-1">
              {CATEGORIES.map((c) => (
                <Badge key={c} variant={activeCategory === c ? "default" : "outline"} className="cursor-pointer shrink-0" onClick={() => setActiveCategory(c)}>
                  {c}
                </Badge>
              ))}
            </div>
            {filteredListings.length > 0 ? (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {filteredListings.map((l) => (
                  <ListingCard key={l.id} listing={l} onClick={() => { setSelectedId(l.id); setView("detail"); }} />
                ))}
              </div>
            ) : (
              <Card className="border-dashed border-2 border-border/60">
                <CardContent className="p-8 text-center">
                  <Search className="mx-auto size-10 text-muted-foreground/50 mb-3" />
                  <p className="text-sm text-muted-foreground">No listings match your search.</p>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {/* ── DETAIL ─────────────────────────────────────────── */}
        {view === "detail" && selectedListing && (
          <div className="space-y-6 max-w-2xl">
            <div>
              <Badge variant="secondary" className="mb-2">{selectedListing.category}</Badge>
              <h2 className="text-2xl font-extrabold">{selectedListing.title}</h2>
              <p className="text-sm text-muted-foreground mt-1">by {selectedListing.provider}</p>
            </div>
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <span className="flex items-center gap-1"><Star className="size-4 fill-amber-400 text-amber-400" /> {selectedListing.rating} ({selectedListing.reviews} reviews)</span>
              <span className="flex items-center gap-1"><MapPin className="size-4" /> {selectedListing.location}</span>
            </div>
            <Card className="border-border/60">
              <CardContent className="p-5">
                <p className="text-sm leading-relaxed">{selectedListing.desc}</p>
              </CardContent>
            </Card>
            <Card className="border-border/60">
              <CardContent className="p-5">
                <p className="font-bold text-sm mb-3">Available Times</p>
                <div className="flex flex-wrap gap-2">
                  {selectedListing.slots.map((s) => (
                    <Badge
                      key={s}
                      variant={selectedSlot === s ? "default" : "outline"}
                      className="cursor-pointer"
                      onClick={() => setSelectedSlot(s)}
                    >
                      {s}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
            <div className="flex items-center gap-3">
              <p className="text-2xl font-extrabold text-primary">{selectedListing.price}</p>
              <div className="flex-1" />
              <Button className="rounded-xl gap-2" onClick={handleBook} disabled={!selectedSlot}>
                <Calendar className="size-4" /> Book Now
              </Button>
            </div>
            {showBookingConfirm && (
              <Card className="border-green-200 bg-green-50 dark:bg-green-950/30">
                <CardContent className="p-4 flex items-center gap-3">
                  <CheckCircle2 className="size-5 text-green-600" />
                  <p className="text-sm font-medium">Booking confirmed! Check your bookings for details.</p>
                </CardContent>
              </Card>
            )}
            {/* Comments */}
            <Card className="border-border/60">
              <CardHeader className="pb-3"><CardTitle className="text-sm">Comments & Reviews</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                {comments.map((c, i) => (
                  <div key={i} className="flex gap-3">
                    <Avatar className="size-8 shrink-0">
                      <AvatarFallback className="bg-primary/10 text-primary text-xs">{c.user.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-xs font-semibold">{c.user}</p>
                      <p className="text-sm text-muted-foreground">{c.text}</p>
                    </div>
                  </div>
                ))}
                <div className="flex gap-2 pt-2 border-t border-border/40">
                  <Input placeholder="Write a comment..." value={commentText} onChange={(e) => setCommentText(e.target.value)} className="text-sm" />
                  <Button size="icon" onClick={handleComment}><Send className="size-4" /></Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* ── POST ───────────────────────────────────────────── */}
        {view === "post" && (
          <div className="space-y-6 max-w-2xl">
            <h2 className="text-lg font-extrabold">Post a Listing</h2>
            <Card className="border-border/60">
              <CardContent className="p-6 space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-bold">Title</label>
                  <Input placeholder="What are you offering?" value={newTitle} onChange={(e) => setNewTitle(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold">Description</label>
                  <Textarea rows={4} placeholder="Tell people what's included..." value={newDesc} onChange={(e) => setNewDesc(e.target.value)} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-bold">Category</label>
                    <select className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={newCategory} onChange={(e) => setNewCategory(e.target.value)}>
                      {CATEGORIES.filter((c) => c !== "All").map((c) => <option key={c}>{c}</option>)}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold">Price</label>
                    <Input placeholder="$0" value={newPrice} onChange={(e) => setNewPrice(e.target.value)} />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold">Photos</label>
                  <div className="border-2 border-dashed border-border/60 rounded-xl p-8 text-center hover:border-primary/40 transition-colors cursor-pointer">
                    <Upload className="mx-auto size-8 text-muted-foreground/50 mb-2" />
                    <p className="text-xs text-muted-foreground">Drag & drop or click to upload</p>
                  </div>
                </div>
                <Button className="w-full rounded-xl" onClick={handlePost}>Publish Listing</Button>
              </CardContent>
            </Card>
          </div>
        )}

        {/* ── BOOKINGS ───────────────────────────────────────── */}
        {view === "bookings" && (
          <div className="space-y-4">
            <h2 className="text-lg font-extrabold">My Bookings</h2>
            {bookings.length > 0 ? (
              <div className="space-y-3">
                {bookings.map((b, i) => (
                  <Card key={i} className="border-border/60">
                    <CardContent className="p-4 flex items-center gap-3">
                      <div className="flex size-10 items-center justify-center rounded-xl bg-chart-3/10 text-chart-3">
                        <Calendar className="size-5" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-bold">{b.listing}</p>
                        <p className="text-xs text-muted-foreground">{b.slot} · Booked {b.date}</p>
                      </div>
                      <Badge variant="secondary" className="text-[10px]">Confirmed</Badge>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card className="border-dashed border-2 border-border/60">
                <CardContent className="p-8 text-center">
                  <Calendar className="mx-auto size-10 text-muted-foreground/50 mb-3" />
                  <p className="text-sm text-muted-foreground">No bookings yet. Browse listings and book your first service!</p>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {/* ── MESSAGES ────────────────────────────────────────── */}
        {view === "messages" && (
          <div className="space-y-4 max-w-2xl">
            <h2 className="text-lg font-extrabold">Messages</h2>
            <Card className="border-border/60">
              <CardContent className="p-4 space-y-3 max-h-96 overflow-y-auto">
                {messages.map((m, i) => (
                  <div key={i} className={`flex gap-3 ${m.from === "You" ? "flex-row-reverse" : ""}`}>
                    <Avatar className="size-8 shrink-0">
                      <AvatarFallback className={`text-xs ${m.from === "You" ? "bg-accent/10 text-accent" : "bg-primary/10 text-primary"}`}>
                        {m.from.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <div className={`rounded-xl px-3 py-2 max-w-xs ${m.from === "You" ? "bg-primary text-primary-foreground" : "bg-muted"}`}>
                      <p className="text-xs font-semibold mb-0.5">{m.from}</p>
                      <p className="text-sm">{m.text}</p>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
            <div className="flex gap-2">
              <Input placeholder="Type a message..." value={newMessage} onChange={(e) => setNewMessage(e.target.value)} className="text-sm" />
              <Button size="icon" onClick={handleSendMessage}><Send className="size-4" /></Button>
            </div>
          </div>
        )}
      </div>

      {/* ── Bottom Nav (mobile) ──────────────────────────────── */}
      <nav className="fixed bottom-0 inset-x-0 z-50 border-t border-border/50 bg-background/90 backdrop-blur-xl sm:hidden">
        <div className="flex items-center justify-around h-14">
          {[
            { icon: Home, label: "Home", v: "home" as const },
            { icon: Search, label: "Browse", v: "catalog" as const },
            { icon: Plus, label: "Post", v: "post" as const },
            { icon: Calendar, label: "Bookings", v: "bookings" as const },
            { icon: MessageCircle, label: "Messages", v: "messages" as const },
          ].map((n) => (
            <button
              key={n.label}
              onClick={() => { setView(n.v); setSelectedId(null); setSelectedSlot(null); }}
              className={`flex flex-col items-center gap-0.5 text-[10px] ${view === n.v ? "text-primary font-bold" : "text-muted-foreground"}`}
            >
              <n.icon className="size-5" />
              {n.label}
            </button>
          ))}
        </div>
      </nav>
    </div>
  );
}

// ── Listing Card Component ──────────────────────────────────────
function ListingCard({ listing, onClick }: { listing: typeof LISTINGS[0]; onClick: () => void }) {
  return (
    <button onClick={onClick} className="cc-card-hover group overflow-hidden rounded-2xl border border-border/60 bg-card text-left w-full">
      <div className="aspect-[2/1] bg-gradient-to-br from-primary/10 via-accent/5 to-chart-3/10 flex items-center justify-center">
        <span className="text-3xl font-extrabold text-primary/20">{listing.title.charAt(0)}</span>
      </div>
      <div className="p-4">
        <div className="flex items-start justify-between gap-2">
          <div>
            <h3 className="font-bold text-sm leading-tight">{listing.title}</h3>
            <p className="text-xs text-muted-foreground mt-0.5">{listing.provider}</p>
          </div>
          <Badge variant="secondary" className="text-[10px] shrink-0">{listing.category}</Badge>
        </div>
        <div className="mt-2 flex items-center gap-3 text-xs text-muted-foreground">
          <span className="flex items-center gap-1"><Star className="size-3 fill-amber-400 text-amber-400" /> {listing.rating}</span>
          <span className="flex items-center gap-1"><MapPin className="size-3" /> {listing.location}</span>
        </div>
        <div className="mt-3 flex items-center justify-between border-t border-border/40 pt-3">
          <p className="font-extrabold text-primary">{listing.price}</p>
          <Badge variant="outline" className="text-[10px]">View Details →</Badge>
        </div>
      </div>
    </button>
  );
}
