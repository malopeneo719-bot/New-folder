import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Star, MapPin, CheckCircle2 } from "lucide-react";

interface ActorCardProps {
  name: string;
  image?: string;
  city?: string;
  discipline?: string;
  verificationTier?: string;
  headline?: string;
  skills?: string[];
  rating?: number;
  onContact?: () => void;
  onViewProfile?: () => void;
  onShortlist?: () => void;
}

export function ActorCard({
  name,
  image,
  city,
  discipline,
  verificationTier,
  headline,
  skills = [],
  rating,
  onContact,
  onViewProfile,
  onShortlist,
}: ActorCardProps) {
  const initials = name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const disciplineLabel =
    discipline === "film_tv" ? "Film & TV"
    : discipline === "theatre" ? "Theatre"
    : discipline === "both" ? "Film & Theatre" : "";

  return (
    <Card className="cc-card-hover group overflow-hidden border-border/60">
      <CardContent className="p-5">
        <div className="flex gap-4">
          <Avatar className="size-16 rounded-xl">
            <AvatarImage src={image} alt={name} />
            <AvatarFallback className="rounded-xl bg-primary/10 text-sm font-semibold text-primary">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-semibold leading-tight">{name}</h3>
                {headline && (
                  <p className="mt-0.5 text-xs text-muted-foreground truncate">{headline}</p>
                )}
              </div>
              {verificationTier === "verified" && (
                <Badge variant="secondary" className="gap-1 text-[10px]">
                  <CheckCircle2 className="size-3" />
                  Verified
                </Badge>
              )}
            </div>
            <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
              {city && (
                <span className="flex items-center gap-1">
                  <MapPin className="size-3" />
                  {city}
                </span>
              )}
              {disciplineLabel && (
                <>
                  <span className="text-border">·</span>
                  <span>{disciplineLabel}</span>
                </>
              )}
              {rating !== undefined && rating > 0 && (
                <>
                  <span className="text-border">·</span>
                  <span className="flex items-center gap-0.5">
                    <Star className="size-3 fill-amber-400 text-amber-400" />
                    {rating.toFixed(1)}
                  </span>
                </>
              )}
            </div>
            {skills.length > 0 && (
              <div className="mt-2.5 flex flex-wrap gap-1">
                {skills.slice(0, 4).map((skill) => (
                  <Badge key={skill} variant="outline" className="text-[10px] font-normal">
                    {skill}
                  </Badge>
                ))}
                {skills.length > 4 && (
                  <Badge variant="outline" className="text-[10px] font-normal">
                    +{skills.length - 4}
                  </Badge>
                )}
              </div>
            )}
          </div>
        </div>
        <div className="mt-4 flex items-center gap-2 border-t border-border/40 pt-3">
          <Button variant="ghost" size="sm" className="gap-1 text-xs" onClick={onViewProfile}>
            View Profile
          </Button>
          <Button variant="ghost" size="sm" className="gap-1 text-xs" onClick={onShortlist}>
            <Star className="size-3" />
            Shortlist
          </Button>
          <div className="flex-1" />
          <Button size="sm" className="rounded-lg text-xs" onClick={onContact}>
            Contact
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
