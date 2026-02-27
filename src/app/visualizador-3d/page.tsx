"use client"

import { useSearchParams, useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import { ArrowLeft, Box, Download, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Suspense } from 'react';

// Dynamically import the viewer to avoid SSR issues with Three.js
const STLViewer = dynamic(() => import('@/components/STLViewer'), {
    ssr: false,
    loading: () => (
        <div className="w-full h-full flex flex-col items-center justify-center bg-slate-900 text-slate-400 gap-4">
            <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
            <p className="text-sm font-medium animate-pulse">Carregando Modelo 3D...</p>
        </div>
    )
});

function Visualizador3DContent() {
    const searchParams = useSearchParams();
    const router = useRouter();

    const url = searchParams.get('url');
    const name = searchParams.get('name') || 'Modelo 3D';

    const handleBack = () => {
        if (typeof window !== 'undefined' && window.history.length > 1) {
            router.back();
        } else {
            window.close();
        }
    };

    if (!url) {
        return (
            <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 text-center">
                <div className="bg-slate-900 p-8 rounded-2xl border border-slate-800 shadow-2xl max-w-md">
                    <Box className="h-12 w-12 text-slate-700 mx-auto mb-4" />
                    <h1 className="text-xl font-bold text-white mb-2">Ops! Nenhum modelo selecionado</h1>
                    <p className="text-slate-400 text-sm mb-6">Não conseguimos encontrar o caminho do arquivo STL para visualização.</p>
                    <Button onClick={() => router.back()} className="w-full">Voltar</Button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-950 flex flex-col text-slate-100 font-sans">
            {/* Header */}
            <header className="h-16 px-6 border-b border-slate-800 flex items-center justify-between bg-slate-950/50 backdrop-blur-md sticky top-0 z-10">
                <div className="flex items-center gap-4">
                    <button
                        onClick={handleBack}
                        className="p-2 hover:bg-slate-800 rounded-lg transition-colors text-slate-400 hover:text-white"
                        title="Voltar"
                    >
                        <ArrowLeft className="h-5 w-5" />
                    </button>
                    <div>
                        <h1 className="text-sm font-semibold truncate max-w-[150px] md:max-w-md" title={name}>
                            {name}
                        </h1>
                        <p className="text-[10px] text-slate-500 uppercase tracking-wider font-bold">Visualizador 3D</p>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <Button
                        variant="default"
                        size="sm"
                        className="gap-2 px-4 shadow-lg shadow-primary/20 font-semibold"
                        onClick={() => window.open(url, '_blank')}
                    >
                        <Download className="h-4 w-4" />
                        <span className="hidden sm:inline">Baixar Modelo 3D</span>
                        <span className="sm:hidden">Baixar</span>
                    </Button>
                </div>
            </header>

            {/* Main Viewer Area (Full Bleed) */}
            <main className="flex-1 relative overflow-hidden bg-slate-900 flex flex-col">
                <div className="flex-1 relative w-full">
                    <Suspense fallback={
                        <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-900 text-slate-400 gap-4">
                            <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                            <p className="text-sm font-medium animate-pulse">Carregando Modelo 3D...</p>
                        </div>
                    }>
                        <STLViewer url={url} />
                    </Suspense>
                </div>

                {/* Controls Info Bar (Slim) - Stays at bottom */}
                <div className="h-10 border-t border-slate-800 flex items-center justify-between px-6 bg-slate-950/80 shrink-0">
                    <div className="flex items-center gap-2">
                        <Info className="h-3 w-3 text-slate-500" />
                        <span className="text-[10px] text-slate-500 uppercase tracking-tight">Visualizador interativo em tempo real para arquivos STL dentários</span>
                    </div>
                </div>
            </main>
        </div>
    );
}

export default function Visualizador3DPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen bg-slate-950 flex items-center justify-center">
                <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
            </div>
        }>
            <Visualizador3DContent />
        </Suspense>
    );
}
