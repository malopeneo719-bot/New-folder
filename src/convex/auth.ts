// THIS FILE IS READ ONLY. Do not touch this file unless you are correctly adding a new auth provider in accordance to the vly auth documentation

import { convexAuth } from "@convex-dev/auth/server";
import { Anonymous } from "@convex-dev/auth/providers/Anonymous";
import { Email } from "@convex-dev/auth/providers/Email";
import { Password } from "@convex-dev/auth/providers/Password";
import { RandomReader, generateRandomString } from "@oslojs/crypto/random";
import type { Doc } from "./_generated/dataModel";
import type { MutationCtx } from "./_generated/server";
import { sendSignInEmail } from "./signInEmail";


// Password-reset codes. Sent from FIND ME itself ("Sign in to FIND ME", no
// third-party footer) through the platform email gateway — see signInEmail.ts
// for the template and the VLY_INTEGRATION_KEY / EMAIL_FROM variables it reads.
const passwordReset = Email({
  id: "password-reset",
  maxAge: 60 * 60, // 1 hour, as stated in the email
  async generateVerificationToken() {
    const random: RandomReader = {
      read(bytes: Uint8Array) {
        crypto.getRandomValues(bytes);
      },
    };
    return generateRandomString(random, "0123456789", 6);
  },
  async sendVerificationRequest({ identifier: email, token }) {
    await sendSignInEmail({ to: email, code: token });
  },
});


// Sign-in is email + a password the user chooses. There is intentionally no
// one-time-code sign-in provider: a code emailed before anyone is signed in is
// the flow people found confusing. Accounts created back when codes were the
// only option keep working — the first password sign-up for such an email is
// attached to the existing user row (see createOrUpdateUser below) instead of
// creating a duplicate. Password recovery uses short-lived reset codes
// (see `passwordReset` above).
export const { auth, signIn, signOut, store, isAuthenticated } = convexAuth({
  providers: [Password({ reset: passwordReset }), Anonymous],

  callbacks: {
    // Called before an account is created (and when an existing account is
    // updated). This replaces Convex Auth's default email-verification based
    // account linking, which can't work without code-based sign-in.
    async createOrUpdateUser(ctx, { existingUserId, provider, profile }) {
      // The callback context is typed generically — use the generated table
      // types so the user queries and writes below are checked properly.
      const db = ctx.db as unknown as MutationCtx["db"];

      // Provider verification flags belong on the auth account, not on the
      // user document — convert them the way the package default does.
      const { emailVerified, phoneVerified, ...user } = profile;
      const userData = {
        ...(emailVerified ? { emailVerificationTime: Date.now() } : null),
        ...(phoneVerified ? { phoneVerificationTime: Date.now() } : null),
        ...user,
      };

      // Sign-in to an account that already exists — keep the same user row.
      if (existingUserId !== null) {
        await db.patch(existingUserId, userData as Partial<Doc<"users">>);
        return existingUserId;
      }

      const email =
        typeof profile.email === "string" ? profile.email : undefined;

      // Email + password sign-up where this email already has a user row (for
      // example an account created before passwords existed): reuse that row
      // so the role, actor / theatre-maker profiles, projects, and messages
      // stay with the same person.
      if (provider.id === "password" && email) {
        const candidates = await db
          .query("users")
          .withIndex("email", (q) => q.eq("email", email))
          .take(2);
        const existing = candidates.find((user) => user.role) ?? candidates[0];
        if (existing) {
          await db.patch(existing._id, userData as Partial<Doc<"users">>);
          return existing._id;
        }
      }

      // Brand-new email — create a fresh user row.
      return await db.insert("users", userData as Partial<Doc<"users">>);
    },
  },
});
