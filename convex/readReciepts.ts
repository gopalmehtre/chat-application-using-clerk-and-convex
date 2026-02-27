import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Mark conversation as read
export const markAsRead = mutation({
  args: {
    conversationId: v.id("conversations"),
    userId: v.id("users"),
    lastReadMessageId: v.id("messages"),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("readReceipts")
      .withIndex("by_user_conversation", (q) =>
        q.eq("userId", args.userId).eq("conversationId", args.conversationId)
      )
      .unique();

    if (existing) {
      await ctx.db.patch(existing._id, {
        lastReadMessageId: args.lastReadMessageId,
      });
    } else {
      await ctx.db.insert("readReceipts", {
        conversationId: args.conversationId,
        userId: args.userId,
        lastReadMessageId: args.lastReadMessageId,
      });
    }
  },
});

// Get unread count for a conversation for a specific user
export const getUnreadCount = query({
  args: {
    conversationId: v.id("conversations"),
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const receipt = await ctx.db
      .query("readReceipts")
      .withIndex("by_user_conversation", (q) =>
        q.eq("userId", args.userId).eq("conversationId", args.conversationId)
      )
      .unique();

    const allMessages = await ctx.db
      .query("messages")
      .withIndex("by_conversationId", (q) =>
        q.eq("conversationId", args.conversationId)
      )
      .collect();

    // Only count messages NOT sent by the current user
    const otherMessages = allMessages.filter((m) => m.senderId !== args.userId);

    if (!receipt || !receipt.lastReadMessageId) {
      return otherMessages.length;
    }

    const lastReadMsg = await ctx.db.get(receipt.lastReadMessageId);
    if (!lastReadMsg) return otherMessages.length;

    const unread = otherMessages.filter(
      (m) => m._creationTime > lastReadMsg._creationTime
    );

    return unread.length;
  },
});