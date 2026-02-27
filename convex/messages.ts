import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Send a message
export const sendMessage = mutation({
  args: {
    conversationId: v.id("conversations"),
    senderId: v.id("users"),
    content: v.string(),
  },
  handler: async (ctx, args) => {
    const messageId = await ctx.db.insert("messages", {
      conversationId: args.conversationId,
      senderId: args.senderId,
      content: args.content,
      deleted: false,
      reactions: [],
    });

    // Update conversation's lastMessageId and updatedAt
    await ctx.db.patch(args.conversationId, {
      lastMessageId: messageId,
      updatedAt: Date.now(),
    });

    return messageId;
  },
});

// Get all messages in a conversation (real-time subscription)
export const getMessages = query({
  args: { conversationId: v.id("conversations") },
  handler: async (ctx, args) => {
    const messages = await ctx.db
      .query("messages")
      .withIndex("by_conversationId", (q) =>
        q.eq("conversationId", args.conversationId)
      )
      .order("asc")
      .collect();

    // Hydrate sender info + reaction user names
    const hydrated = await Promise.all(
      messages.map(async (msg) => {
        const sender = await ctx.db.get(msg.senderId);

        // Hydrate reactions with user names
        const hydratedReactions = await Promise.all(
          (msg.reactions ?? []).map(async (r) => {
            const user = await ctx.db.get(r.userId);
            return { ...r, userName: user?.name ?? "Unknown" };
          })
        );

        return { ...msg, sender, reactions: hydratedReactions };
      })
    );

    return hydrated;
  },
});

// Soft delete a message
export const deleteMessage = mutation({
  args: { messageId: v.id("messages") },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.messageId, { deleted: true, content: "" });
  },
});

// Add or remove a reaction
export const toggleReaction = mutation({
  args: {
    messageId: v.id("messages"),
    userId: v.id("users"),
    emoji: v.string(),
  },
  handler: async (ctx, args) => {
    const message = await ctx.db.get(args.messageId);
    if (!message) return;

    const reactions = message.reactions ?? [];
    const existingIndex = reactions.findIndex(
      (r) => r.userId === args.userId && r.emoji === args.emoji
    );

    let updatedReactions;
    if (existingIndex >= 0) {
      // Remove reaction
      updatedReactions = reactions.filter((_, i) => i !== existingIndex);
    } else {
      // Add reaction
      updatedReactions = [...reactions, { userId: args.userId, emoji: args.emoji }];
    }

    await ctx.db.patch(args.messageId, { reactions: updatedReactions });
  },
});