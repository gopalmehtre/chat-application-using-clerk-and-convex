"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { cn, formatMessageTime } from "@/lib/utils";

interface ConversationItemProps {
    conversation: any;
    isSelected: boolean;
    currentUserId: Id<"users">;
    onClick: () => void;
}

export default function ConversationItem({
    conversation,
    isSelected,
    currentUserId,
    onClick,
}: ConversationItemProps) {
    const otherUser = conversation.otherParticipants?.[0];

    const unreadCount = useQuery(api.readReciepts.getUnreadCount, {
        conversationId: conversation._id,
        userId: currentUserId,
    });

    if (!otherUser) return null;

    return (
        <button
            onClick={onClick}
            className={cn(
                "w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-800 transition text-left",
                isSelected && "bg-gray-800"
            )}
        >
            {/* Avatar with online indicator */}
            <div className="relative flex-shrink-0">
                <img
                    src={otherUser.imageUrl ?? `https://api.dicebear.com/7.x/initials/svg?seed=${otherUser.name}`}
                    alt={otherUser.name}
                    className="w-10 h-10 rounded-full object-cover"
                />
                {otherUser.isOnline && (
                    <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-gray-900" />
                )}
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                    <span className="text-sm font-medium truncate">{otherUser.name}</span>
                    {conversation.lastMessage && (
                        <span className="text-xs text-gray-500 ml-2 flex-shrink-0">
                            {formatMessageTime(conversation.lastMessage._creationTime)}
                        </span>
                    )}
                </div>
                <div className="flex items-center justify-between mt-0.5">
                    <p className="text-xs text-gray-400 truncate">
                        {conversation.lastMessage
                            ? conversation.lastMessage.deleted
                                ? "This message was deleted"
                                : conversation.lastMessage.content
                            : "No messages yet"}
                    </p>
                    {unreadCount != null && unreadCount > 0 && (
                        <span className="ml-2 bg-indigo-500 text-white text-xs rounded-full px-1.5 py-0.5 flex-shrink-0">
                            {unreadCount > 99 ? "99+" : unreadCount}
                        </span>
                    )}
                </div>
            </div>
        </button>
    );
}