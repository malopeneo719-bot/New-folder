import { getAuthUserId } from "@convex-dev/auth/server";
import { query, mutation, QueryCtx } from "./_generated/server";
import { v } from "convex/values";

/**
 * Get the current signed in user. Returns null if the user is not signed in.
 */
export const currentUser = query({
  args: {},
  handler: async (ctx) => {
    const user = await getCurrentUser(ctx);
    if (user === null) {
      return null;
    }
    return user;
  },
});

/**
 * Update the user's role (actor / director / theatre_maker).
 */
/**
 * Check if an email already belongs to a registered user with a role.
 */
export const getUserByEmail = query({
  args: { email: v.string() },
  handler: async (ctx, args) => {
    // `.unique()` would throw if two rows ever shared an email, which would
    // break sign-in entirely — take two and prefer the account with a role.
    const users = await ctx.db
      .query("users")
      .withIndex("email", (q) => q.eq("email", args.email))
      .take(2);
    const user = users.find((u) => u.role) ?? users[0];
    if (!user) return null;
    // Whether this email already has an email+password credential, so the
    // sign-in UI knows whether to sign in or to set up a new account.
    const passwordAccount = await ctx.db
      .query("authAccounts")
      .withIndex("providerAndAccountId", (q) =>
        q.eq("provider", "password").eq("providerAccountId", args.email),
      )
      .first();
    return {
      _id: user._id,
      name: user.name,
      role: user.role,
      email: user.email,
      hasPassword: passwordAccount !== null,
    };
  },
});

export const updateRole = mutation({
  args: {
    role: v.union(
      v.literal("admin"),
      v.literal("actor"),
      v.literal("director"),
      v.literal("theatre_maker"),
    ),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");
    await ctx.db.patch(userId, { role: args.role });
  },
});

/**
 * Save the user's name and email during onboarding.
 */
export const updateProfile = mutation({
  args: {
    name: v.optional(v.string()),
    email: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");
    const patch: Record<string, any> = {};
    if (args.name !== undefined) patch.name = args.name;
    if (args.email !== undefined) patch.email = args.email;
    await ctx.db.patch(userId, patch);
  },
});

/**
 * Reset the account back to role selection (sign out).
 */
export const resetAccount = mutation({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");
    await ctx.db.patch(userId, { role: undefined, onboardingComplete: undefined });
  },
});

/**
 * Mark onboarding as complete.
 */
export const markOnboardingComplete = mutation({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");
    await ctx.db.patch(userId, { onboardingComplete: true });
  },
});

/**
 * Use this function internally to get the current user data.
 */
export const getCurrentUser = async (ctx: QueryCtx) => {
  const userId = await getAuthUserId(ctx);
  if (userId === null) {
    return null;
  }
  return await ctx.db.get(userId);
};
