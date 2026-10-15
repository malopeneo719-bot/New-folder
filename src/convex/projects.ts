import { getAuthUserId } from "@convex-dev/auth/server";
import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

export const listOpen = query({
  args: {
    projectType: v.optional(v.string()),
    city: v.optional(v.string()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    let results = await ctx.db
      .query("projects")
      .withIndex("by_status", (q) => q.eq("status", "open"))
      .order("desc")
      .collect();

    if (args.projectType) {
      results = results.filter((p) => p.projectType === args.projectType);
    }
    if (args.city) {
      results = results.filter((p) => p.venueCity === args.city);
    }

    const enriched = await Promise.all(
      results.slice(0, args.limit ?? 30).map(async (project) => {
        const roles = await ctx.db
          .query("projectRoles")
          .withIndex("by_project", (q) => q.eq("projectId", project._id))
          .collect();
        const creator = await ctx.db.get(project.creatorId);

        // Resolve video URLs from storage IDs
        const videoUrls: string[] = [];
        if (project.videoStorageIds) {
          for (const id of project.videoStorageIds) {
            const url = await ctx.storage.getUrl(id as any);
            if (url) videoUrls.push(url);
          }
        }

        // Resolve image URL from storage if it looks like a storage ID
        let resolvedImageUrl = project.imageUrl;
        if (project.imageUrl && !project.imageUrl.startsWith("http")) {
          const url = await ctx.storage.getUrl(project.imageUrl as any);
          if (url) resolvedImageUrl = url;
        }

        return { ...project, roles, creatorName: creator?.name ?? "Unknown", videoUrls, resolvedImageUrl };
      }),
    );

    return enriched;
  },
});

export const getMyProjects = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];
    const projects = await ctx.db
      .query("projects")
      .withIndex("by_creator", (q) => q.eq("creatorId", userId))
      .order("desc")
      .collect();

    return Promise.all(projects.map(async (p) => {
      const videoUrls: string[] = [];
      if (p.videoStorageIds) {
        for (const id of p.videoStorageIds) {
          const url = await ctx.storage.getUrl(id as any);
          if (url) videoUrls.push(url);
        }
      }
      let resolvedImageUrl = p.imageUrl;
      if (p.imageUrl && !p.imageUrl.startsWith("http")) {
        const url = await ctx.storage.getUrl(p.imageUrl as any);
        if (url) resolvedImageUrl = url;
      }
      return { ...p, videoUrls, resolvedImageUrl };
    }));
  },
});

export const getProject = query({
  args: { projectId: v.id("projects") },
  handler: async (ctx, args) => {
    const project = await ctx.db.get(args.projectId);
    if (!project) return null;
    const roles = await ctx.db
      .query("projectRoles")
      .withIndex("by_project", (q) => q.eq("projectId", args.projectId))
      .collect();
    const creator = await ctx.db.get(project.creatorId);
    const applications = await ctx.db
      .query("applications")
      .withIndex("by_project", (q) => q.eq("projectId", args.projectId))
      .collect();

    // Resolve video URLs
    const videoUrls: string[] = [];
    if (project.videoStorageIds) {
      for (const id of project.videoStorageIds) {
        const url = await ctx.storage.getUrl(id as any);
        if (url) videoUrls.push(url);
      }
    }

    let resolvedImageUrl = project.imageUrl;
    if (project.imageUrl && !project.imageUrl.startsWith("http")) {
      const url = await ctx.storage.getUrl(project.imageUrl as any);
      if (url) resolvedImageUrl = url;
    }

    return { ...project, roles, creatorName: creator?.name ?? "Unknown", applications, videoUrls, resolvedImageUrl };
  },
});

export const createProject = mutation({
  args: {
    title: v.string(),
    playwright: v.optional(v.string()),
    synopsis: v.optional(v.string()),
    projectType: v.union(
      v.literal("reading"), v.literal("workshop"), v.literal("fringe_production"),
      v.literal("mainstage"), v.literal("touring"), v.literal("developmental"),
      v.literal("concert_staged_reading"), v.literal("film"), v.literal("tv"),
      v.literal("short_film"), v.literal("commercial"), v.literal("web_series"),
    ),
    venueName: v.optional(v.string()),
    venueCity: v.optional(v.string()),
    rehearsalStart: v.optional(v.string()),
    firstPreview: v.optional(v.string()),
    closingDate: v.optional(v.string()),
    compensationType: v.optional(v.union(
      v.literal("paid"), v.literal("stipend"), v.literal("profit_share"),
      v.literal("unpaid"), v.literal("deferred"), v.literal("equity_showcase"),
      v.literal("lort"), v.literal("aea_off_broadway"), v.literal("aea_regional"),
    )),
    unionContract: v.optional(v.string()),
    submissionDeadline: v.optional(v.string()),
    visibility: v.optional(v.union(
      v.literal("public"), v.literal("invite_only"), v.literal("hidden"),
    )),
    imageUrl: v.optional(v.string()),
    roles: v.array(v.object({
      roleName: v.string(),
      roleType: v.union(v.literal("actor"), v.literal("creative_team")),
      discipline: v.optional(v.string()),
      characterDescription: v.optional(v.string()),
      ageRange: v.optional(v.string()),
      gender: v.optional(v.string()),
      ethnicityNotes: v.optional(v.string()),
      skillsRequired: v.optional(v.array(v.string())),
      vocalRange: v.optional(v.string()),
    })),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const { roles, ...projectData } = args;
    const projectId = await ctx.db.insert("projects", {
      ...projectData,
      creatorId: userId,
      status: "draft",
      createdAt: Date.now(),
    });

    for (const role of roles) {
      await ctx.db.insert("projectRoles", {
        ...role,
        projectId,
        status: "open",
      });
    }

    return projectId;
  },
});

export const publishProject = mutation({
  args: { projectId: v.id("projects") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");
    const project = await ctx.db.get(args.projectId);
    if (!project) throw new Error("Project not found");
    if (project.creatorId !== userId) throw new Error("Not authorized");
    await ctx.db.patch(args.projectId, { status: "open" });
    return args.projectId;
  },
});

/**
 * Add a video storage ID to a project.
 */
export const addVideo = mutation({
  args: {
    projectId: v.id("projects"),
    storageId: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");
    const project = await ctx.db.get(args.projectId);
    if (!project) throw new Error("Project not found");
    if (project.creatorId !== userId) throw new Error("Not authorized");

    const current = project.videoStorageIds ?? [];
    await ctx.db.patch(args.projectId, {
      videoStorageIds: [...current, args.storageId],
    });
    return { success: true };
  },
});

/**
 * Remove a video storage ID from a project.
 */
export const removeVideo = mutation({
  args: {
    projectId: v.id("projects"),
    storageId: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");
    const project = await ctx.db.get(args.projectId);
    if (!project) throw new Error("Project not found");
    if (project.creatorId !== userId) throw new Error("Not authorized");

    const current = project.videoStorageIds ?? [];
    const updated = current.filter((id) => id !== args.storageId);
    await ctx.db.patch(args.projectId, { videoStorageIds: updated });

    // Delete from storage
    try { await ctx.storage.delete(args.storageId as any); } catch {}

    return { success: true };
  },
});

/**
 * Get all applications for a project (for theatre makers / directors).
 */
export const getApplicationsForProject = query({
  args: { projectId: v.id("projects") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];

    // Verify the requester is the project creator
    const project = await ctx.db.get(args.projectId);
    if (!project || project.creatorId !== userId) return [];

    const applications = await ctx.db
      .query("applications")
      .withIndex("by_project", (q) => q.eq("projectId", args.projectId))
      .order("desc")
      .collect();

    return Promise.all(
      applications.map(async (app) => {
        const user = await ctx.db.get(app.actorId);
        const profile = await ctx.db
          .query("actorProfiles")
          .withIndex("by_user", (q) => q.eq("userId", app.actorId))
          .unique();
        const role = app.roleId ? await ctx.db.get(app.roleId) : null;

        // Resolve headshot URLs
        const headshotUrls: string[] = [];
        if (profile?.headshots) {
          for (const id of profile.headshots) {
            if (id.startsWith("http") || id.startsWith("data:")) headshotUrls.push(id);
            else {
              const url = await ctx.storage.getUrl(id as any);
              if (url) headshotUrls.push(url);
            }
          }
        }

        return {
          ...app,
          actorName: user?.name ?? "Unknown",
          actorEmail: user?.email,
          headshotUrls,
          stageName: profile?.stageName,
          city: profile?.city,
          skills: [...(profile?.screenSkills ?? []), ...(profile?.theatreSkills ?? [])],
          roleName: role?.roleName,
        };
      }),
    );
  },
});

/**
 * Update application status (accept/reject).
 */
export const updateApplicationStatus = mutation({
  args: {
    applicationId: v.id("applications"),
    status: v.union(
      v.literal("under_review"), v.literal("audition_offered"),
      v.literal("callback"), v.literal("booked"), v.literal("released"),
    ),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const application = await ctx.db.get(args.applicationId);
    if (!application) throw new Error("Application not found");

    const project = await ctx.db.get(application.projectId);
    if (!project || project.creatorId !== userId) throw new Error("Not authorized");

    await ctx.db.patch(args.applicationId, { status: args.status });
    return { success: true };
  },
});

/**
 * Get production stats for the creator.
 */
export const getProductionStats = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return { totalProjects: 0, openProjects: 0, totalApplications: 0, totalRoles: 0 };

    const projects = await ctx.db
      .query("projects")
      .withIndex("by_creator", (q) => q.eq("creatorId", userId))
      .collect();

    const openProjects = projects.filter((p) => p.status === "open");

    let totalApplications = 0;
    let totalRoles = 0;
    for (const project of projects) {
      const apps = await ctx.db
        .query("applications")
        .withIndex("by_project", (q) => q.eq("projectId", project._id))
        .collect();
      totalApplications += apps.length;

      const roles = await ctx.db
        .query("projectRoles")
        .withIndex("by_project", (q) => q.eq("projectId", project._id))
        .collect();
      totalRoles += roles.length;
    }

    return {
      totalProjects: projects.length,
      openProjects: openProjects.length,
      totalApplications,
      totalRoles,
    };
  },
});
