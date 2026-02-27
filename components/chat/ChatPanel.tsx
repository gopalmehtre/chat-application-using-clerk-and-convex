"use client";

import { useRef, useState, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { ArrowLeft, Send, ChevronDown, Users } from "lucide-react";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import MessageBubble from "./MessageBubble";
import TypingIndicator from "./TypingIndicator";
import { cn } from "@/lib/utils";

interface ChatPanelProps {
    conversationId: Id<"conversations">;
    onBack: () => void;
}

export default function ChatPanel({ conversationId, onBack }: ChatPanelProps) {
    const [input, setInput] = useState("");
    const [isAtBottom, setIsAtBottom] = useState(true);
    const [showScrollButton, setShowScrollButton] = useState(false);
    const [sendError, setSendError] = useState<string | null>(null);
    const [failedMessage, setFailedMessage] = useState<string | null>(null);
    const [isSending, setIsSending] = useState(false);
    const [isOnline, setIsOnline] = useState(true); // network status

    const bottomRef = useRef<HTMLDivElement>(null);
    const scrollContainerRef = useRef<HTMLDivElement>(null);
    const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const { currentUser } = useCurrentUser();

    const messages = useQuery(api.messages.getMessages, { conversationId });
    const conversations = useQuery(
        api.conversations.getUserConversations,
        currentUser ? { userId: currentUser._id } : "skip"
    );

    const typingUsers = useQuery(
        api.typing.getTypingUsers,
        currentUser
            ? { conversationId, currentUserId: currentUser._id }
            : "skip"
    );

    const sendMessage = useMutation(api.messages.sendMessage);
    const setTyping = useMutation(api.typing.setTyping);
    const clearTyping = useMutation(api.typing.clearTyping);
    const markAsRead = useMutation(api.readReciepts.markAsRead);

    // Get other participant info
    const conversation = conversations?.find((c) => c._id === conversationId);
    const otherUser = conversation?.otherParticipants?.[0];

    // Auto-scroll to bottom when new messages arrive (if already at bottom)
    useEffect(() => {
        if (isAtBottom) {
            bottomRef.current?.scrollIntoView({ behavior: "smooth" });
        } else {
            setShowScrollButton(true);
        }
    }, [messages]);

    // Detect network online/offline
    useEffect(() => {
        const handleOnline = () => {
            setIsOnline(true);
            setSendError(null);
        };
        const handleOffline = () => {
            setIsOnline(false);
            setSendError("You are offline. Check your internet connection.");
        };

        window.addEventListener("online", handleOnline);
        window.addEventListener("offline", handleOffline);

        // Check initial state
        setIsOnline(navigator.onLine);

        return () => {
            window.removeEventListener("online", handleOnline);
            window.removeEventListener("offline", handleOffline);
        };
    }, []);

    // Mark as read when conversation is opened / new messages arrive
    useEffect(() => {
        if (!currentUser || !messages || messages.length === 0) return;
        const lastMsg = messages[messages.length - 1];
        markAsRead({
            conversationId,
            userId: currentUser._id,
            lastReadMessageId: lastMsg._id,
        });
    }, [messages, currentUser, conversationId, markAsRead]);

    const handleScroll = () => {
        const el = scrollContainerRef.current;
        if (!el) return;
        const distFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
        const atBottom = distFromBottom < 50;
        setIsAtBottom(atBottom);
        if (atBottom) setShowScrollButton(false);
    };

    const scrollToBottom = () => {
        bottomRef.current?.scrollIntoView({ behavior: "smooth" });
        setIsAtBottom(true);
        setShowScrollButton(false);
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setInput(e.target.value);
        if (!currentUser) return;

        setTyping({ conversationId, userId: currentUser._id });

        // Clear typing after 2s of no input
        if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = setTimeout(() => {
            clearTyping({ conversationId, userId: currentUser._id });
        }, 2000);
    };

    const handleSend = async (retryContent?: string) => {
        const content = retryContent ?? input.trim();
        if (!content || !currentUser) return;

        // Block send if offline
        if (!isOnline) {
            setSendError("You are offline. Check your internet connection.");
            return;
        }

        if (!retryContent) setInput("");
        setSendError(null);
        setFailedMessage(null);
        setIsSending(true);

        if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
        clearTyping({ conversationId, userId: currentUser._id });

        try {
            await sendMessage({
                conversationId,
                senderId: currentUser._id,
                content,
            });
        } catch (err) {
            // Restore the failed message content so user can retry
            setFailedMessage(content);
            setSendError("Message failed to send.");
        } finally {
            setIsSending(false);
        }
    };

    const handleRetry = () => {
        if (!failedMessage) return;
        handleSend(failedMessage);
    };

    const handleDismissError = () => {
        setSendError(null);
        setFailedMessage(null);
        if (failedMessage) setInput(failedMessage); // put text back in input
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    return (
        <div className="flex flex-col h-full bg-gray-950 w-full">
            {/* Header */}
            <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-800 bg-gray-900">
                <button onClick={onBack} className="md:hidden p-1 hover:bg-gray-700 rounded">
                    <ArrowLeft size={20} />
                </button>
                {conversation?.isGroup ? (
                    // Group header
                    <>
                        <div className="w-9 h-9 rounded-full bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center flex-shrink-0">
                            <Users size={16} className="text-indigo-400" />
                        </div>
                        <div>
                            <p className="font-semibold text-sm">{conversation.groupName}</p>
                            <p className="text-xs text-gray-400">
                                {conversation.participants?.length} members
                            </p>
                        </div>
                    </>
                ) : (
                    // Direct message header
                    otherUser && (
                        <>
                            <div className="relative">
                                <img
                                    src={
                                        otherUser.imageUrl ??
                                        `https://api.dicebear.com/7.x/initials/svg?seed=${otherUser.name}`
                                    }
                                    alt={otherUser.name}
                                    className="w-9 h-9 rounded-full object-cover"
                                />
                                {otherUser.isOnline && (
                                    <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-gray-900" />
                                )}
                            </div>
                            <div>
                                <p className="font-semibold text-sm">{otherUser.name}</p>
                                <p className="text-xs text-gray-400">
                                    {otherUser.isOnline ? "Online" : "Offline"}
                                </p>
                            </div>
                        </>
                    )
                )}
            </div>

            {/* Messages */}
            <div
                ref={scrollContainerRef}
                onScroll={handleScroll}
                className="flex-1 overflow-y-auto px-4 py-4 space-y-2"
            >
                {messages === undefined ? (
                    // Loading state
                    <div className="flex items-center justify-center h-full">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500" />
                    </div>
                ) : messages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-gray-500">
                        <div className="text-5xl mb-3">👋</div>
                        <p className="text-sm">Say hello!</p>
                    </div>
                ) : (
                    messages.map((msg) => (
                        <MessageBubble
                            key={msg._id}
                            message={msg}
                            isOwn={msg.senderId === currentUser?._id}
                            currentUserId={currentUser?._id}
                            isGroup={conversation?.isGroup}
                        />
                    ))
                )}

                {/* Typing indicator */}
                {typingUsers && typingUsers.length > 0 && (
                    <TypingIndicator users={typingUsers} />
                )}

                <div ref={bottomRef} />
            </div>

            {/* Scroll to bottom button */}
            {showScrollButton && (
                <button
                    onClick={scrollToBottom}
                    className="absolute bottom-20 right-6 bg-indigo-600 hover:bg-indigo-700 text-white p-2 rounded-full shadow-lg transition flex items-center gap-1 text-xs"
                >
                    <ChevronDown size={14} />
                    New messages
                </button>
            )}

            {/* Error Banner */}
            {sendError && (
                <div className="mx-4 mb-2 bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-2.5 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                        <span className="text-red-400 text-sm">⚠️</span>
                        <p className="text-red-400 text-sm">{sendError}</p>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                        {/* Retry button — only show if there's a failed message and we're online */}
                        {failedMessage && isOnline && (
                            <button
                                onClick={handleRetry}
                                disabled={isSending}
                                className="text-xs bg-red-500 hover:bg-red-600 disabled:opacity-50 text-white px-3 py-1 rounded-lg transition"
                            >
                                {isSending ? "Retrying..." : "Retry"}
                            </button>
                        )}
                        {/* Dismiss button */}
                        <button
                            onClick={handleDismissError}
                            className="text-gray-400 hover:text-white text-xs px-2 py-1 hover:bg-gray-700 rounded-lg transition"
                        >
                            Dismiss
                        </button>
                    </div>
                </div>
            )}

            {/* Offline Banner */}
            {!isOnline && (
                <div className="mx-4 mb-2 bg-yellow-500/10 border border-yellow-500/30 rounded-xl px-4 py-2.5 flex items-center gap-2">
                    <span className="text-yellow-400 text-sm">📡</span>
                    <p className="text-yellow-400 text-sm">
                        You are offline. Messages will not send until you reconnect.
                    </p>
                </div>
            )}

            {/* Input */}
            <div className="px-4 py-3 border-t border-gray-800 bg-gray-900">
                <div className="flex items-center gap-2">
                    <input
                        type="text"
                        value={input}
                        onChange={handleInputChange}
                        onKeyDown={handleKeyDown}
                        placeholder={isOnline ? "Type a message..." : "You are offline..."}
                        disabled={!isOnline && !failedMessage}
                        className="flex-1 bg-gray-800 text-sm px-4 py-2.5 rounded-xl outline-none focus:ring-1 focus:ring-indigo-500 placeholder-gray-500 disabled:opacity-50 disabled:cursor-not-allowed"
                    />
                    <button
                        onClick={() => handleSend()}
                        disabled={!input.trim() || isSending || !isOnline}
                        className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed p-2.5 rounded-xl transition relative"
                    >
                        {isSending ? (
                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        ) : (
                            <Send size={16} />
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}