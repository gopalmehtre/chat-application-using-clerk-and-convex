"use client";

import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { useUser } from "@clerk/nextjs";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { X, Search, Check, Users } from "lucide-react";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { cn } from "@/lib/utils";

interface CreateGroupModalProps {
    onClose: () => void;
    onGroupCreated: (id: Id<"conversations">) => void;
}

export default function CreateGroupModal({
    onClose,
    onGroupCreated,
}: CreateGroupModalProps) {
    const [groupName, setGroupName] = useState("");
    const [search, setSearch] = useState("");
    const [selectedIds, setSelectedIds] = useState<Id<"users">[]>([]);
    const [isCreating, setIsCreating] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const { user } = useUser();
    const { currentUser } = useCurrentUser();

    const allUsers = useQuery(
        api.users.getAllUsers,
        user?.id ? { clerkId: user.id } : "skip"
    );

    const createGroup = useMutation(api.conversations.createGroupConversation);

    const filteredUsers = allUsers?.filter((u) =>
        u.name.toLowerCase().includes(search.toLowerCase())
    );

    const toggleUser = (userId: Id<"users">) => {
        setSelectedIds((prev) =>
            prev.includes(userId)
                ? prev.filter((id) => id !== userId)
                : [...prev, userId]
        );
    };

    const handleCreate = async () => {
        if (!currentUser) return;

        if (!groupName.trim()) {
            setError("Please enter a group name");
            return;
        }

        if (selectedIds.length < 2) {
            setError("Please select at least 2 members");
            return;
        }

        setIsCreating(true);
        setError(null);

        try {
            const conversationId = await createGroup({
                currentUserId: currentUser._id,
                memberIds: selectedIds,
                groupName: groupName.trim(),
            });
            onGroupCreated(conversationId);
            onClose();
        } catch (err) {
            setError("Failed to create group. Please try again.");
        } finally {
            setIsCreating(false);
        }
    };

    return (
        // Backdrop
        <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={(e) => e.target === e.currentTarget && onClose()}
        >
            <div className="bg-gray-900 border border-gray-700 rounded-2xl w-full max-w-md shadow-2xl">

                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-gray-800">
                    <div className="flex items-center gap-2">
                        <Users size={18} className="text-indigo-400" />
                        <h2 className="font-semibold">Create Group</h2>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-1.5 hover:bg-gray-700 rounded-lg transition"
                    >
                        <X size={16} />
                    </button>
                </div>

                <div className="p-4 space-y-4">

                    {/* Group Name Input */}
                    <div>
                        <label className="text-xs text-gray-400 mb-1.5 block">
                            Group Name
                        </label>
                        <input
                            type="text"
                            value={groupName}
                            onChange={(e) => setGroupName(e.target.value)}
                            placeholder="e.g. Project Team, Friends..."
                            className="w-full bg-gray-800 text-sm px-4 py-2.5 rounded-xl outline-none focus:ring-1 focus:ring-indigo-500 placeholder-gray-500"
                        />
                    </div>

                    {/* Selected members preview */}
                    {selectedIds.length > 0 && (
                        <div>
                            <label className="text-xs text-gray-400 mb-1.5 block">
                                Selected ({selectedIds.length})
                            </label>
                            <div className="flex flex-wrap gap-2">
                                {selectedIds.map((id) => {
                                    const u = allUsers?.find((u) => u._id === id);
                                    if (!u) return null;
                                    return (
                                        <div
                                            key={id}
                                            className="flex items-center gap-1.5 bg-indigo-500/20 border border-indigo-500/30 rounded-full pl-1 pr-2 py-0.5"
                                        >
                                            <img
                                                src={
                                                    u.imageUrl ??
                                                    `https://api.dicebear.com/7.x/initials/svg?seed=${u.name}`
                                                }
                                                alt={u.name}
                                                className="w-5 h-5 rounded-full"
                                            />
                                            <span className="text-xs text-indigo-300">{u.name}</span>
                                            <button
                                                onClick={() => toggleUser(id)}
                                                className="text-indigo-400 hover:text-white ml-0.5"
                                            >
                                                <X size={10} />
                                            </button>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {/* Search users */}
                    <div>
                        <label className="text-xs text-gray-400 mb-1.5 block">
                            Add Members
                        </label>
                        <div className="relative mb-2">
                            <Search
                                size={13}
                                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                            />
                            <input
                                type="text"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder="Search users..."
                                className="w-full bg-gray-800 text-sm pl-8 pr-3 py-2 rounded-xl outline-none focus:ring-1 focus:ring-indigo-500 placeholder-gray-500"
                            />
                        </div>

                        {/* User list */}
                        <div className="max-h-48 overflow-y-auto space-y-1 rounded-xl">
                            {filteredUsers?.length === 0 ? (
                                <p className="text-center text-gray-500 text-sm py-4">
                                    No users found
                                </p>
                            ) : (
                                filteredUsers?.map((u) => {
                                    const isSelected = selectedIds.includes(u._id);
                                    return (
                                        <button
                                            key={u._id}
                                            onClick={() => toggleUser(u._id)}
                                            className={cn(
                                                "w-full flex items-center gap-3 px-3 py-2 rounded-xl transition text-left",
                                                isSelected
                                                    ? "bg-indigo-500/20 border border-indigo-500/30"
                                                    : "hover:bg-gray-800"
                                            )}
                                        >
                                            <div className="relative flex-shrink-0">
                                                <img
                                                    src={
                                                        u.imageUrl ??
                                                        `https://api.dicebear.com/7.x/initials/svg?seed=${u.name}`
                                                    }
                                                    alt={u.name}
                                                    className="w-8 h-8 rounded-full object-cover"
                                                />
                                                {u.isOnline && (
                                                    <span className="absolute bottom-0 right-0 w-2 h-2 bg-green-500 rounded-full border border-gray-900" />
                                                )}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-medium truncate">{u.name}</p>
                                                <p className="text-xs text-gray-500 truncate">
                                                    {u.email}
                                                </p>
                                            </div>
                                            {/* Checkmark */}
                                            <div
                                                className={cn(
                                                    "w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition",
                                                    isSelected
                                                        ? "bg-indigo-500 border-indigo-500"
                                                        : "border-gray-600"
                                                )}
                                            >
                                                {isSelected && <Check size={11} className="text-white" />}
                                            </div>
                                        </button>
                                    );
                                })
                            )}
                        </div>
                    </div>

                    {/* Error message */}
                    {error && (
                        <p className="text-red-400 text-xs flex items-center gap-1">
                            ⚠️ {error}
                        </p>
                    )}

                    {/* Create button */}
                    <button
                        onClick={handleCreate}
                        disabled={isCreating || !groupName.trim() || selectedIds.length < 2}
                        className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white py-2.5 rounded-xl font-medium text-sm transition flex items-center justify-center gap-2"
                    >
                        {isCreating ? (
                            <>
                                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                Creating...
                            </>
                        ) : (
                            <>
                                <Users size={15} />
                                Create Group
                                {selectedIds.length >= 2 && (
                                    <span className="bg-indigo-500 rounded-full px-1.5 py-0.5 text-xs">
                                        {selectedIds.length + 1} members
                                    </span>
                                )}
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}
