"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    // Redireciona para a tela inicial do sistema
    // O middleware cuidará da proteção de rotas
    router.replace("/gerente/dentistas");
  }, [router]);

  return (
    <div className="flex bg-secondary min-h-screen items-center justify-center">
      <div className="animate-pulse flex flex-col items-center">
        <div className="w-12 h-12 rounded-full bg-primary mb-4"></div>
        <p className="text-muted-foreground font-medium text-sm">Carregando TheAligner...</p>
      </div>
    </div>
  );
}
