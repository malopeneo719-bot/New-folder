import { getAuthUserId } from "@convex-dev/auth/server";
import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

const theatreMakerRoleValidator = v.union(
  v.literal("playwright"), v.literal("director"), v.literal("producer"),
  v.literal("set_designer"), v.literal("costume_designer"), v.literal("lighting_designer"),
  v.literal("sound_designer"), v.literal("stage_manager"), v.literal("composer"),
  v.literal("choreographer"), v.literal("dramaturg"), v.literal("intimacy_coordinator"),
  v.literal("projection_designer"), v.literal("company"),
);

const projectTypeValidator = v.union(
  v.literal("reading"), v.literal("workshop"), v.literal("fringe_production"),
  v.literal("mainstage"), v.literal("touring"), v.literal("developmental"),
  v.literal("concert_staged_reading"), v.literal("film"), v.literal("tv"),
  v.literal("short_film"), v.literal("commercial"), v.literal("web_series"),
);

export const getProfile = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;
    return await ctx.db
      .query("theatreMakerProfiles")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .unique();
  },
});

export const upsertProfile = mutation({
  args: {
    primaryRoles: v.array(theatreMakerRoleValidator),
    secondaryRoles: v.optional(v.array(theatreMakerRoleValidator)),
    bio: v.optional(v.string()),
    aestheticStatement: v.optional(v.string()),
    portfolioUrls: v.optional(v.array(v.string())),
    scriptSamples: v.optional(v.array(v.string())),
    yearsActive: v.optional(v.number()),
    companyAffiliation: v.optional(v.string()),
    unionStatus: v.optional(v.array(v.string())),
    rateExpectations: v.optional(v.string()),
    city: v.optional(v.string()),
    lat: v.optional(v.number()),
    lng: v.optional(v.number()),
    willingToTravel: v.optional(v.boolean()),
    preferredProjectTypes: v.optional(v.array(projectTypeValidator)),
    compensationEthics: v.optional(v.string()),
    styleTags: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const existing = await ctx.db
      .query("theatreMakerProfiles")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .unique();

    if (existing) {
      await ctx.db.patch(existing._id, args);
      return existing._id;
    }
    return await ctx.db.insert("theatreMakerProfiles", {
      ...args,
      userId,
      verificationTier: "unverified",
    });
  },
});
