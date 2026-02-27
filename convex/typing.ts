import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Set typing status
export const setTyping = mutation({
  args: {
    conversationId: v.id("conversations"),
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("typingIndicators")
      .withIndex("by_user_conversation", (q) =>
        q.eq("userId", args.userId).eq("conversationId", args.conversationId)
      )
      .unique();

    if (existing) {
      await ctx.db.patch(existing._id, { updatedAt: Date.now() });
    } else {
      await ctx.db.insert("typingIndicators", {
        conversationId: args.conversationId,
        userId: args.userId,
        updatedAt: Date.now(),
      });
    }
  },
});

// Clear typing status
export const clearTyping = mutation({
  args: {
    conversationId: v.id("conversations"),
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("typingIndicators")
      .withIndex("by_user_conversation", (q) =>
        q.eq("userId", args.userId).eq("conversationId", args.conversationId)
      )
      .unique();
    if (existing) await ctx.db.delete(existing._id);
  },
});

// Get who is currently typing in a conversation (exclude self)
export const getTypingUsers = query({
  args: {
    conversationId: v.id("conversations"),
    currentUserId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const TWO_SECONDS = 2000;
    const indicators = await ctx.db
      .query("typingIndicators")
      .withIndex("by_conversation", (q) =>
        q.eq("conversationId", args.conversationId)
      )
      .collect();

    const active = indicators.filter(
      (i) =>
        i.userId !== args.currentUserId &&
        Date.now() - i.updatedAt < TWO_SECONDS
    );

    const hydrated = await Promise.all(
      active.map(async (i) => {
        const user = await ctx.db.get(i.userId);
        return user;
      })
    );

    return hydrated.filter(Boolean);
  },
});