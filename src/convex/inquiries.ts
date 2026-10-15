import { getAuthUserId } from "@convex-dev/auth/server";
import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

export const getMyInquiries = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return { received: [], sent: [] };

    const received = await ctx.db
      .query("inquiries")
      .withIndex("by_receiver", (q) => q.eq("receiverId", userId))
      .order("desc")
      .collect();

    const sent = await ctx.db
      .query("inquiries")
      .withIndex("by_sender", (q) => q.eq("senderId", userId))
      .order("desc")
      .collect();

    const enrich = async (inquiry: {
      senderId: string;
      receiverId: string;
      projectId?: string;
      [key: string]: any;
    }) => {
      const sender = await ctx.db.get(inquiry.senderId as any);
      const receiver = await ctx.db.get(inquiry.receiverId as any);
      const project = inquiry.projectId ? await ctx.db.get(inquiry.projectId as any) : null;
      const senderName = sender && "name" in sender ? sender.name : undefined;
      const receiverName = receiver && "name" in receiver ? receiver.name : undefined;
      const projectName = project && "title" in project ? project.title : undefined;
      return {
        ...inquiry,
        senderName,
        receiverName,
        projectName,
      };
    };

    const receivedEnriched = await Promise.all(received.map(enrich));
    const sentEnriched = await Promise.all(sent.map(enrich));

    return { received: receivedEnriched, sent: sentEnriched };
  },
});

/**
 * Get all unique conversations for the current user.
 * Returns a list of conversation partners with their last message.
 */
export const getConversations = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];

    // Get all messages sent or received by this user
    const sent = await ctx.db
      .query("inquiries")
      .withIndex("by_sender", (q) => q.eq("senderId", userId))
      .order("desc")
      .collect();

    const received = await ctx.db
      .query("inquiries")
      .withIndex("by_receiver", (q) => q.eq("receiverId", userId))
      .order("desc")
      .collect();

    // Build conversation map: otherUserId -> latest message
    const conversations = new Map<string, {
      otherUserId: string;
      otherUserName: string;
      lastMessage: string;
      lastMessageTime: number;
      unreadCount: number;
      channel: string;
    }>();

    const processMessages = (messages: any[], direction: "sent" | "received") => {
      for (const msg of messages) {
        const otherUserId = direction === "sent" ? msg.receiverId : msg.senderId;
        const existing = conversations.get(otherUserId);
        const time = msg.createdAt;

        if (!existing || time > existing.lastMessageTime) {
          conversations.set(otherUserId, {
            otherUserId,
            otherUserName: "", // will be resolved below
            lastMessage: msg.message,
            lastMessageTime: time,
            unreadCount: direction === "received" && !msg.read ? 1 : 0,
            channel: msg.channel,
          });
        } else if (direction === "received" && !msg.read) {
          existing.unreadCount++;
        }
      }
    };

    processMessages(sent, "sent");
    processMessages(received, "received");

    // Resolve names
    const result = [];
    for (const [otherUserId, convo] of conversations) {
      const otherUser = await ctx.db.get(otherUserId as any);
      result.push({
        ...convo,
        otherUserName: otherUser && "name" in otherUser ? (otherUser.name as string) ?? "Unknown" : "Unknown",
      });
    }

    // Sort by most recent message
    result.sort((a, b) => b.lastMessageTime - a.lastMessageTime);
    return result;
  },
});

/**
 * Get all messages between the current user and another user (real-time chat thread).
 */
export const getConversation = query({
  args: {
    otherUserId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];

    // Get all messages between these two users
    const sent = await ctx.db
      .query("inquiries")
      .withIndex("by_sender", (q) => q.eq("senderId", userId))
      .order("asc")
      .collect();

    const received = await ctx.db
      .query("inquiries")
      .withIndex("by_sender", (q) => q.eq("senderId", args.otherUserId))
      .order("asc")
      .collect();

    // Filter to only messages between these two users
    const messages = [
      ...sent.filter((m) => m.receiverId === args.otherUserId),
      ...received.filter((m) => m.receiverId === userId),
    ].sort((a, b) => a.createdAt - b.createdAt);

    // Resolve names
    const otherUser = await ctx.db.get(args.otherUserId);
    const otherUserName = otherUser && "name" in otherUser ? (otherUser.name as string) ?? "Unknown" : "Unknown";

    return messages.map((m) => ({
      ...m,
      isMine: m.senderId === userId,
      senderName: m.senderId === userId ? "You" : otherUserName,
    }));
  },
});

/**
 * Send an in-app message.
 */
export const sendMessage = mutation({
  args: {
    receiverId: v.id("users"),
    message: v.string(),
    projectId: v.optional(v.id("projects")),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    return await ctx.db.insert("inquiries", {
      senderId: userId,
      receiverId: args.receiverId,
      projectId: args.projectId,
      message: args.message,
      channel: "in_app",
      read: false,
      createdAt: Date.now(),
    });
  },
});

export const sendInquiry = mutation({
  args: {
    receiverId: v.id("users"),
    projectId: v.optional(v.id("projects")),
    message: v.string(),
    channel: v.union(v.literal("whatsapp"), v.literal("gmail"), v.literal("in_app")),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    return await ctx.db.insert("inquiries", {
      senderId: userId,
      ...args,
      read: false,
      createdAt: Date.now(),
    });
  },
});

export const markRead = mutation({
  args: { inquiryId: v.id("inquiries") },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.inquiryId, { read: true });
  },
});

/**
 * Mark all messages from a specific sender as read.
 */
export const markConversationRead = mutation({
  args: { otherUserId: v.id("users") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const unread = await ctx.db
      .query("inquiries")
      .withIndex("by_receiver", (q) => q.eq("receiverId", userId))
      .collect();

    for (const msg of unread) {
      if (msg.senderId === args.otherUserId && !msg.read) {
        await ctx.db.patch(msg._id, { read: true });
      }
    }
  },
});
