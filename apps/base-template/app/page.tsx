'use client';

import { useSession } from 'next-auth/react';
import { Bubble, Hero } from "@chat/ui";
import AppLauncher from './components/AppLauncher';

export default function Home() {
  const { data: session, status } = useSession();

  if (status === 'loading') {
    return (
      <div className="w-full flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  // Redirect authenticated users to the home page
  if (session?.user) {
    window.location.href = '/home';
    return null;
  }

  // Show original hero/bubble for unauthenticated users
  return (
    <div className="w-full flex items-center justify-center overflow-hidden relative">
      <Hero />
      <Bubble />
    </div>
  );
}
