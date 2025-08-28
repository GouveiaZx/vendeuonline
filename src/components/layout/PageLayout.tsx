'use client';

import { HydrationProvider } from "@/providers/HydrationProvider";
import StoreHydration from "@/components/StoreHydration";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { Toaster } from "sonner";

interface PageLayoutProps {
  children: React.ReactNode;
}

/**
 * Layout principal para páginas que contém navbar, footer e providers
 * Usado como wrapper client-side para evitar problemas de SSR
 */
export const PageLayout = ({ children }: PageLayoutProps) => {
  return (
    <HydrationProvider>
      <StoreHydration />
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-1">
          {children}
        </main>
        <Footer />
      </div>
      <Toaster position="top-right" richColors />
    </HydrationProvider>
  );
};