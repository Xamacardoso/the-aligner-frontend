"use client"

import { useState, useEffect } from 'react';
import { TreatmentFile } from '@/lib/types';
import { treatmentService } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { File, Download, UploadCloud, Loader2, Eye, Box, Trash2 } from 'lucide-react';
import { useId } from 'react';
import { cn } from "@/lib/utils";
import { useAppAuth } from '@/hooks/use-app-auth';

interface FileManagementProps {
    patientCpf: string; // Keeping name for compatibility but it should be treatmentPublicId now
    noCard?: boolean;
    onUploadSuccess?: () => void;
    onUploadingChange?: (isUploading: boolean) => void;
}

export function FileManagement({
    patientCpf: treatmentPublicId,
    noCard = false,
    onUploadSuccess,
    onUploadingChange
}: FileManagementProps) {
    const inputId = `file-upload-${treatmentPublicId}`;
    const [documents, setDocuments] = useState<TreatmentFile[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isUploading, setIsUploading] = useState(false);
    const [deletingKey, setDeletingKey] = useState<string | null>(null);
    const { toast } = useToast();
    const { token } = useAppAuth();

    useEffect(() => {
        if (onUploadingChange) {
            onUploadingChange(isUploading);
        }
    }, [isUploading, onUploadingChange]);

    const loadDocuments = async () => {
        if (!treatmentPublicId) return;
        setIsLoading(true);
        try {
            const docs = await treatmentService.getFiles(treatmentPublicId, token || undefined);
            setDocuments(docs);
        } catch (err) {
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        loadDocuments();
    }, [treatmentPublicId]);

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !treatmentPublicId) return;

        setIsUploading(true);
        try {
            const fileType = file.type || 'application/octet-stream';

            // 1. Request presigned URL
            const data = await treatmentService.requestUpload(treatmentPublicId, {
                fileName: file.name,
                contentType: fileType
            }, token || undefined);

            if (!data) throw new Error("Falha ao obter URL de upload");

            const { uploadUrl, r2key } = data;

            // 2. Upload diretamente para o Cloudflare R2
            const res = await fetch(uploadUrl, {
                method: 'PUT',
                body: file,
                headers: {
                    'Content-Type': fileType,
                },
            });

            if (!res.ok) throw new Error("Upload para nuvem falhou");

            // 3. Confirm metadata to backend
            const format = file.name.split('.').pop() || '';
            await treatmentService.confirmUpload(treatmentPublicId, {
                nomeOriginal: file.name,
                r2key,
                formato: format
            }, token || undefined);

            toast({ title: "Arquivo enviado com sucesso!", description: file.name });
            loadDocuments();
            if (onUploadSuccess) onUploadSuccess();
        } catch (err: any) {
            console.error(err);
            toast({
                title: "Erro no upload",
                description: err.message || "Não foi possível enviar o arquivo.",
                variant: "destructive"
            });
        } finally {
            setIsUploading(false);
            e.target.value = '';
        }
    };

    const handleDelete = async (r2key: string) => {
        setDeletingKey(r2key);
        try {
            await treatmentService.deleteFile(r2key, token || undefined);
            toast({ title: "Arquivo excluído" });
            loadDocuments();
        } catch (err) {
            toast({ title: "Erro ao excluir arquivo", variant: "destructive" });
        } finally {
            setDeletingKey(null);
        }
    };

    const handleDownload = async (url: string, fileName: string) => {
        try {
            toast({ title: "Iniciando download...", description: "Aguarde um momento." });
            const res = await fetch(url);
            if (!res.ok) throw new Error("Falha ao baixar arquivo");

            const blob = await res.blob();
            const blobUrl = window.URL.createObjectURL(blob);

            const link = document.createElement('a');
            link.href = blobUrl;
            link.download = fileName;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(blobUrl);
        } catch (err) {
            console.error(err);
            toast({ title: "Erro ao baixar", description: "Não foi possível forçar o download.", variant: "destructive" });
            window.open(url, '_blank');
        }
    };

    return (
        <div className={cn(
            "mt-1 overflow-hidden",
            noCard ? "" : "bg-card rounded-lg border border-border"
        )}>
            {/* Input oculto sempre disponível para gatilhos externos ou internos */}
            <input
                type="file"
                id={inputId}
                className="hidden"
                onChange={handleFileChange}
                disabled={isUploading}
            />

            {!noCard && (
                <div className="border-b border-border px-5 py-3 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <File className="h-4 w-4 text-primary" />
                        <h2 className="text-sm font-bold text-foreground">Arquivos e Exames</h2>
                    </div>
                    <div className="relative">
                        <Button
                            size="sm"
                            variant="outline"
                            className="h-8 gap-1.5 text-[10px] font-bold uppercase transition-all"
                            loading={isUploading}
                            onClick={() => document.getElementById(inputId)?.click()}
                            title="Fazer upload de novo arquivo"
                        >
                            <UploadCloud className="h-3 w-3" />
                            Upload
                        </Button>
                    </div>
                </div>
            )}

            <div className={cn(noCard ? "pt-2" : "p-5")}>
                {isLoading ? (
                    <div className="flex justify-center py-4 text-muted-foreground italic text-sm">
                        Carregando documentos...
                    </div>
                ) : documents.length === 0 ? (
                    <p className="text-sm text-muted-foreground">Nenhum documento anexado.</p>
                ) : (
                    <div className="flex flex-col gap-3">
                        {documents.map((doc) => (
                            <div
                                key={doc.publicId}
                                className="flex items-center justify-between p-3 border border-border rounded-md hover:bg-muted/30 transition-colors group"
                            >
                                <div className="flex items-center gap-3 overflow-hidden">
                                    <div className="bg-primary/10 p-2 rounded text-primary">
                                        <File className="h-4 w-4" />
                                    </div>
                                    <div className="overflow-hidden">
                                        <p className="text-sm font-medium text-foreground truncate max-w-[150px] md:max-w-[300px]" title={doc.nomeOriginal}>
                                            {doc.nomeOriginal}
                                        </p>
                                        <p className="text-[10px] text-muted-foreground flex gap-2">
                                            <span className="uppercase">{doc.formato}</span>
                                            <span>•</span>
                                            <span>{doc.dataCriacao ? new Date(doc.dataCriacao).toLocaleDateString('pt-BR') : ''}</span>
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    {deletingKey === doc.r2key ? (
                                        <div className="flex items-center gap-2 px-3">
                                            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                                            <span className="text-[10px] text-muted-foreground font-medium uppercase animate-pulse">Excluindo...</span>
                                        </div>
                                    ) : (
                                        <>
                                            {doc.formato.toLowerCase() === 'stl' && (
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    className="h-8 gap-1.5 text-xs hidden md:flex"
                                                    onClick={() => {
                                                        const viewerUrl = `/visualizador-3d?url=${encodeURIComponent(doc.downloadUrl!)}&name=${encodeURIComponent(doc.nomeOriginal)}`;
                                                        window.open(viewerUrl, '_blank');
                                                    }}
                                                >
                                                    <Box className="h-3.5 w-3.5" />
                                                    Visualizar 3D
                                                </Button>
                                            )}

                                            {doc.downloadUrl && (
                                                <div className="flex items-center gap-1">
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-8 w-8"
                                                        onClick={() => window.open(doc.downloadUrl, '_blank')}
                                                        title="Visualizar"
                                                    >
                                                        <Eye className="h-4 w-4 text-muted-foreground" />
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-8 w-8"
                                                        onClick={() => handleDownload(doc.downloadUrl!, doc.nomeOriginal)}
                                                        title="Baixar"
                                                    >
                                                        <Download className="h-4 w-4 text-muted-foreground" />
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-8 w-8"
                                                        onClick={() => handleDelete(doc.r2key)}
                                                        title="Excluir"
                                                    >
                                                        <Trash2 className="h-4 w-4 text-destructive" />
                                                    </Button>
                                                </div>
                                            )}
                                        </>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
