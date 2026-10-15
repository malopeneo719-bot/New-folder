import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Star, Plus, Trash2, FolderOpen } from "lucide-react";
import { toast } from "sonner";

export function ShortlistButton({ targetUserId, targetName }: { targetUserId: string; targetName: string }) {
  const [showListPicker, setShowListPicker] = useState(false);
  const [newListName, setNewListName] = useState("");
  const shortlists = useQuery(api.shortlists.getMyShortlists);
  const addToList = useMutation(api.shortlists.addToList);

  const isAlreadyShortlisted = shortlists?.some((s) => s.targetUserId === targetUserId);

  const handleAdd = async (listName: string) => {
    try {
      await addToList({ name: listName, targetUserId: targetUserId as any });
      toast.success(`${targetName} added to "${listName}"`);
      setShowListPicker(false);
    } catch {
      toast.error("Failed to add to shortlist");
    }
  };

  const handleCreateAndAdd = async () => {
    if (!newListName.trim()) return;
    await handleAdd(newListName);
    setNewListName("");
  };

  return (
    <div className="relative">
      <Button
        variant={isAlreadyShortlisted ? "default" : "outline"}
        size="sm"
        className={`gap-1.5 ${isAlreadyShortlisted ? "bg-amber-500 hover:bg-amber-600 text-white" : ""}`}
        onClick={() => setShowListPicker(!showListPicker)}
      >
        <Star className={`size-3.5 ${isAlreadyShortlisted ? "fill-white" : ""}`} />
        {isAlreadyShortlisted ? "Shortlisted" : "Shortlist"}
      </Button>

      {showListPicker && (
        <div className="absolute right-0 top-full mt-2 z-50 w-64 rounded-xl border border-border/60 bg-card p-3 shadow-xl">
          <p className="text-xs font-bold mb-2">Add to list:</p>
          <div className="space-y-1.5 max-h-40 overflow-y-auto">
            {shortlists && [...new Set(shortlists.map((s) => s.name))].map((name) => (
              <button
                key={name}
                className="w-full text-left text-sm px-3 py-1.5 rounded-lg hover:bg-muted transition-colors flex items-center gap-2"
                onClick={() => handleAdd(name)}
              >
                <FolderOpen className="size-3.5 text-muted-foreground" />
                {name}
              </button>
            ))}
          </div>
          <div className="mt-2 pt-2 border-t border-border/40 flex gap-2">
            <Input
              placeholder="New list name..."
              value={newListName}
              onChange={(e) => setNewListName(e.target.value)}
              className="text-xs h-8"
              onKeyDown={(e) => e.key === "Enter" && handleCreateAndAdd()}
            />
            <Button size="sm" variant="ghost" className="h-8 px-2" onClick={handleCreateAndAdd}>
              <Plus className="size-3.5" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

export function ShortlistPanel() {
  const shortlists = useQuery(api.shortlists.getMyShortlists);
  const removeFromList = useMutation(api.shortlists.removeFromList);
  const [expandedList, setExpandedList] = useState<string | null>(null);

  const grouped = shortlists?.reduce((acc, s) => {
    if (!acc[s.name]) acc[s.name] = [];
    acc[s.name].push(s);
    return acc;
  }, {} as Record<string, typeof shortlists>) ?? {};

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-extrabold">My Shortlists</h2>
      {Object.keys(grouped).length > 0 ? (
        Object.entries(grouped).map(([name, items]) => (
          <Card key={name} className="border-border/60">
            <CardContent className="p-4">
              <button
                className="w-full flex items-center justify-between"
                onClick={() => setExpandedList(expandedList === name ? null : name)}
              >
                <div className="flex items-center gap-2">
                  <Star className="size-4 text-amber-500 fill-amber-500" />
                  <span className="font-bold text-sm">{name}</span>
                  <Badge variant="secondary" className="text-[10px]">{items.length}</Badge>
                </div>
              </button>
              {expandedList === name && (
                <div className="mt-3 space-y-2">
                  {items.map((item) => (
                    <div key={item._id} className="flex items-center justify-between rounded-lg bg-muted/30 px-3 py-2">
                      <span className="text-sm">{item.targetName ?? "Unknown"}</span>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-7"
                        onClick={async () => {
                          await removeFromList({ shortlistId: item._id });
                          toast.success("Removed from shortlist");
                        }}
                      >
                        <Trash2 className="size-3.5 text-destructive" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        ))
      ) : (
        <Card className="border-dashed border-2 border-border/60">
          <CardContent className="p-8 text-center">
            <Star className="mx-auto size-10 text-muted-foreground/50 mb-3" />
            <p className="text-sm text-muted-foreground">No shortlists yet. Star actors or projects to save them here.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
