"use client";

import React from "react";
import {
    CheckCircle2,
    Circle,
    MoveHorizontal,
    RotateCw,
    Layers,
    ArrowUpRight,
    ArrowDownRight,
    Info,
    Lock,
    Wrench,
    ArrowUpDown,
    Maximize,
    MinusSquare,
    Target
} from "lucide-react";
import { cn } from "@/lib/utils";

interface ClinicalItem {
    id: number;
    nome: string;
}

interface ClinicalVisualizerProps {
    objetivos?: ClinicalItem[];
    apinhamentos?: ClinicalItem[];
}

/**
 * Mapeia ícones para tipos de apinhamento
 */
const getCrowdingIcon = (option: string) => {
    const text = option.toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "") // Remove acentos
        .trim();

    if (text.includes("diastema")) return <MoveHorizontal className="h-3.5 w-3.5" />;
    if (text.includes("giroversao") || text.includes("giro")) return <RotateCw className="h-3.5 w-3.5" />;
    if (text.includes("apinhamento") || text.includes("apinhado")) return <Layers className="h-3.5 w-3.5" />;
    if (text.includes("vestibularizacao") || text.includes("para fora")) return <ArrowUpRight className="h-3.5 w-3.5" />;
    if (text.includes("lingualizacao") || text.includes("para dentro")) return <ArrowDownRight className="h-3.5 w-3.5" />;
    if (text.includes("cruzada")) return <ArrowUpDown className="h-3.5 w-3.5" />;
    if (text.includes("aberta")) return <Maximize className="h-3.5 w-3.5" />;
    if (text.includes("topo")) return <MinusSquare className="h-3.5 w-3.5" />;

    return <Target className="h-3.5 w-3.5" />; // Ícone de "alvo" como fallback menos genérico que o "i"
};

/**
 * Agrupa itens clínicos pelo prefixo da categoria (antes do " - ")
 */
const groupByCategory = (items: ClinicalItem[]) => {
    return items.reduce((acc, item) => {
        const parts = item.nome.split(" - ");
        const category = parts[0];
        const option = parts.length > 1 ? parts[1] : parts[0];

        if (!acc[category]) {
            acc[category] = [];
        }
        acc[category].push({ id: item.id, option: option.trim() });
        return acc;
    }, {} as Record<string, { id: number; option: string }[]>);
};

export function ClinicalVisualizer({ objetivos = [], apinhamentos = [] }: ClinicalVisualizerProps) {
    // Para Objetivos, como no formulário são rádio botões (Manter/Corrigir), 
    // a lista de objetivos que recebemos já contém APENAS os itens selecionados.
    const groupedObjectives = groupByCategory(objetivos);

    // Para Apinhamento, agrupamos por Superior/Inferior
    const groupedCrowding = groupByCategory(apinhamentos);

    return (
        <div className="space-y-6">
            {/* Seção de Objetivos de Tratamento */}
            {objetivos.length > 0 && (
                <div className="space-y-3">
                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-2">
                        <span className="w-1.5 h-3.5 bg-primary rounded-full ring-2 ring-primary/20" />
                        Objetivos de Tratamento
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                        {Object.entries(groupedObjectives).map(([cat, opts]) => (
                            <div key={cat} className="p-3 rounded-lg border border-border bg-muted/20 flex flex-col gap-2">
                                <span className="text-[11px] font-bold text-foreground/70 uppercase">{cat}</span>
                                <div className="flex items-center gap-3">
                                    {opts.map((opt) => {
                                        const isManter = opt.option.toLowerCase().includes("manter");
                                        const isCorrigir = opt.option.toLowerCase().includes("corrigir");

                                        return (
                                            <div key={opt.id} className="flex items-center gap-1.5">
                                                <div className={cn(
                                                    "w-2.5 h-2.5 rounded-full shadow-sm",
                                                    isManter ? "bg-green-500" : isCorrigir ? "bg-yellow-500" : "bg-primary"
                                                )} />
                                                <span className="text-sm font-semibold text-foreground">{opt.option}</span>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Seção de Apinhamento */}
            {apinhamentos.length > 0 && (
                <div className="space-y-3">
                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-2">
                        <span className="w-1.5 h-3.5 bg-primary rounded-full ring-2 ring-primary/20" />
                        Análise de Apinhamento
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {Object.entries(groupedCrowding).map(([cat, opts]) => (
                            <div key={cat} className="space-y-2">
                                <span className="text-xs font-bold text-foreground border-l-2 border-primary pl-2">{cat}</span>
                                <div className="bg-muted/10 rounded-lg border border-border/50 p-3 flex flex-wrap gap-2">
                                    {opts.map((opt) => (
                                        <div
                                            key={opt.id}
                                            className="px-2.5 py-1.5 bg-background border border-border rounded-md text-xs font-bold text-foreground/80 flex items-center gap-2 shadow-sm hover:border-primary/50 transition-colors group"
                                        >
                                            <span className="text-primary group-hover:scale-110 transition-transform">
                                                {getCrowdingIcon(opt.option)}
                                            </span>
                                            {opt.option}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
