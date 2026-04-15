"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";


export default function Home() {
  const { data: session, status } = useSession();
  const [isShown, setIsShown] = useState(false);

  useEffect(() => {
    if (status === "unauthenticated") {
      setIsShown(true);
    } else if (status === "authenticated") {
      setIsShown(false);
    }
  }, [status]);


  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground font-sans transition-colors duration-500 overflow-hidden">
      {/* Background Decorative Elements */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <div className="absolute top-[10%] left-[10%] w-[50%] h-[50%] bg-blue-500/5 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute bottom-[10%] right-[10%] w-[50%] h-[50%] bg-purple-500/5 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: '2s' }} />
      </div>

      {/* Hero Section */}
      <main className="relative z-10 flex-1 flex flex-col items-center justify-center px-6 max-w-7xl mx-auto w-full text-center py-20">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800/50 mb-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
          </span>
          <span className="text-xs font-bold uppercase tracking-wider text-blue-700 dark:text-blue-400">Next-Gen Document Intelligence</span>
        </div>

        <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight text-zinc-900 dark:text-zinc-50 mb-8 max-w-4xl leading-[1.1] animate-in fade-in slide-in-from-bottom-8 duration-700 delay-100">
          Stop Searching. <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">Start Conversing.</span>
        </h1>

        <p className="text-xl text-zinc-500 dark:text-zinc-400 mb-12 max-w-2xl mx-auto leading-relaxed animate-in fade-in slide-in-from-bottom-8 duration-700 delay-200">
          Decrease your time searching for answers in endless PDF pages. Upload your documents, and let our AI answer anything instantly through a natural chat interface.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 w-full animate-in fade-in slide-in-from-bottom-8 duration-700 delay-300">
          {isShown ? (
            <Link href="/login" className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-2xl text-lg font-bold transition-all duration-200 shadow-xl shadow-blue-500/25 flex items-center justify-center gap-2 group active:scale-95">
              Try it for Free
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-5 h-5 group-hover:translate-x-1 transition-transform">
                <path d="M5 12h14m-7-7 7 7-7 7" />
              </svg>
            </Link>
          ):(
            <Link href="/dashboard" className="w-full sm:w-auto bg-gray-300 hover:bg-gray-400 text-gray-800 px-8 py-4 rounded-2xl text-lg font-bold transition-all duration-200 shadow-md flex items-center justify-center gap-2 group active:scale-95">
              Go to Dashboard
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-5 h-5 group-hover:translate-x-1 transition-transform">
                <path d="M5 12h14m-7-7 7 7-7 7" />
              </svg>
            </Link>
          )}
          <a href="#how-it-works" className="w-full sm:w-auto px-8 py-4 rounded-2xl text-lg font-semibold text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-200 hover:bg-white/50 dark:hover:bg-white/5 transition-all duration-200">
            How it works
          </a>
        </div>

        {/* Floating Preview Elements */}
        <div className="mt-24 relative w-full max-w-5xl mx-auto animate-in zoom-in-95 duration-1000 delay-500">
          <div className="bg-white/40 dark:bg-zinc-900/40 backdrop-blur-3xl border border-zinc-200/50 dark:border-zinc-800/50 rounded-3xl p-4 shadow-2xl relative">
            <div className="absolute inset-0 bg-gradient-to-tr from-blue-500/5 to-purple-500/5 rounded-3xl" />
            <div className="relative overflow-hidden rounded-2xl shadow-inner border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 aspect-[16/9] flex items-center justify-center group">
               <div className="flex flex-col items-center gap-4 text-center p-8">
                  <div className="w-20 h-20 bg-blue-50 dark:bg-blue-900/20 rounded-full flex items-center justify-center text-blue-600 group-hover:scale-110 transition-transform duration-500">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-10 h-10">
                      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-bold dark:text-zinc-50">Enterprise Grade Security</h3>
                  <p className="text-zinc-500 max-w-md">Your documents are processed with the highest security standards, ensuring complete privacy and isolation.</p>
               </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer Branding */}
      <footer className="relative z-10 py-12 border-t border-zinc-100 dark:border-zinc-900 text-center">
        <p className="text-xs text-zinc-400 uppercase tracking-[0.2em] font-bold">
          Secure AI Cloud Infrastructure
        </p>
      </footer>
    </div>
  );
}
