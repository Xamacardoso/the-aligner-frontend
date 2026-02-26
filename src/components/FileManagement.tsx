"use client"

import { useState, useEffect } from 'react';
import { PatientDocument } from '@/lib/types';
import { fetchPatientDocuments, requestFileUpload, confirmFileUpload } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { File, Download, UploadCloud, Loader2, Eye, Box } from 'lucide-react';

interface FileManagementProps {
    patientCpf: string;
}

export function FileManagement({ patientCpf }: FileManagementProps) {
    const [documents, setDocuments] = useState<PatientDocument[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isUploading, setIsUploading] = useState(false);
    const { toast } = useToast();

    const loadDocuments = async () => {
        if (!patientCpf) return;
        setIsLoading(true);
        try {
            const docs = await fetchPatientDocuments(patientCpf);
            setDocuments(docs);
        } catch (err) {
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        loadDocuments();
    }, [patientCpf]);

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !patientCpf) return;

        setIsUploading(true);
        try {
            const fileType = file.type || 'application/octet-stream';

            // 1. Request presigned URL
            const data = await requestFileUpload(patientCpf, file.name, fileType);
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
            const confirmed = await confirmFileUpload(patientCpf, file.name, r2key);
            if (confirmed) {
                toast({ title: "Arquivo enviado com sucesso!", description: file.name });
                loadDocuments();
            } else {
                throw new Error("Falha ao confirmar arquivo no servidor");
            }
        } catch (err: any) {
            console.error(err);
            toast({
                title: "Erro no upload",
                description: err.message || "Não foi possível enviar o arquivo.",
                variant: "destructive"
            });
        } finally {
            setIsUploading(false);
            e.target.value = ''; // Reset input so same file can be chosen again
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
            // Fallback to simpler method if fetch fails (CORS might still be an issue for GET)
            window.open(url, '_blank');
        }
    };

    return (
        <div className="bg-card rounded-lg border border-border mt-10 overflow-hidden">
            <div className="px-5 py-3 border-b border-border flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <File className="h-4 w-4 text-muted-foreground" />
                    <h2 className="text-sm font-semibold text-foreground">Documentos e Arquivos</h2>
                </div>
                <div className="relative">
                    <input
                        type="file"
                        id="patient-file-upload"
                        className="hidden"
                        onChange={handleFileChange}
                        disabled={isUploading}
                    />
                    <Button
                        size="sm"
                        variant="outline"
                        className="h-8 gap-1.5 text-xs"
                        disabled={isUploading}
                        onClick={() => document.getElementById('patient-file-upload')?.click()}
                    >
                        {isUploading ? <Loader2 className="h-3 w-3 animate-spin" /> : <UploadCloud className="h-3 w-3" />}
                        {isUploading ? 'Enviando...' : 'Upload'}
                    </Button>
                </div>
            </div>

            <div className="p-5">
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
                                key={doc.r2key}
                                className="flex items-center justify-between p-3 border border-border rounded-md hover:bg-muted/30 transition-colors group"
                            >
                                <div className="flex items-center gap-3 overflow-hidden">
                                    <div className="bg-primary/10 p-2 rounded text-primary">
                                        <File className="h-4 w-4" />
                                    </div>
                                    <div className="overflow-hidden">
                                        <p className="text-sm font-medium text-foreground truncate max-w-[150px] md:max-w-[300px]" title={doc.name}>
                                            {doc.name}
                                        </p>
                                        <p className="text-[10px] text-muted-foreground flex gap-2">
                                            <span className="uppercase">{doc.format}</span>
                                            <span>•</span>
                                            <span>{doc.createdAt}</span>
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    {doc.format.toLowerCase() === 'stl' && (
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            className="h-8 gap-1.5 text-xs hidden md:flex"
                                            onClick={() => { }} // Placeholder for 3D viewer
                                        >
                                            <Box className="h-3.5 w-3.5" />
                                            Visualizar Modelo 3D
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
                                                onClick={() => handleDownload(doc.downloadUrl!, doc.name)}
                                                title="Baixar"
                                            >
                                                <Download className="h-4 w-4 text-muted-foreground" />
                                            </Button>
                                        </div>
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
