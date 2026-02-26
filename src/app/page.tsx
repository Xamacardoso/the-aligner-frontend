"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    // For now we will mock the redirect to the gerente screen
    // Later when Clerk is added, this will check the role from user metadata
    router.replace("/gerente/dentistas");
  }, [router]);

  return (
    <div className="flex bg-secondary min-h-screen items-center justify-center">
      <div className="animate-pulse flex flex-col items-center">
        <div className="w-12 h-12 rounded-full bg-primary mb-4"></div>
        <p className="text-muted-foreground font-medium text-sm">Carregando Align Dental...</p>
      </div>
    </div>
  );
}
