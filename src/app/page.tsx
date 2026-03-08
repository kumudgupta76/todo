"use client";

import { useAuth } from "@/lib/auth-context";
import { AuthPage } from "@/components/auth-page";
import { TaskBuddyApp } from "@/components/task-buddy-app";
import { Loader2 } from "lucide-react";

export default function Home() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[hsl(var(--primary))]" />
      </div>
    );
  }

  if (!user) {
    return <AuthPage />;
  }

  return <TaskBuddyApp />;
}
