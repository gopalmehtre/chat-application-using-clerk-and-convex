import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Get or create a 1-on-1 conversation between two users
export const getOrCreateConversation = mutation({
  args: {
    currentUserId: v.id("users"),
    otherUserId: v.id("users"),
  },
  handler: async (ctx, args) => {
    // Find existing conversation with both participants
    const allConversations = await ctx.db
      .query("conversations")
      .collect();

    const existing = allConversations.find(
      (c) =>
        !c.isGroup &&
        c.participants.includes(args.currentUserId) &&
        c.participants.includes(args.otherUserId) &&
        c.participants.length === 2
    );

    if (existing) return existing._id;

    return await ctx.db.insert("conversations", {
      participants: [args.currentUserId, args.otherUserId],
      isGroup: false,
      updatedAt: Date.now(),
    });
  },
});

// ADD THIS — Create a group conversation
export const createGroupConversation = mutation({
  args: {
    currentUserId: v.id("users"),
    memberIds: v.array(v.id("users")),
    groupName: v.string(),
  },
  handler: async (ctx, args) => {
    if (args.memberIds.length < 2) {
      throw new Error("Group must have at least 2 other members");
    }

    const allParticipants = [args.currentUserId, ...args.memberIds];

    const conversationId = await ctx.db.insert("conversations", {
      participants: allParticipants,
      isGroup: true,
      groupName: args.groupName,
      updatedAt: Date.now(),
    });

    return conversationId;
  },
});

// Get all conversations for a user
export const getUserConversations = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const allConversations = await ctx.db
      .query("conversations")
      .order("desc")
      .collect();

    const userConversations = allConversations.filter((c) =>
      c.participants.includes(args.userId)
    );

    // Hydrate with participant info and last message
    const hydrated = await Promise.all(
      userConversations.map(async (convo) => {
        const otherParticipantIds = convo.participants.filter(
          (p) => p !== args.userId
        );

        const participants = await Promise.all(
          otherParticipantIds.map((id) => ctx.db.get(id))
        );

        const lastMessage = convo.lastMessageId
          ? await ctx.db.get(convo.lastMessageId)
          : null;

        return {
          ...convo,
          otherParticipants: participants.filter(Boolean),
          lastMessage,
        };
      })
    );

    return hydrated.sort((a, b) => b.updatedAt - a.updatedAt);
  },
});