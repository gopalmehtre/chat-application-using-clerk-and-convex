"use client";

import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Trash2, Smile } from "lucide-react";
import { formatMessageTime, cn } from "@/lib/utils";

const REACTION_EMOJIS = ["👍", "❤️", "😂", "😮", "😢"];

interface MessageBubbleProps {
  message: any;
  isOwn: boolean;
  currentUserId?: Id<"users">;
  isGroup?: boolean;
}

export default function MessageBubble({
  message,
  isOwn,
  currentUserId,
  isGroup,
}: MessageBubbleProps) {
  const [showActions, setShowActions] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

  const deleteMessage = useMutation(api.messages.deleteMessage);
  const toggleReaction = useMutation(api.messages.toggleReaction);

  const handleDelete = async () => {
    await deleteMessage({ messageId: message._id });
    setShowActions(false);
  };

  const handleReaction = async (emoji: string) => {
    if (!currentUserId) return;
    await toggleReaction({
      messageId: message._id,
      userId: currentUserId,
      emoji,
    });
    setShowEmojiPicker(false);
  };

  // Group reactions by emoji with user names
  const groupedReactions = (message.reactions ?? []).reduce(
    (acc: Record<string, { count: number; users: string[] }>, r: any) => {
      if (!acc[r.emoji]) {
        acc[r.emoji] = { count: 0, users: [] };
      }
      acc[r.emoji].count += 1;
      acc[r.emoji].users.push(r.userName ?? "Unknown");
      return acc;
    },
    {}
  );

  return (
    <div
      className={cn("flex group mb-1", isOwn ? "justify-end" : "justify-start")}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => {
        setShowActions(false);
        setShowEmojiPicker(false);
      }}
    >
      {/* Avatar for other user */}
      {!isOwn && message.sender && (
        <div className="flex flex-col mr-2 items-center self-end flex-shrink-0">
          <img
            src={
              message.sender.imageUrl ??
              `https://api.dicebear.com/7.x/initials/svg?seed=${message.sender.name}`
            }
            alt={message.sender.name}
            className="w-7 h-7 rounded-full"
          />
        </div>
      )}

      {/* Action buttons — SIDE of message (left for own, right for other) */}
      {isOwn && showActions && !message.deleted && (
        <div className="flex items-center gap-1 mr-1 self-center relative">
          <div className="relative">
            <button
              onClick={() => setShowEmojiPicker((p) => !p)}
              className="p-1.5 hover:bg-gray-700 rounded-lg bg-gray-800 border border-gray-700"
            >
              <Smile size={14} className="text-gray-400" />
            </button>
            {showEmojiPicker && (
              <div className="absolute bottom-full mb-1 right-0 bg-gray-800 border border-gray-700 rounded-lg p-1.5 flex gap-1.5 shadow-xl z-20">
                {REACTION_EMOJIS.map((emoji) => (
                  <button
                    key={emoji}
                    onClick={() => handleReaction(emoji)}
                    className="hover:scale-125 transition-transform text-base"
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            )}
          </div>
          <button
            onClick={handleDelete}
            className="p-1.5 hover:bg-gray-700 rounded-lg bg-gray-800 border border-gray-700"
          >
            <Trash2 size={14} className="text-red-400" />
          </button>
        </div>
      )}

      <div className={cn("max-w-[70%] relative", isOwn && "items-end flex flex-col")}>
        {/* Show sender name in group chats */}
        {!isOwn && isGroup && message.sender && (
          <p className="text-xs text-indigo-400 mb-1 px-1">{message.sender.name}</p>
        )}
        {/* Message bubble */}
        <div
          className={cn(
            "rounded-2xl px-4 py-2 text-sm break-words",
            isOwn
              ? "bg-indigo-600 text-white rounded-br-sm"
              : "bg-gray-800 text-gray-100 rounded-bl-sm",
            message.deleted && "opacity-60 italic"
          )}
        >
          {message.deleted ? "This message was deleted" : message.content}
        </div>

        {/* Timestamp */}
        <span className="text-xs text-gray-500 mt-0.5 px-1">
          {formatMessageTime(message._creationTime)}
        </span>

        {/* Reactions display — BELOW the message */}
        {Object.keys(groupedReactions).length > 0 && (
          <div className="flex gap-1 mt-1 flex-wrap">
            {Object.entries(groupedReactions).map(([emoji, data]) => {
              const { count, users } = data as { count: number; users: string[] };
              return (
                <button
                  key={emoji}
                  onClick={() => handleReaction(emoji)}
                  title={users.join(", ")}
                  className="bg-gray-800 hover:bg-gray-700 rounded-full px-2 py-0.5 text-xs flex items-center gap-1 border border-gray-700 cursor-pointer"
                >
                  {emoji} <span className="text-gray-400">{count}</span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Action buttons for OTHER person's messages — on the right side */}
      {!isOwn && showActions && !message.deleted && (
        <div className="flex items-center gap-1 ml-1 self-center relative">
          <div className="relative">
            <button
              onClick={() => setShowEmojiPicker((p) => !p)}
              className="p-1.5 hover:bg-gray-700 rounded-lg bg-gray-800 border border-gray-700"
            >
              <Smile size={14} className="text-gray-400" />
            </button>
            {showEmojiPicker && (
              <div className="absolute bottom-full mb-1 left-0 bg-gray-800 border border-gray-700 rounded-lg p-1.5 flex gap-1.5 shadow-xl z-20">
                {REACTION_EMOJIS.map((emoji) => (
                  <button
                    key={emoji}
                    onClick={() => handleReaction(emoji)}
                    className="hover:scale-125 transition-transform text-base"
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}