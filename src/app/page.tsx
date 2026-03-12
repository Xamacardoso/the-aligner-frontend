"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";

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
        <div className="relative w-14 h-14 mb-4">
          <Image src="/thealign_logo2.jpeg" alt="Logo" fill className="object-contain" />
        </div>
        <p className="text-muted-foreground font-medium text-sm">Carregando TheAligner...</p>
      </div>
    </div>
  );
}
