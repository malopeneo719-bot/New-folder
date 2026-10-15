import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MapPin, DollarSign, Users, Clock, Theater, Play, X } from "lucide-react";

interface ProjectCardProps {
  title: string;
  projectType: string;
  venueCity?: string;
  venueName?: string;
  compensationType?: string;
  submissionDeadline?: string;
  status?: string;
  openRolesCount?: number;
  totalApplications?: number;
  creatorName?: string;
  imageUrl?: string;
  videoUrls?: string[];
  onApply?: () => void;
  onView?: () => void;
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

export function ProjectCard({
  title, projectType, venueCity, compensationType, submissionDeadline,
  status, openRolesCount, creatorName, imageUrl, videoUrls = [],
  onApply, onView,
}: ProjectCardProps) {
  const [playingVideo, setPlayingVideo] = useState<string | null>(null);
  const deadlineLabel = submissionDeadline
    ? new Date(submissionDeadline).toLocaleDateString("en-US", { month: "short", day: "numeric" })
    : null;

  const hasVideo = videoUrls.length > 0;

  return (
    <Card className="cc-card-hover group overflow-hidden border-border/60">
      {/* Hero area: image or video */}
      <div className="aspect-[2/1] overflow-hidden relative bg-muted">
        {playingVideo ? (
          <div className="relative w-full h-full">
            <video
              src={playingVideo}
              controls
              autoPlay
              className="w-full h-full object-cover"
            />
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-2 right-2 size-8 bg-black/60 hover:bg-black/80 text-white rounded-full"
              onClick={(e) => { e.stopPropagation(); setPlayingVideo(null); }}
            >
              <X className="size-4" />
            </Button>
          </div>
        ) : imageUrl ? (
          <img src={imageUrl} alt={title} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
        ) : (
          <div className="flex items-center justify-center h-full bg-gradient-to-br from-primary/10 to-accent/10">
            <Theater className="size-12 text-primary/20" />
          </div>
        )}

        {/* Video play button overlay */}
        {!playingVideo && hasVideo && (
          <button
            className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={(e) => { e.stopPropagation(); setPlayingVideo(videoUrls[0]); }}
          >
            <div className="flex size-14 items-center justify-center rounded-full bg-white/90 shadow-xl">
              <Play className="size-6 text-black ml-1" />
            </div>
          </button>
        )}

        {/* Video count badge */}
        {!playingVideo && hasVideo && (
          <div className="absolute bottom-2 right-2 flex items-center gap-1 rounded-lg bg-black/70 px-2 py-1 text-[10px] text-white">
            <Play className="size-3" /> {videoUrls.length} video{videoUrls.length > 1 ? "s" : ""}
          </div>
        )}
      </div>

      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h3 className="font-semibold leading-tight truncate">{title}</h3>
            {creatorName && <p className="mt-0.5 text-xs text-muted-foreground">by {creatorName}</p>}
          </div>
          <Badge variant="secondary" className="shrink-0 text-[10px]">
            {projectTypeLabels[projectType] ?? projectType}
          </Badge>
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
          {venueCity && (
            <span className="flex items-center gap-1"><MapPin className="size-3" />{venueCity}</span>
          )}
          {compensationType && (
            <span className="flex items-center gap-1"><DollarSign className="size-3" />{compensationLabels[compensationType] ?? compensationType}</span>
          )}
          {deadlineLabel && (
            <span className="flex items-center gap-1"><Clock className="size-3" />Deadline: {deadlineLabel}</span>
          )}
          {openRolesCount !== undefined && openRolesCount > 0 && (
            <span className="flex items-center gap-1"><Users className="size-3" />{openRolesCount} open roles</span>
          )}
        </div>
        {status && (
          <div className="mt-3">
            <Badge variant={status === "open" ? "default" : status === "cast" ? "secondary" : "outline"} className="text-[10px]">
              {status === "open" ? "Accepting Applications" : status}
            </Badge>
          </div>
        )}

        {/* Video strip — show all video thumbnails when multiple */}
        {!playingVideo && videoUrls.length > 1 && (
          <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
            {videoUrls.map((url, i) => (
              <button
                key={i}
                className="relative shrink-0 w-20 h-14 rounded-lg overflow-hidden border border-border/40 group/v"
                onClick={(e) => { e.stopPropagation(); setPlayingVideo(url); }}
              >
                <video src={url} className="w-full h-full object-cover" preload="metadata" muted />
                <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover/v:opacity-100 transition-opacity">
                  <Play className="size-4 text-white" />
                </div>
              </button>
            ))}
          </div>
        )}

        <div className="mt-4 flex items-center gap-2 border-t border-border/40 pt-3">
          <Button variant="ghost" size="sm" className="text-xs" onClick={onView}>View Details</Button>
          <div className="flex-1" />
          {status === "open" && (
            <Button size="sm" className="rounded-lg gap-1 text-xs" onClick={onApply}>
              <Theater className="size-3" />Quick Apply
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
