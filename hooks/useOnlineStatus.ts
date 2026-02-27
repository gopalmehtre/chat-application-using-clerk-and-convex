"use client";

import { useUser } from "@clerk/nextjs";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useEffect } from "react";

export function useOnlineStatus() {
  const { user } = useUser();
  const setOnlineStatus = useMutation(api.users.setOnlineStatus);

  useEffect(() => {
    if (!user?.id) return;

    // Set online when app opens
    setOnlineStatus({ clerkId: user.id, isOnline: true });

    // Set offline when tab/window closes
    const handleOffline = () => {
      setOnlineStatus({ clerkId: user.id, isOnline: false });
    };

    window.addEventListener("beforeunload", handleOffline);
    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "hidden") {
        setOnlineStatus({ clerkId: user.id, isOnline: false });
      } else {
        setOnlineStatus({ clerkId: user.id, isOnline: true });
      }
    });

    return () => {
      window.removeEventListener("beforeunload", handleOffline);
    };
  }, [user?.id, setOnlineStatus]);
}