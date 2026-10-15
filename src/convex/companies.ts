import { getAuthUserId } from "@convex-dev/auth/server";
import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

export const createCompany = mutation({
  args: {
    name: v.string(),
    bio: v.optional(v.string()),
    location: v.optional(v.string()),
    website: v.optional(v.string()),
    logoUrl: v.optional(v.string()),
    coverImage: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const companyId = await ctx.db.insert("companies", {
      ...args,
      verified: false,
      createdByUserId: userId,
    });

    await ctx.db.insert("companyMembers", {
      companyId,
      userId,
      roleInCompany: "founder",
      joinedAt: Date.now(),
    });

    return companyId;
  },
});

export const getMyCompanies = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];

    const memberships = await ctx.db
      .query("companyMembers")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();

    return Promise.all(
      memberships.map(async (m) => {
        const company = await ctx.db.get(m.companyId);
        return { ...m, company };
      }),
    );
  },
});

export const getCompany = query({
  args: { companyId: v.id("companies") },
  handler: async (ctx, args) => {
    const company = await ctx.db.get(args.companyId);
    if (!company) return null;

    const members = await ctx.db
      .query("companyMembers")
      .withIndex("by_company", (q) => q.eq("companyId", args.companyId))
      .collect();

    const enrichedMembers = await Promise.all(
      members.map(async (m) => {
        const user = await ctx.db.get(m.userId);
        const actorProfile = await ctx.db
          .query("actorProfiles")
          .withIndex("by_user", (q) => q.eq("userId", m.userId))
          .unique();
        const theatreMakerProfile = await ctx.db
          .query("theatreMakerProfiles")
          .withIndex("by_user", (q) => q.eq("userId", m.userId))
          .unique();
        return { ...m, userName: user?.name, userImage: user?.image, actorProfile, theatreMakerProfile };
      }),
    );

    const projects = await ctx.db
      .query("projects")
      .withIndex("by_creator", (q) => q.eq("creatorId", company.createdByUserId))
      .collect();

    return { ...company, members: enrichedMembers, projects };
  },
});

export const followCompany = mutation({
  args: { companyId: v.id("companies") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const existing = await ctx.db
      .query("companyFollows")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();

    const alreadyFollowing = existing.some((f) => f.companyId === args.companyId);
    if (alreadyFollowing) throw new Error("Already following");

    return await ctx.db.insert("companyFollows", {
      userId,
      companyId: args.companyId,
      createdAt: Date.now(),
    });
  },
});
