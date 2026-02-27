"use client";

import { useOnlineStatus } from "@/hooks/useOnlineStatus";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { useAuth } from "@clerk/nextjs";

export default function MainLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    useOnlineStatus();
    const { currentUser, isLoaded } = useCurrentUser();
    const { isSignedIn, isLoaded: clerkLoaded } = useAuth();

    // Show loading spinner while Clerk or Convex are initializing
    if (!clerkLoaded || !isLoaded) {
        return (
            <div className="h-screen flex items-center justify-center bg-gray-950">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-500" />
            </div>
        );
    }

    // Don't redirect here — the middleware handles auth redirects.
    // Just show loading until currentUser is available from Convex.
    if (isSignedIn && !currentUser) {
        return (
            <div className="h-screen flex items-center justify-center bg-gray-950">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-500" />
            </div>
        );
    }

    return <div className="h-screen flex overflow-hidden">{children}</div>;
}