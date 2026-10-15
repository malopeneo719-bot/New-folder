import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

/**
 * Generate a URL the client can POST a file to, directly into Convex file storage.
 * Returns the uploadUrl — the client fetches it with the raw file body.
 */
export const generateUploadUrl = mutation({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");
    return await ctx.storage.generateUploadUrl();
  },
});

/**
 * Store a storageId string into the actor profile's media arrays.
 * mediaType: "headshot" | "screenReel" | "voiceSample" | "monologue"
 * action: "add" | "remove"
 */
export const saveMediaRef = mutation({
  args: {
    storageId: v.string(),
    mediaType: v.union(
      v.literal("headshot"),
      v.literal("screenReel"),
      v.literal("voiceSample"),
      v.literal("monologue"),
    ),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const profile = await ctx.db
      .query("actorProfiles")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .unique();

    if (!profile) throw new Error("No actor profile found. Complete onboarding first.");

    const fieldMap: Record<string, string> = {
      headshot: "headshots",
      screenReel: "screenReel",
      voiceSample: "voiceSamples",
      monologue: "monologues",
    };
    const field = fieldMap[args.mediaType];

    if (args.mediaType === "screenReel") {
      await ctx.db.patch(profile._id, { [field]: args.storageId });
    } else {
      const current = (profile as any)[field] as string[] | undefined;
      const updated = [...(current ?? []), args.storageId];
      await ctx.db.patch(profile._id, { [field]: updated });
    }

    return { success: true };
  },
});

/**
 * Remove a storage ID from the actor profile's media arrays.
 */
export const removeMediaRef = mutation({
  args: {
    storageId: v.string(),
    mediaType: v.union(
      v.literal("headshot"),
      v.literal("screenReel"),
      v.literal("voiceSample"),
      v.literal("monologue"),
    ),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const profile = await ctx.db
      .query("actorProfiles")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .unique();

    if (!profile) return;

    const fieldMap: Record<string, string> = {
      headshot: "headshots",
      screenReel: "screenReel",
      voiceSample: "voiceSamples",
      monologue: "monologues",
    };
    const field = fieldMap[args.mediaType];

    if (args.mediaType === "screenReel") {
      await ctx.db.patch(profile._id, { [field]: "" });
    } else {
      const current = (profile as any)[field] as string[] | undefined;
      const updated = (current ?? []).filter((id) => id !== args.storageId);
      await ctx.db.patch(profile._id, { [field]: updated });
    }

    // Delete the file from storage
    try { await ctx.storage.delete(args.storageId as any); } catch {}

    return { success: true };
  },
});

/**
 * Get the URLs for a list of storage IDs.
 */
export const getMediaUrls = query({
  args: { storageIds: v.array(v.string()) },
  handler: async (ctx, args) => {
    const urls: string[] = [];
    for (const id of args.storageIds) {
      const url = await ctx.storage.getUrl(id as any);
      if (url) urls.push(url);
    }
    return urls;
  },
});
