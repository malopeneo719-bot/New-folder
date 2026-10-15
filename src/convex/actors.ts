import { getAuthUserId } from "@convex-dev/auth/server";
import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

export const getProfile = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;
    return await ctx.db
      .query("actorProfiles")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .unique();
  },
});

export const getProfileById = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("actorProfiles")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .unique();
  },
});

export const upsertProfile = mutation({
  args: {
    stageName: v.optional(v.string()),
    gender: v.optional(v.union(
      v.literal("male"), v.literal("female"), v.literal("non_binary"),
      v.literal("other"), v.literal("prefer_not_to_say"),
    )),
    dateOfBirth: v.optional(v.string()),
    ethnicity: v.optional(v.string()),
    height: v.optional(v.string()),
    weight: v.optional(v.string()),
    bodyType: v.optional(v.string()),
    eyeColor: v.optional(v.string()),
    hairColor: v.optional(v.string()),
    distinguishingFeatures: v.optional(v.string()),
    phone: v.optional(v.string()),
    city: v.optional(v.string()),
    region: v.optional(v.string()),
    willingToTravel: v.optional(v.union(
      v.literal("local"), v.literal("national"), v.literal("international"),
    )),
    remoteWorkCapable: v.optional(v.boolean()),
    driversLicense: v.optional(v.boolean()),
    passportStatus: v.optional(v.string()),
    primaryDiscipline: v.optional(v.union(
      v.literal("film_tv"), v.literal("theatre"), v.literal("both"),
    )),
    screenSkills: v.optional(v.array(v.string())),
    theatreSkills: v.optional(v.array(v.string())),
    trainingInstitutions: v.optional(v.array(v.string())),
    yearsExperience: v.optional(v.number()),
    headshots: v.optional(v.array(v.string())),
    screenReel: v.optional(v.string()),
    stageReel: v.optional(v.string()),
    voiceSamples: v.optional(v.array(v.string())),
    monologues: v.optional(v.array(v.string())),
    currentlySeeking: v.optional(v.union(
      v.literal("film_tv"), v.literal("theatre"), v.literal("both"),
    )),
    screenCredits: v.optional(v.array(v.object({
      projectName: v.string(),
      role: v.string(),
      type: v.string(),
      platform: v.string(),
      year: v.number(),
      productionCompany: v.optional(v.string()),
      director: v.optional(v.string()),
    }))),
    theatreCredits: v.optional(v.array(v.object({
      productionName: v.string(),
      role: v.string(),
      venue: v.string(),
      company: v.string(),
      runDates: v.string(),
      director: v.string(),
      playwright: v.optional(v.string()),
      scale: v.string(),
    }))),
    unionStatus: v.optional(v.array(v.string())),
    agentContact: v.optional(v.string()),
    managerContact: v.optional(v.string()),
    dayJobFlexible: v.optional(v.boolean()),
    openToUnpaid: v.optional(v.boolean()),
    openToEquityShowcase: v.optional(v.boolean()),
    openToFringe: v.optional(v.boolean()),
    vocalRange: v.optional(v.string()),
    danceStyles: v.optional(v.array(v.string())),
    stageCombatCertification: v.optional(v.array(v.string())),
    classicalTrainingLevel: v.optional(v.string()),
    instrumentProficiency: v.optional(v.array(v.string())),
    dialectsAccents: v.optional(v.array(v.string())),
    openToUnderstudy: v.optional(v.boolean()),
    fringeExperienceCount: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const existing = await ctx.db
      .query("actorProfiles")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .unique();

    // Calculate profile completion
    const filled = Object.values(args).filter(
      (val) => val !== undefined && val !== null && (Array.isArray(val) ? val.length > 0 : true),
    ).length;
    const total = Object.keys(args).length;
    const profileCompletionPct = Math.round((filled / total) * 100);

    if (existing) {
      await ctx.db.patch(existing._id, { ...args, profileCompletionPct });
      return existing._id;
    }
    return await ctx.db.insert("actorProfiles", {
      ...args,
      userId,
      profileCompletionPct,
      verificationTier: "unverified",
      isPaused: false,
    });
  },
});

/**
 * Search actor profiles — returns enriched data with resolved headshot URLs and user names.
 */
export const searchActors = query({
  args: {
    city: v.optional(v.string()),
    discipline: v.optional(v.string()),
    gender: v.optional(v.string()),
    verificationTier: v.optional(v.string()),
    search: v.optional(v.string()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    let results;

    if (args.discipline) {
      results = await ctx.db
        .query("actorProfiles")
        .withIndex("by_discipline", (q) =>
          q.eq("primaryDiscipline", args.discipline as "film_tv" | "theatre" | "both"),
        )
        .collect();
    } else if (args.city) {
      results = await ctx.db
        .query("actorProfiles")
        .withIndex("by_city", (q) => q.eq("city", args.city!))
        .collect();
    } else {
      results = await ctx.db.query("actorProfiles").collect();
    }

    // Apply filters
    if (args.gender) {
      results = results.filter((a) => a.gender === args.gender);
    }
    if (args.verificationTier) {
      results = results.filter((a) => a.verificationTier === args.verificationTier);
    }

    // Enrich with user data and resolved URLs
    const enriched = await Promise.all(
      results.map(async (profile) => {
        const user = await ctx.db.get(profile.userId);

        // Resolve headshot URLs from storage IDs
        const headshotUrls: string[] = [];
        if (profile.headshots) {
          for (const id of profile.headshots) {
            // If it already looks like a URL, use it directly
            if (id.startsWith("http") || id.startsWith("data:")) {
              headshotUrls.push(id);
            } else {
              // Try to resolve from Convex storage
              const url = await ctx.storage.getUrl(id as any);
              if (url) headshotUrls.push(url);
            }
          }
        }

        // Resolve screen reel URL
        let screenReelUrl: string | undefined;
        if (profile.screenReel) {
          if (profile.screenReel.startsWith("http") || profile.screenReel.startsWith("data:")) {
            screenReelUrl = profile.screenReel;
          } else {
            const url = await ctx.storage.getUrl(profile.screenReel as any);
            if (url) screenReelUrl = url;
          }
        }

        // Resolve monologue URLs
        const monologueUrls: string[] = [];
        if (profile.monologues) {
          for (const id of profile.monologues) {
            if (id.startsWith("http") || id.startsWith("data:")) {
              monologueUrls.push(id);
            } else {
              const url = await ctx.storage.getUrl(id as any);
              if (url) monologueUrls.push(url);
            }
          }
        }

        // Resolve voice sample URLs
        const voiceSampleUrls: string[] = [];
        if (profile.voiceSamples) {
          for (const id of profile.voiceSamples) {
            if (id.startsWith("http") || id.startsWith("data:")) {
              voiceSampleUrls.push(id);
            } else {
              const url = await ctx.storage.getUrl(id as any);
              if (url) voiceSampleUrls.push(url);
            }
          }
        }

        return {
          ...profile,
          userName: user?.name ?? "Unknown",
          userImage: user?.image,
          headshotUrls,
          screenReelUrl,
          monologueUrls,
          voiceSampleUrls,
        };
      }),
    );

    // Apply text search filter after enrichment
    let final = enriched;
    if (args.search) {
      const q = args.search.toLowerCase();
      final = enriched.filter((a) => {
        const searchable = [
          a.userName, a.stageName, a.city, a.ethnicity,
          ...(a.screenSkills ?? []), ...(a.theatreSkills ?? []),
          ...(a.danceStyles ?? []), ...(a.stageCombatCertification ?? []),
          a.vocalRange, a.classicalTrainingLevel,
        ].filter(Boolean).join(" ").toLowerCase();
        return searchable.includes(q);
      });
    }

    return final.slice(0, args.limit ?? 50);
  },
});

export const getMyApplications = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];
    return await ctx.db
      .query("applications")
      .withIndex("by_actor", (q) => q.eq("actorId", userId))
      .collect();
  },
});
