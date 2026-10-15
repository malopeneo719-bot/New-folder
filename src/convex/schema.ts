import { authTables } from "@convex-dev/auth/server";
import { defineSchema, defineTable } from "convex/server";
import { Infer, v } from "convex/values";

// ── Roles ──────────────────────────────────────────────────────────────
export const ROLES = {
  ADMIN: "admin",
  ACTOR: "actor",
  DIRECTOR: "director",
  THEATRE_MAKER: "theatre_maker",
} as const;

export const roleValidator = v.union(
  v.literal(ROLES.ADMIN),
  v.literal(ROLES.ACTOR),
  v.literal(ROLES.DIRECTOR),
  v.literal(ROLES.THEATRE_MAKER),
);
export type Role = Infer<typeof roleValidator>;

// ── Enums / Validators ─────────────────────────────────────────────────
const genderValidator = v.union(
  v.literal("male"),
  v.literal("female"),
  v.literal("non_binary"),
  v.literal("other"),
  v.literal("prefer_not_to_say"),
);

const disciplineValidator = v.union(
  v.literal("film_tv"),
  v.literal("theatre"),
  v.literal("both"),
);

const theatreMakerRoleValidator = v.union(
  v.literal("playwright"),
  v.literal("director"),
  v.literal("producer"),
  v.literal("set_designer"),
  v.literal("costume_designer"),
  v.literal("lighting_designer"),
  v.literal("sound_designer"),
  v.literal("stage_manager"),
  v.literal("composer"),
  v.literal("choreographer"),
  v.literal("dramaturg"),
  v.literal("intimacy_coordinator"),
  v.literal("projection_designer"),
  v.literal("company"),
);

const projectTypeValidator = v.union(
  v.literal("reading"),
  v.literal("workshop"),
  v.literal("fringe_production"),
  v.literal("mainstage"),
  v.literal("touring"),
  v.literal("developmental"),
  v.literal("concert_staged_reading"),
  v.literal("film"),
  v.literal("tv"),
  v.literal("short_film"),
  v.literal("commercial"),
  v.literal("web_series"),
);

const projectStatusValidator = v.union(
  v.literal("draft"),
  v.literal("open"),
  v.literal("closed"),
  v.literal("cast"),
  v.literal("ongoing"),
  v.literal("completed"),
);

const applicationStatusValidator = v.union(
  v.literal("applied"),
  v.literal("under_review"),
  v.literal("audition_offered"),
  v.literal("callback"),
  v.literal("booked"),
  v.literal("released"),
  v.literal("withdrawn"),
);

const verificationTierValidator = v.union(
  v.literal("verified"),
  v.literal("emerging"),
  v.literal("unverified"),
);

const vocalRangeValidator = v.string();

const compensationTypeValidator = v.union(
  v.literal("paid"),
  v.literal("stipend"),
  v.literal("profit_share"),
  v.literal("unpaid"),
  v.literal("deferred"),
  v.literal("equity_showcase"),
  v.literal("lort"),
  v.literal("aea_off_broadway"),
  v.literal("aea_regional"),
);

// ── Schema ─────────────────────────────────────────────────────────────
const schema = defineSchema(
  {
    ...authTables,

    // ─── Users ────────────────────────────────────────────────────────
    users: defineTable({
      name: v.optional(v.string()),
      image: v.optional(v.string()),
      email: v.optional(v.string()),
      emailVerificationTime: v.optional(v.number()),
      isAnonymous: v.optional(v.boolean()),
      role: v.optional(roleValidator),
      onboardingComplete: v.optional(v.boolean()),
      // Contact phone (set from a profile form; the app never texts it)
      phone: v.optional(v.string()),
      phoneVerificationTime: v.optional(v.number()),
    })
      .index("email", ["email"])
      .index("phone", ["phone"]),

    // ─── Actor Profiles ───────────────────────────────────────────────
    actorProfiles: defineTable({
      userId: v.id("users"),
      // Identity
      stageName: v.optional(v.string()),
      gender: v.optional(genderValidator),
      dateOfBirth: v.optional(v.string()),
      ethnicity: v.optional(v.string()),
      height: v.optional(v.string()),
      weight: v.optional(v.string()),
      bodyType: v.optional(v.string()),
      eyeColor: v.optional(v.string()),
      hairColor: v.optional(v.string()),
      distinguishingFeatures: v.optional(v.string()),
      // Contact & Logistics
      phone: v.optional(v.string()),
      city: v.optional(v.string()),
      region: v.optional(v.string()),
      willingToTravel: v.optional(
        v.union(v.literal("local"), v.literal("national"), v.literal("international")),
      ),
      remoteWorkCapable: v.optional(v.boolean()),
      driversLicense: v.optional(v.boolean()),
      passportStatus: v.optional(v.string()),
      // Discipline
      primaryDiscipline: v.optional(disciplineValidator),
      // Skills
      screenSkills: v.optional(v.array(v.string())),
      theatreSkills: v.optional(v.array(v.string())),
      trainingInstitutions: v.optional(v.array(v.string())),
      yearsExperience: v.optional(v.number()),
      // Media
      headshots: v.optional(v.array(v.string())),
      screenReel: v.optional(v.string()),
      stageReel: v.optional(v.string()),
      voiceSamples: v.optional(v.array(v.string())),
      monologues: v.optional(v.array(v.string())),
      // Credits
      screenCredits: v.optional(
        v.array(
          v.object({
            projectName: v.string(),
            role: v.string(),
            type: v.string(),
            platform: v.string(),
            year: v.number(),
            productionCompany: v.optional(v.string()),
            director: v.optional(v.string()),
          }),
        ),
      ),
      theatreCredits: v.optional(
        v.array(
          v.object({
            productionName: v.string(),
            role: v.string(),
            venue: v.string(),
            company: v.string(),
            runDates: v.string(),
            director: v.string(),
            playwright: v.optional(v.string()),
            scale: v.string(),
          }),
        ),
      ),
      // Availability
      currentlySeeking: v.optional(disciplineValidator),
      unionStatus: v.optional(v.array(v.string())),
      agentContact: v.optional(v.string()),
      managerContact: v.optional(v.string()),
      dayJobFlexible: v.optional(v.boolean()),
      openToUnpaid: v.optional(v.boolean()),
      openToEquityShowcase: v.optional(v.boolean()),
      openToFringe: v.optional(v.boolean()),
      // Theatre-specific
      vocalRange: v.optional(vocalRangeValidator),
      danceStyles: v.optional(v.array(v.string())),
      stageCombatCertification: v.optional(v.array(v.string())),
      classicalTrainingLevel: v.optional(v.string()),
      instrumentProficiency: v.optional(v.array(v.string())),
      dialectsAccents: v.optional(v.array(v.string())),
      openToUnderstudy: v.optional(v.boolean()),
      fringeExperienceCount: v.optional(v.number()),
      // Verification
      verificationTier: v.optional(verificationTierValidator),
      // Meta
      profileCompletionPct: v.optional(v.number()),
      isPaused: v.optional(v.boolean()),
    })
      .index("by_user", ["userId"])
      .index("by_city", ["city"])
      .index("by_discipline", ["primaryDiscipline"])
      .index("by_verification", ["verificationTier"]),

    // ─── Theatre Maker Profiles ───────────────────────────────────────
    theatreMakerProfiles: defineTable({
      userId: v.id("users"),
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
      verificationTier: v.optional(verificationTierValidator),
      styleTags: v.optional(v.array(v.string())),
    })
      .index("by_user", ["userId"])
      .index("by_role", ["primaryRoles"])
      .index("by_city", ["city"])
      .index("by_verification", ["verificationTier"]),

    // ─── Companies / Ensembles ────────────────────────────────────────
    companies: defineTable({
      name: v.string(),
      bio: v.optional(v.string()),
      location: v.optional(v.string()),
      website: v.optional(v.string()),
      logoUrl: v.optional(v.string()),
      verified: v.optional(v.boolean()),
      createdByUserId: v.id("users"),
      coverImage: v.optional(v.string()),
    })
      .index("by_creator", ["createdByUserId"])
      .index("by_name", ["name"]),

    companyMembers: defineTable({
      companyId: v.id("companies"),
      userId: v.id("users"),
      roleInCompany: v.string(),
      joinedAt: v.number(),
    })
      .index("by_company", ["companyId"])
      .index("by_user", ["userId"]),

    // ─── Projects ─────────────────────────────────────────────────────
    projects: defineTable({
      creatorId: v.id("users"),
      companyId: v.optional(v.id("companies")),
      title: v.string(),
      playwright: v.optional(v.string()),
      synopsis: v.optional(v.string()),
      projectType: projectTypeValidator,
      venueName: v.optional(v.string()),
      venueCity: v.optional(v.string()),
      venueLat: v.optional(v.number()),
      venueLng: v.optional(v.number()),
      rehearsalStart: v.optional(v.string()),
      firstPreview: v.optional(v.string()),
      closingDate: v.optional(v.string()),
      compensationType: v.optional(compensationTypeValidator),
      unionContract: v.optional(v.string()),
      submissionDeadline: v.optional(v.string()),
      status: v.optional(projectStatusValidator),
      visibility: v.optional(
        v.union(v.literal("public"), v.literal("invite_only"), v.literal("hidden")),
      ),
      imageUrl: v.optional(v.string()),
      videoStorageIds: v.optional(v.array(v.string())),
      createdAt: v.number(),
    })
      .index("by_creator", ["creatorId"])
      .index("by_status", ["status"])
      .index("by_type", ["projectType"])
      .index("by_city", ["venueCity"])
      .index("by_created", ["createdAt"]),

    // ─── Project Roles ────────────────────────────────────────────────
    projectRoles: defineTable({
      projectId: v.id("projects"),
      roleName: v.string(),
      roleType: v.union(v.literal("actor"), v.literal("creative_team")),
      discipline: v.optional(v.string()),
      characterDescription: v.optional(v.string()),
      ageRange: v.optional(v.string()),
      gender: v.optional(v.string()),
      ethnicityNotes: v.optional(v.string()),
      skillsRequired: v.optional(v.array(v.string())),
      vocalRange: v.optional(v.string()),
      filledByActorId: v.optional(v.id("users")),
      status: v.optional(
        v.union(
          v.literal("open"),
          v.literal("under_review"),
          v.literal("offered"),
          v.literal("filled"),
        ),
      ),
    })
      .index("by_project", ["projectId"])
      .index("by_filled", ["filledByActorId"]),

    // ─── Applications ─────────────────────────────────────────────────
    applications: defineTable({
      projectId: v.id("projects"),
      roleId: v.optional(v.id("projectRoles")),
      actorId: v.id("users"),
      message: v.optional(v.string()),
      status: v.optional(applicationStatusValidator),
      appliedAt: v.number(),
    })
      .index("by_project", ["projectId"])
      .index("by_actor", ["actorId"])
      .index("by_role", ["roleId"]),

    // ─── Shortlists ───────────────────────────────────────────────────
    shortlists: defineTable({
      ownerId: v.id("users"),
      name: v.string(),
      targetUserId: v.id("users"),
      projectId: v.optional(v.id("projects")),
      note: v.optional(v.string()),
      createdAt: v.number(),
    })
      .index("by_owner", ["ownerId"])
      .index("by_target", ["targetUserId"]),

    // ─── Inquiries / Messages ─────────────────────────────────────────
    inquiries: defineTable({
      senderId: v.id("users"),
      receiverId: v.id("users"),
      projectId: v.optional(v.id("projects")),
      message: v.string(),
      channel: v.union(v.literal("whatsapp"), v.literal("gmail"), v.literal("in_app")),
      read: v.optional(v.boolean()),
      createdAt: v.number(),
    })
      .index("by_receiver", ["receiverId"])
      .index("by_sender", ["senderId"]),

    // ─── Company Follows ──────────────────────────────────────────────
    companyFollows: defineTable({
      userId: v.id("users"),
      companyId: v.id("companies"),
      createdAt: v.number(),
    })
      .index("by_user", ["userId"])
      .index("by_company", ["companyId"]),

    // ─── Reports ──────────────────────────────────────────────────────
    reports: defineTable({
      reporterId: v.id("users"),
      reportedUserId: v.optional(v.id("users")),
      reportedProjectId: v.optional(v.id("projects")),
      reason: v.string(),
      details: v.optional(v.string()),
      status: v.optional(
        v.union(v.literal("pending"), v.literal("reviewed"), v.literal("resolved")),
      ),
      createdAt: v.number(),
    })
      .index("by_status", ["status"]),
  },
  {
    schemaValidation: false,
  },
);

export default schema;
