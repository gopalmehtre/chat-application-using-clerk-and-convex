"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { useUser } from "@clerk/nextjs";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Search, MessageSquarePlus, LogOut, Users } from "lucide-react";
import { useClerk } from "@clerk/nextjs";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import ConversationItem from "./ConversationItem";
import UserItem from "./UserItem";
import CreateGroupModal from "./CreateGroupModal";
import { cn } from "@/lib/utils";

interface SidebarProps {
  selectedConversationId: Id<"conversations"> | null;
  onSelectConversation: (id: Id<"conversations">) => void;
}

export default function Sidebar({
  selectedConversationId,
  onSelectConversation,
}: SidebarProps) {
  const [search, setSearch] = useState("");
  const [showUsers, setShowUsers] = useState(false);
  const [showGroupModal, setShowGroupModal] = useState(false); // NEW

  const { user } = useUser();
  const { signOut } = useClerk();
  const { currentUser } = useCurrentUser();

  const allUsers = useQuery(
    api.users.getAllUsers,
    user?.id ? { clerkId: user.id } : "skip"
  );

  const conversations = useQuery(
    api.conversations.getUserConversations,
    currentUser ? { userId: currentUser._id } : "skip"
  );

  const getOrCreateConversation = useMutation(
    api.conversations.getOrCreateConversation
  );

  const filteredUsers = allUsers?.filter((u) =>
    u.name.toLowerCase().includes(search.toLowerCase())
  );

  const handleUserClick = async (otherUserId: Id<"users">) => {
    if (!currentUser) return;
    const convId = await getOrCreateConversation({
      currentUserId: currentUser._id,
      otherUserId,
    });
    onSelectConversation(convId);
    setShowUsers(false);
    setSearch("");
  };

  const handleGroupCreated = (id: Id<"conversations">) => {
    onSelectConversation(id);
  };

  return (
    <div className="flex flex-col h-full bg-gray-900 w-full">
      {/* Header */}
      <div className="p-4 border-b border-gray-800">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            {currentUser?.imageUrl && (
              <img
                src={currentUser.imageUrl}
                alt={currentUser.name}
                className="w-8 h-8 rounded-full"
              />
            )}
            <span className="font-semibold text-sm">{currentUser?.name}</span>
          </div>
          <div className="flex gap-1">
            {/* New direct message */}
            <button
              onClick={() => { setShowUsers((p) => !p); setSearch(""); }}
              className={cn(
                "p-2 hover:bg-gray-700 rounded-lg transition",
                showUsers && "bg-gray-700"
              )}
              title="New conversation"
            >
              <MessageSquarePlus size={17} />
            </button>
            {/* New group */}
            <button
              onClick={() => setShowGroupModal(true)}
              className="p-2 hover:bg-gray-700 rounded-lg transition"
              title="New group"
            >
              <Users size={17} />
            </button>
            {/* Sign out */}
            <button
              onClick={() => signOut()}
              className="p-2 hover:bg-gray-700 rounded-lg transition"
              title="Sign out"
            >
              <LogOut size={17} />
            </button>
          </div>
        </div>

        {/* Search */}
        <div className="relative">
          <Search
            size={13}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
          />
          <input
            type="text"
            placeholder={showUsers ? "Search users..." : "Search conversations..."}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-gray-800 text-sm pl-8 pr-3 py-2 rounded-lg outline-none focus:ring-1 focus:ring-indigo-500 placeholder-gray-500"
          />
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {showUsers ? (
          <div>
            <p className="text-xs text-gray-500 px-4 pt-3 pb-1 uppercase tracking-wider">
              All Users
            </p>
            {filteredUsers?.length === 0 ? (
              <p className="text-center text-gray-500 text-sm py-8">
                No users found
              </p>
            ) : (
              filteredUsers?.map((u) => (
                <UserItem
                  key={u._id}
                  user={u}
                  onClick={() => handleUserClick(u._id)}
                />
              ))
            )}
          </div>
        ) : (
          <div>
            {conversations === undefined ? (
              Array.from({ length: 4 }).map((_, i) => (
                <ConversationSkeleton key={i} />
              ))
            ) : conversations.length === 0 ? (
              <div className="text-center text-gray-500 py-12 px-4">
                <div className="text-4xl mb-3">👋</div>
                <p className="text-sm">No conversations yet</p>
                <p className="text-xs mt-1 text-gray-600">
                  Click + to start chatting or create a group
                </p>
              </div>
            ) : (
              conversations.map((convo) => (
                <ConversationItem
                  key={convo._id}
                  conversation={convo}
                  isSelected={convo._id === selectedConversationId}
                  currentUserId={currentUser!._id}
                  onClick={() => onSelectConversation(convo._id)}
                />
              ))
            )}
          </div>
        )}
      </div>

      {/* Group Modal */}
      {showGroupModal && (
        <CreateGroupModal
          onClose={() => setShowGroupModal(false)}
          onGroupCreated={handleGroupCreated}
        />
      )}
    </div>
  );
}

function ConversationSkeleton() {
  return (
    <div className="flex items-center gap-3 px-4 py-3 animate-pulse">
      <div className="w-10 h-10 rounded-full bg-gray-700" />
      <div className="flex-1 space-y-2">
        <div className="h-3 bg-gray-700 rounded w-1/2" />
        <div className="h-2 bg-gray-700 rounded w-3/4" />
      </div>
    </div>
  );
}