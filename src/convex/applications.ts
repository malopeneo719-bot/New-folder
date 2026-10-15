import { getAuthUserId } from "@convex-dev/auth/server";
import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

export const applyToProject = mutation({
  args: {
    projectId: v.id("projects"),
    roleId: v.optional(v.id("projectRoles")),
    message: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const existing = await ctx.db
      .query("applications")
      .withIndex("by_actor", (q) => q.eq("actorId", userId))
      .collect();

    const alreadyApplied = existing.some(
      (a) => a.projectId === args.projectId && a.roleId === args.roleId,
    );
    if (alreadyApplied) throw new Error("Already applied");

    return await ctx.db.insert("applications", {
      projectId: args.projectId,
      roleId: args.roleId,
      actorId: userId,
      message: args.message,
      status: "applied",
      appliedAt: Date.now(),
    });
  },
});

export const updateApplicationStatus = mutation({
  args: {
    applicationId: v.id("applications"),
    status: v.union(
      v.literal("applied"), v.literal("under_review"), v.literal("audition_offered"),
      v.literal("callback"), v.literal("booked"), v.literal("released"),
      v.literal("withdrawn"),
    ),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const app = await ctx.db.get(args.applicationId);
    if (!app) throw new Error("Application not found");

    const project = await ctx.db.get(app.projectId);
    if (!project || project.creatorId !== userId) throw new Error("Not authorized");

    await ctx.db.patch(args.applicationId, { status: args.status });
    return args.applicationId;
  },
});

export const getApplicationsForProject = query({
  args: { projectId: v.id("projects") },
  handler: async (ctx, args) => {
    const apps = await ctx.db
      .query("applications")
      .withIndex("by_project", (q) => q.eq("projectId", args.projectId))
      .collect();

    const enriched = await Promise.all(
      apps.map(async (app) => {
        const actor = await ctx.db.get(app.actorId);
        const profile = await ctx.db
          .query("actorProfiles")
          .withIndex("by_user", (q) => q.eq("userId", app.actorId))
          .unique();
        return { ...app, actorName: actor?.name, profile };
      }),
    );

    return enriched;
  },
});
