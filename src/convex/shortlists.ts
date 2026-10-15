import { getAuthUserId } from "@convex-dev/auth/server";
import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

export const getMyShortlists = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];
    const shortlists = await ctx.db
      .query("shortlists")
      .withIndex("by_owner", (q) => q.eq("ownerId", userId))
      .collect();

    return Promise.all(
      shortlists.map(async (s) => {
        const target = await ctx.db.get(s.targetUserId);
        const project = s.projectId ? await ctx.db.get(s.projectId) : null;
        return { ...s, targetName: target?.name, projectName: project?.title };
      }),
    );
  },
});

export const addToList = mutation({
  args: {
    name: v.string(),
    targetUserId: v.id("users"),
    projectId: v.optional(v.id("projects")),
    note: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    return await ctx.db.insert("shortlists", {
      ownerId: userId,
      ...args,
      createdAt: Date.now(),
    });
  },
});

export const removeFromList = mutation({
  args: { shortlistId: v.id("shortlists") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");
    const item = await ctx.db.get(args.shortlistId);
    if (!item || item.ownerId !== userId) throw new Error("Not authorized");
    await ctx.db.delete(args.shortlistId);
  },
});
