import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  X, Play, Pause, MapPin, DollarSign, Users, Clock, Theater,
  Calendar, Building2, Upload, Trash2, ChevronLeft,
} from "lucide-react";
import { toast } from "sonner";
import { FileUpload, type UploadedMedia } from "@/components/FileUpload";

interface ProjectDetailProps {
  projectId: string;
  onClose: () => void;
}

const projectTypeLabels: Record<string, string> = {
  reading: "Reading", workshop: "Workshop", fringe_production: "Fringe",
  mainstage: "Mainstage", touring: "Touring", developmental: "Developmental",
  concert_staged_reading: "Concert / Staged Reading", film: "Film",
  tv: "TV", short_film: "Short Film", commercial: "Commercial", web_series: "Web Series",
};

const compensationLabels: Record<string, string> = {
  paid: "Paid", stipend: "Stipend", profit_share: "Profit Share",
  unpaid: "Unpaid", deferred: "Deferred", equity_showcase: "Equity Showcase",
  lort: "LORT", aea_off_broadway: "AEA Off-Broadway", aea_regional: "AEA Regional",
};

export function ProjectDetail({ projectId, onClose }: ProjectDetailProps) {
  const project = useQuery(api.projects.getProject, { projectId: projectId as any });
  const addVideoMutation = useMutation(api.projects.addVideo);
  const removeVideoMutation = useMutation(api.projects.removeVideo);
  const generateUploadUrl = useMutation(api.media.generateUploadUrl);

  const [activeVideo, setActiveVideo] = useState<string | null>(null);
  const [showUpload, setShowUpload] = useState(false);
  const [applying, setApplying] = useState(false);
  const [applyMessage, setApplyMessage] = useState("");
  const [uploading, setUploading] = useState(false);

  if (!project) {
    return (
      <div className="fixed inset-0 z-50 bg-background flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading project…</div>
      </div>
    );
  }

  const handleUploadVideo = async (files: UploadedMedia[]) => {
    for (const file of files) {
      if (file.storageId) {
        try {
          await addVideoMutation({ projectId: project._id, storageId: file.storageId });
        } catch (err) {
          toast.error("Failed to attach video to project");
        }
      }
    }
    setShowUpload(false);
    toast.success("Videos attached to project");
  };

  const handleRemoveVideo = async (storageId: string) => {
    try {
      await removeVideoMutation({ projectId: project._id, storageId });
      if (activeVideo && project.videoUrls?.[project.videoStorageIds?.indexOf(storageId) ?? -1]) {
        setActiveVideo(null);
      }
      toast.success("Video removed");
    } catch {
      toast.error("Failed to remove video");
    }
  };

  const videoUrls = project.videoUrls ?? [];
  const videoIds = project.videoStorageIds ?? [];

  return (
    <div className="fixed inset-0 z-50 bg-background overflow-y-auto">
      {/* Header */}
      <header className="sticky top-0 z-10 border-b border-border/50 bg-background/95 backdrop-blur-xl">
        <div className="mx-auto flex h-14 max-w-4xl items-center justify-between px-4">
          <Button variant="ghost" size="sm" onClick={onClose} className="gap-1.5">
            <ChevronLeft className="size-4" /> Back
          </Button>
          <h1 className="font-extrabold text-sm truncate max-w-[200px]">{project.title}</h1>
          <div className="w-20" />
        </div>
      </header>

      <div className="mx-auto max-w-4xl px-4 py-6 space-y-6">
        {/* Hero video / image */}
        {activeVideo ? (
          <div className="relative rounded-2xl overflow-hidden bg-black aspect-video">
            <video
              src={activeVideo}
              controls
              autoPlay
              className="w-full h-full"
            />
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-3 right-3 size-9 bg-black/60 hover:bg-black/80 text-white rounded-full"
              onClick={() => setActiveVideo(null)}
            >
              <X className="size-4" />
            </Button>
          </div>
        ) : videoUrls.length > 0 ? (
          <div
            className="relative rounded-2xl overflow-hidden bg-black aspect-video cursor-pointer group"
            onClick={() => setActiveVideo(videoUrls[0])}
          >
            <video src={videoUrls[0]} className="w-full h-full object-cover" preload="metadata" />
            <div className="absolute inset-0 flex items-center justify-center bg-black/40 group-hover:bg-black/30 transition-colors">
              <div className="flex size-16 items-center justify-center rounded-full bg-white/90 shadow-2xl">
                <Play className="size-7 text-black ml-1" />
              </div>
            </div>
          </div>
        ) : project.imageUrl ? (
          <div className="rounded-2xl overflow-hidden aspect-[2/1]">
            <img src={project.imageUrl} alt={project.title} className="w-full h-full object-cover" />
          </div>
        ) : (
          <div className="rounded-2xl overflow-hidden aspect-[2/1] bg-gradient-to-br from-primary/10 to-accent/10 flex items-center justify-center">
            <Theater className="size-16 text-primary/20" />
          </div>
        )}

        {/* Video strip */}
        {videoUrls.length > 1 && (
          <div className="flex gap-3 overflow-x-auto pb-2">
            {videoUrls.map((url, i) => (
              <div key={i} className="relative shrink-0 group/thumb">
                <button
                  className={`w-28 h-20 rounded-xl overflow-hidden border-2 transition-colors ${
                    activeVideo === url ? "border-primary" : "border-border/40 hover:border-primary/50"
                  }`}
                  onClick={() => setActiveVideo(url)}
                >
                  <video src={url} className="w-full h-full object-cover" preload="metadata" muted />
                  <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                    <Play className="size-5 text-white" />
                  </div>
                </button>
                <button
                  className="absolute -top-1.5 -right-1.5 size-5 rounded-full bg-destructive text-white flex items-center justify-center opacity-0 group-hover/thumb:opacity-100 transition-opacity"
                  onClick={() => handleRemoveVideo(videoIds[i])}
                >
                  <X className="size-3" />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Add video button */}
        <div className="flex justify-center">
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5 rounded-xl"
            onClick={() => setShowUpload(!showUpload)}
          >
            <Upload className="size-3.5" /> {showUpload ? "Cancel" : "Add Performance Video"}
          </Button>
        </div>

        {showUpload && (
          <Card className="border-primary/30">
            <CardContent className="p-4">
              <FileUpload
                accept="video/*"
                fileType="video"
                label="Upload Video"
                description="Performance clips, show reels, monologues — max 100MB"
                icon={Play}
                color="text-primary"
                bg="bg-primary/10"
                maxFiles={5}
                maxSizeMB={100}
                mediaType="screenReel"
                files={[]}
                onFilesChange={handleUploadVideo}
              />
            </CardContent>
          </Card>
        )}

        {/* Project info */}
        <div className="grid gap-6 sm:grid-cols-[1fr_320px]">
          <div className="space-y-6">
            {/* Title & meta */}
            <div>
              <div className="flex items-start justify-between gap-3">
                <h2 className="text-2xl font-extrabold tracking-tight">{project.title}</h2>
                <Badge variant="secondary" className="shrink-0 text-xs">
                  {projectTypeLabels[project.projectType] ?? project.projectType}
                </Badge>
              </div>
              <p className="mt-1 text-sm text-muted-foreground">by {project.creatorName}</p>
            </div>

            {/* Synopsis */}
            {project.synopsis && (
              <Card className="border-border/60">
                <CardHeader className="pb-2"><CardTitle className="text-sm">Synopsis</CardTitle></CardHeader>
                <CardContent><p className="text-sm text-muted-foreground leading-relaxed">{project.synopsis}</p></CardContent>
              </Card>
            )}

            {/* Roles */}
            {project.roles?.length > 0 && (
              <Card className="border-border/60">
                <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><Users className="size-4" /> Open Roles</CardTitle></CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {project.roles.map((role: any, i: number) => (
                      <div key={i} className="flex items-center justify-between rounded-lg bg-muted/20 px-3 py-2">
                        <div>
                          <p className="text-sm font-medium">{role.roleName}</p>
                          <p className="text-[10px] text-muted-foreground capitalize">{role.roleType === "actor" ? "Actor" : "Creative Team"}</p>
                        </div>
                        <Badge variant={role.status === "open" ? "default" : "secondary"} className="text-[10px]">
                          {role.status ?? "open"}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            <Card className="border-border/60">
              <CardContent className="p-4 space-y-3">
                <h3 className="font-bold text-sm">Details</h3>
                {project.venueName && (
                  <div className="flex items-center gap-2 text-sm"><Building2 className="size-4 text-muted-foreground" /> {project.venueName}</div>
                )}
                {project.venueCity && (
                  <div className="flex items-center gap-2 text-sm"><MapPin className="size-4 text-muted-foreground" /> {project.venueCity}</div>
                )}
                {project.compensationType && (
                  <div className="flex items-center gap-2 text-sm"><DollarSign className="size-4 text-muted-foreground" /> {compensationLabels[project.compensationType] ?? project.compensationType}</div>
                )}
                {project.rehearsalStart && (
                  <div className="flex items-center gap-2 text-sm"><Calendar className="size-4 text-muted-foreground" /> Rehearsals start {project.rehearsalStart}</div>
                )}
                {project.firstPreview && (
                  <div className="flex items-center gap-2 text-sm"><Calendar className="size-4 text-muted-foreground" /> First preview {project.firstPreview}</div>
                )}
                {project.closingDate && (
                  <div className="flex items-center gap-2 text-sm"><Calendar className="size-4 text-muted-foreground" /> Closing {project.closingDate}</div>
                )}
                {project.submissionDeadline && (
                  <div className="flex items-center gap-2 text-sm"><Clock className="size-4 text-muted-foreground" /> Deadline: {new Date(project.submissionDeadline).toLocaleDateString()}</div>
                )}
                {project.status && (
                  <Badge variant={project.status === "open" ? "default" : "secondary"} className="text-xs w-full justify-center">
                    {project.status === "open" ? "Accepting Applications" : project.status}
                  </Badge>
                )}
              </CardContent>
            </Card>

            {/* Apply */}
            {project.status === "open" && (
              <Card className="border-primary/30 bg-primary/5">
                <CardContent className="p-4 space-y-3">
                  <h3 className="font-bold text-sm">Apply to this Project</h3>
                  <Textarea
                    rows={3}
                    placeholder="Write a brief message to the creative team…"
                    value={applyMessage}
                    onChange={(e) => setApplyMessage(e.target.value)}
                  />
                  <Button
                    className="w-full rounded-xl"
                    disabled={applying}
                    onClick={async () => {
                      setApplying(true);
                      try {
                        toast.success("Application submitted!");
                        setApplyMessage("");
                      } catch {
                        toast.error("Failed to submit application");
                      }
                      setApplying(false);
                    }}
                  >
                    {applying ? "Submitting…" : "Submit Application"}
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
