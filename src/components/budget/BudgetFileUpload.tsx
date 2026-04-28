"use client";

import React from "react";
import { UploadCloud, Loader2, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { budgetService } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { useAppAuth } from "@/hooks/use-app-auth";
import { cn } from "@/lib/utils";

interface BudgetFileUploadProps {
    budgetPublicId: string;
    onSuccess?: () => void;
    /** Se já possui arquivo, muda o ícone/label para indicar substituição */
    hasFile?: boolean;
    /** Estilo visual: 'icon' (padrão) ou 'card' (área maior com borda tracejada) */
    variant?: 'icon' | 'card';
}

/**
 * @component BudgetFileUpload
 * @description Componente modular para upload de PDF em orçamentos.
 * Centraliza a lógica de request presigned URL -> upload R2 -> confirmação backend.
 */
export function BudgetFileUpload({ 
    budgetPublicId, 
    onSuccess, 
    hasFile,
    variant = 'icon'
}: BudgetFileUploadProps) {
    const [isUploading, setIsUploading] = React.useState(false);
    const { token } = useAppAuth();
    const { toast } = useToast();
    const fileInputRef = React.useRef<HTMLInputElement>(null);

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || []);
        if (files.length === 0 || !budgetPublicId) return;

        const invalidFiles = files.filter(f => f.type !== 'application/pdf' && !f.name.toLowerCase().endsWith('.pdf'));
        if (invalidFiles.length > 0) {
            toast({
                title: "Arquivos inválidos detectados",
                description: "Apenas arquivos PDF são permitidos.",
                variant: "destructive"
            });
            return;
        }

        setIsUploading(true);
        let successCount = 0;

        try {
            for (const file of files) {
                const fileType = file.type || 'application/pdf';

                // 1. Solicitar URL de upload
                const { uploadUrl, r2key } = await budgetService.requestFileUpload(budgetPublicId, {
                    fileName: file.name,
                    contentType: fileType,
                }, token || undefined);

                // 2. Upload direto para o Cloudflare R2
                const res = await fetch(uploadUrl, {
                    method: 'PUT',
                    body: file,
                    headers: { 'Content-Type': fileType },
                });

                if (!res.ok) throw new Error(`Falha no envio do arquivo ${file.name}`);

                // 3. Confirmar metadados no backend
                await budgetService.confirmFileUpload(budgetPublicId, {
                    r2key,
                    nomeOriginal: file.name,
                }, token || undefined);
                
                successCount++;
            }

            toast({
                title: successCount > 1 ? "Arquivos anexados!" : "Arquivo anexado!",
                description: successCount > 1 ? `${successCount} documentos foram adicionados ao orçamento.` : "O documento foi adicionado com sucesso."
            });

            if (onSuccess) onSuccess();
        } catch (error: any) {
            console.error("Erro no upload do orçamento:", error);
            toast({
                title: "Erro no upload parcial",
                description: error.message || "Alguns arquivos podem não ter sido enviados.",
                variant: "destructive"
            });
        } finally {
            setIsUploading(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    const triggerUpload = (e: React.MouseEvent) => {
        e.stopPropagation();
        fileInputRef.current?.click();
    };

    return (
        <div className={variant === 'card' ? 'w-full h-full' : 'inline-block'}>
            <input
                type="file"
                multiple
                accept=".pdf,application/pdf"
                className="hidden"
                ref={fileInputRef}
                onChange={handleFileChange}
                disabled={isUploading}
            />

            {variant === 'icon' ? (
                <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-primary hover:bg-primary/10 transition-colors"
                    onClick={triggerUpload}
                    disabled={isUploading}
                    title={hasFile ? "Adicionar mais um arquivo ao orçamento" : "Anexar arquivo ao orçamento"}
                >
                    {isUploading ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                        <UploadCloud className="h-3.5 w-3.5" />
                    )}
                </Button>
            ) : (
                <button
                    type="button"
                    className={cn(
                        "w-full h-full min-h-[80px] flex flex-col items-center justify-center gap-2 p-4",
                        "border-2 border-dashed border-primary/20 rounded-xl bg-primary/5 hover:bg-primary/10 hover:border-primary/40 transition-all group",
                        isUploading && "opacity-60 cursor-not-allowed"
                    )}
                    onClick={triggerUpload}
                    disabled={isUploading}
                >
                    {isUploading ? (
                        <Loader2 className="h-6 w-6 animate-spin text-primary" />
                    ) : (
                        <>
                            <div className="bg-background p-2 rounded-full shadow-sm group-hover:scale-110 transition-transform">
                                <UploadCloud className="h-5 w-5 text-primary" />
                            </div>
                            <span className="text-[10px] font-black uppercase tracking-widest text-primary">
                                Adicionar Arquivos
                            </span>
                        </>
                    )}
                </button>
            )}
        </div>
    );
}
