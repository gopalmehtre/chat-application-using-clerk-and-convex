"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import Sidebar from "@/components/chat/Sidebar";
import ChatPanel from "@/components/chat/ChatPanel";
import { Id } from "@/convex/_generated/dataModel";

export default function HomePage() {
  const [selectedConversationId, setSelectedConversationId] =
    useState<Id<"conversations"> | null>(null);
  const [showChat, setShowChat] = useState(false); // for mobile

  const handleSelectConversation = (id: Id<"conversations">) => {
    setSelectedConversationId(id);
    setShowChat(true);
  };

  const handleBack = () => {
    setShowChat(false);
    setSelectedConversationId(null);
  };

  return (
    <div className="flex h-full w-full">
      {/* Sidebar — always visible on desktop, hidden on mobile when chat is open */}
      <div
        className={cn(
          "w-full md:w-80 lg:w-96 border-r border-gray-800 flex-shrink-0",
          showChat ? "hidden md:flex" : "flex"
        )}
      >
        <Sidebar
          selectedConversationId={selectedConversationId}
          onSelectConversation={handleSelectConversation}
        />
      </div>

      {/* Chat Panel */}
      <div
        className={cn(
          "flex-1",
          !showChat ? "hidden md:flex" : "flex"
        )}
      >
        {selectedConversationId ? (
          <ChatPanel
            conversationId={selectedConversationId}
            onBack={handleBack}
          />
        ) : (
          <EmptyState />
        )}
      </div>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center text-gray-500">
      <div className="text-6xl mb-4">💬</div>
      <h2 className="text-xl font-semibold mb-2">Start a conversation</h2>
      <p className="text-sm">Select a user from the sidebar to begin chatting</p>
    </div>
  );
}

