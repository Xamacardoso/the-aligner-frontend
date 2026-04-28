"use client"

/**
 * @page GerentePatientDetailPage
 * @description Página de detalhes de um paciente para o GERENTE (equipe TheAligner).
 *
 * Regras de negócio aplicadas:
 * - Gerente PODE criar orçamentos e anexar PDF
 * - Gerente PODE excluir orçamentos com status 'pendente'
 * - Gerente NÃO pode aprovar nem declinar orçamentos
 * - Gerente vê as 3 seções de arquivos: Exames, Setups, Documentos Finais
 * - Gerente NÃO cria nem exclui tratamentos (isso é do dentista)
 */

import { useState, use, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
    partnerService,
    patientService,
    treatmentService,
    budgetService
} from '@/lib/api';
import {
    Budget,
    PatientDetails,
    PartnerDetails,
    TreatmentListItem,
    TreatmentDetails
} from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { ArrowLeft, Plus, Trash2, FileText, ClipboardList, User, Loader2, Pencil, Calendar, Download, UploadCloud } from 'lucide-react';
import { TreatmentAccordion } from '@/components/treatment/TreatmentAccordion';
import { TreatmentForm } from '@/components/treatment/TreatmentForm';
import { FileManagement } from '@/components/FileManagement';
import { useToast } from '@/hooks/use-toast';
import { ConfirmActionDialog } from '@/components/ConfirmActionDialog';
import { useAppAuth } from '@/hooks/use-app-auth';

const statusLabel: Record<string, string> = {
    pendente: 'Pendente',
    aprovado: 'Aprovado',
    declinado: 'Declinado',
    cancelado: 'Cancelado',
};
const statusClass: Record<string, string> = {
    pendente: 'bg-yellow-100 text-yellow-700',
    aprovado: 'bg-green-100 text-green-700',
    declinado: 'bg-red-100 text-red-700',
    cancelado: 'bg-gray-100 text-gray-500',
};

const generateId = () => Math.random().toString(36).substr(2, 9);

interface PageProps {
    params: Promise<{ id: string }>; // publicId of the patient
}

export default function GerentePatientDetailPage({ params }: PageProps) {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { id: publicId } = use(params);
    const { toast } = useToast();
    const { token, isLoaded } = useAppAuth();

    const [patient, setPatient] = useState<PatientDetails | null>(null);
    const [dentist, setDentist] = useState<PartnerDetails | null>(null);

    const [treatments, setTreatments] = useState<TreatmentListItem[]>([]);
    const [selectedTreatmentId, setSelectedTreatmentId] = useState<string | null>(null);
    const [treatmentDetails, setTreatmentDetails] = useState<TreatmentDetails | null>(null);

    const [budgets, setBudgets] = useState<Budget[]>([]);
    const [openBudget, setOpenBudget] = useState(false);
    const [procedures, setProcedures] = useState<{ id: string, name: string, value: number }[]>([{ id: generateId(), name: '', value: 0 }]);
    const [isLoadingDetails, setIsLoadingDetails] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [viewingBudget, setViewingBudget] = useState<Budget | null>(null);
    const [observations, setObservations] = useState('');
    const [budgetToDelete, setBudgetToDelete] = useState<string | null>(null);

    const [openEditTreatment, setOpenEditTreatment] = useState(false);

    // Estado para upload de PDF do orçamento
    const [budgetFile, setBudgetFile] = useState<File | null>(null);
    const [isUploadingBudgetFile, setIsUploadingBudgetFile] = useState(false);

    const loadData = async () => {
        if (!isLoaded || !token || !publicId) return;
        try {
            const foundP = await patientService.findOne(publicId, token);
            setPatient(foundP);
            if (foundP) {
                const partner = await partnerService.findOne(foundP.partnerPublicId, token || undefined);
                setDentist(partner);

                const ts = await treatmentService.findByPatient(foundP.publicId, foundP.partnerPublicId, token || undefined);
                setTreatments(ts);
                if (ts.length > 0) setSelectedTreatmentId(ts[0].publicId);
            }
        } catch (err) {
            console.error(err);
        }
    };

    const loadTreatmentData = async (tid: string, silent = false) => {
        if (!tid) return;

        if (!silent && treatmentDetails?.publicId === tid) return;

        if (!silent) setIsLoadingDetails(true);
        try {
            const details = await treatmentService.findOne(tid, token || undefined);
            setTreatmentDetails(details);
            const b = await budgetService.findByTreatment(tid, token || undefined);
            setBudgets(b);
        } catch (err) {
            console.error(err);
        } finally {
            if (!silent) setIsLoadingDetails(false);
        }
    };

    useEffect(() => {
        loadData();
    }, [publicId, isLoaded, token]);

    useEffect(() => {
        if (selectedTreatmentId) {
            loadTreatmentData(selectedTreatmentId);
        } else {
            setTreatmentDetails(null);
            setBudgets([]);
        }
    }, [selectedTreatmentId]);

    if (!patient) return <div className="p-8 text-muted-foreground">Paciente não encontrado.</div>;

    const totalValue = procedures.reduce((s, p) => s + Number(p.value || 0), 0);

    /**
     * Cria orçamento e, se houver PDF selecionado, faz upload e vincula.
     */
    const handleSaveBudget = async () => {
        if (!selectedTreatmentId) return;

        setIsSubmitting(true);

        try {
            const newBudget = await budgetService.create({
                tratamentoPublicId: selectedTreatmentId,
                valor: totalValue,
                descricao: observations.substring(0, 400)
            }, token || undefined);

            // Se o gerente selecionou um PDF, faz upload
            if (budgetFile && newBudget?.publicId) {
                setIsUploadingBudgetFile(true);
                try {
                    const fileType = budgetFile.type || 'application/pdf';
                    const { uploadUrl, r2key } = await budgetService.requestFileUpload(newBudget.publicId, {
                        fileName: budgetFile.name,
                        contentType: fileType,
                    }, token || undefined);

                    const res = await fetch(uploadUrl, {
                        method: 'PUT',
                        body: budgetFile,
                        headers: { 'Content-Type': fileType },
                    });

                    if (!res.ok) throw new Error("Upload do PDF falhou");

                    await budgetService.confirmFileUpload(newBudget.publicId, {
                        r2key,
                        nomeOriginal: budgetFile.name,
                    }, token || undefined);
                } catch (fileErr) {
                    console.error('Erro no upload do PDF:', fileErr);
                    toast({
                        title: "Orçamento criado, mas erro no upload do PDF",
                        description: "O orçamento foi salvo, mas o anexo não pôde ser enviado.",
                        variant: "destructive"
                    });
                } finally {
                    setIsUploadingBudgetFile(false);
                }
            }

            // Limpar formulário
            setOpenBudget(false);
            setProcedures([{ id: generateId(), name: '', value: 0 }]);
            setObservations('');
            setBudgetFile(null);

            if (newBudget && typeof newBudget === 'object' && newBudget.publicId) {
                setBudgets(prev => [newBudget, ...prev]);
                toast({ title: "Orçamento criado com sucesso!" });

                setTimeout(() => {
                    const el = document.getElementById(`budget-${newBudget.publicId}`);
                    if (el) {
                        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                        el.classList.add('ring-2', 'ring-primary', 'bg-primary/5', 'scale-[1.02]');
                        setTimeout(() => el.classList.remove('ring-2', 'ring-primary', 'bg-primary/5', 'scale-[1.02]'), 2000);
                    }
                }, 450);
            }

            // Sincronismo silencioso
            loadTreatmentData(selectedTreatmentId, true);

        } catch (err) {
            console.error('Erro ao salvar orçamento:', err);
            toast({
                title: "Erro ao criar orçamento",
                description: "Verifique os dados e tente novamente.",
                variant: "destructive"
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    /**
     * Exclui (soft-delete) um orçamento pendente.
     */
    const handleDeleteBudget = async () => {
        if (!budgetToDelete) return;

        setIsSubmitting(true);
        try {
            await budgetService.delete(budgetToDelete, token || undefined);
            toast({
                title: "Orçamento excluído",
                description: "O orçamento foi removido com sucesso."
            });
            if (selectedTreatmentId) loadTreatmentData(selectedTreatmentId, true);
            setBudgetToDelete(null);
        } catch (err) {
            toast({ title: "Erro ao excluir", variant: "destructive" });
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleTreatmentSuccess = (data: any) => {
        const actualTreatment = data?.treatment ? data.treatment : data;
        setOpenEditTreatment(false);

        if (!actualTreatment || !actualTreatment.publicId) {
            loadData();
            return;
        }

        setTreatments(prev => prev.map(t => t.publicId === actualTreatment.publicId ? actualTreatment : t));
        setTreatmentDetails(actualTreatment);
        
        loadData();
        loadTreatmentData(actualTreatment.publicId, true);
    };

    return (
        <div className="p-8 max-w-4xl">
            <button
                onClick={() => router.back()}
                className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-5 transition-colors"
                title="Voltar para a lista"
            >
                <ArrowLeft className="h-4 w-4" /> Voltar
            </button>

            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                    <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                        <User className="h-6 w-6" />
                    </div>
                    <div>
                        <h1 className="text-xl font-bold text-foreground">{patient.nome}</h1>
                        <p className="text-sm text-muted-foreground font-medium">Paciente do Dentista: {dentist?.nome ?? '—'}</p>
                    </div>
                </div>
            </div>

            {/* Identity */}
            <div className="bg-card rounded-lg border border-border p-5 mb-6 relative group">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-sm font-semibold text-foreground">Identificação do Paciente</h2>
                </div>
                <div className="grid grid-cols-2 gap-3 text-sm">
                    {[
                        ['CPF', patient.cpf],
                        ['Nascimento', patient.nascimento ? new Date(patient.nascimento).toLocaleDateString('pt-BR') : '—'],
                    ].map(([label, value]) => (
                        <div key={label}>
                            <span className="text-foreground font-semibold">{label}: </span>
                            <span className="text-muted-foreground">{value || '—'}</span>
                        </div>
                    ))}
                </div>
            </div>

            {/* Accordion de Tratamentos */}
            <div className="mb-6">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
                        <ClipboardList className="h-6 w-6 text-primary" />
                        Tratamentos Clínicos
                    </h2>
                </div>

                <TreatmentAccordion
                    treatments={treatments}
                    selectedTreatmentId={selectedTreatmentId}
                    onSelect={setSelectedTreatmentId}
                    treatmentDetails={treatmentDetails}
                    budgets={budgets}
                    /* Gerente NÃO edita nem exclui tratamentos */
                    onEditTreatment={undefined}
                    onDeleteTreatment={undefined}
                    onAddBudget={() => setOpenBudget(true)}
                    onViewBudget={setViewingBudget}
                    onDeleteBudget={setBudgetToDelete}
                    isLoadingDetails={isLoadingDetails}
                    canUpload={true}
                    userRole="gerente"
                />
            </div>

            {/* Budget View Modal — Gerente NÃO pode aprovar/declinar */}
            <Dialog open={!!viewingBudget} onOpenChange={v => !v && setViewingBudget(null)}>
                <DialogContent className="max-w-[95vw] md:max-w-6xl h-auto border-none shadow-2xl p-0 overflow-hidden">
                    <DialogHeader className="p-6 border-b border-border bg-muted/5 flex-shrink-0">
                        <DialogTitle className="flex items-center gap-2 text-xl font-bold">
                            <FileText className="h-5 w-5 text-primary" />
                            Detalhes do Orçamento do Tratamento
                        </DialogTitle>
                    </DialogHeader>
                    {viewingBudget && (
                        <div className="p-8 space-y-8 bg-background/50">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
                                <div className="bg-primary/5 rounded-2xl border border-primary/10 p-6 shadow-sm">
                                    <div className="space-y-4">
                                        <div>
                                            <p className="text-[10px] font-black uppercase tracking-widest text-primary mb-1">Status do Orçamento</p>
                                            <span className={`text-[11px] px-3 py-1.5 rounded-full font-bold inline-block border ${statusClass[viewingBudget.status]}`}>
                                                {statusLabel[viewingBudget.status]}
                                            </span>
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-black uppercase tracking-widest text-primary mb-1">Valor do Tratamento</p>
                                            <p className="text-3xl font-black text-foreground tabular-nums">
                                                {Number(viewingBudget.valor).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Descrição Técnica / Observações</p>
                                    <div className="bg-muted/30 rounded-2xl p-6 border border-border/50 min-h-[160px]">
                                        <p className="text-sm text-foreground whitespace-pre-wrap leading-relaxed italic">{viewingBudget.descricao}</p>
                                    </div>
                                </div>
                            </div>

                            {/* PDF Anexado — Gerente pode visualizar/baixar */}
                            {viewingBudget.arquivoDownloadUrl && (
                                <div className="space-y-2">
                                    <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Documento Anexado</p>
                                    <div className="flex items-center gap-3 p-4 bg-muted/30 rounded-xl border border-border/50">
                                        <FileText className="h-5 w-5 text-primary flex-shrink-0" />
                                        <span className="text-sm text-foreground truncate flex-1">{viewingBudget.arquivoNomeOriginal || 'Documento.pdf'}</span>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            className="gap-1.5 text-xs font-bold"
                                            onClick={() => window.open(viewingBudget.arquivoDownloadUrl!, '_blank')}
                                        >
                                            <Download className="h-3.5 w-3.5" /> Baixar PDF
                                        </Button>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                    <DialogFooter className="p-6 border-t border-border bg-muted/5">
                        <Button variant="outline" onClick={() => setViewingBudget(null)} className="h-12 px-8 font-bold uppercase text-xs tracking-widest">Fechar Visualização</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Budget Creation Dialog — Com upload de PDF */}
            <Dialog open={openBudget} onOpenChange={setOpenBudget}>
                <DialogContent className="max-w-[95vw] md:max-w-6xl h-auto border-none shadow-2xl p-0 overflow-hidden">
                    <DialogHeader className="p-6 border-b border-border bg-muted/5 flex-shrink-0">
                        <DialogTitle className="text-xl font-bold">
                            Gerar Novo Orçamento
                        </DialogTitle>
                    </DialogHeader>

                    {isSubmitting && (
                        <div className="absolute inset-0 bg-background/50 backdrop-blur-[1px] flex flex-col items-center justify-center z-50 rounded-lg animate-in fade-in duration-300">
                            <Loader2 className="h-8 w-8 animate-spin text-primary" />
                            <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mt-4">
                                {isUploadingBudgetFile ? "Enviando PDF..." : "Processando..."}
                            </p>
                        </div>
                    )}
                    <div className="p-8 space-y-6 bg-background/50">
                        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-stretch">
                            <div className="md:col-span-8 flex flex-col space-y-3">
                                <Label className="text-[11px] font-black uppercase tracking-widest text-muted-foreground flex-shrink-0">Descrição do Plano de Tratamento</Label>
                                <Textarea
                                    rows={6}
                                    placeholder="Descreva aqui o que está sendo orçado, tratamentos clínicos e observações financeiras..."
                                    value={observations}
                                    onChange={e => setObservations(e.target.value)}
                                    className="flex-1 min-h-[160px] border-primary/10 focus:border-primary transition-all text-sm resize-none bg-background shadow-sm p-4 leading-relaxed"
                                />
                            </div>
                            <div className="md:col-span-4 flex flex-col space-y-3">
                                <span className="text-[11px] font-black uppercase tracking-widest text-transparent flex-shrink-0 select-none pointer-events-none">VALOR</span>
                                <div className="flex-1 bg-primary/5 rounded-2xl border border-primary/10 p-6 shadow-sm flex flex-col justify-center min-h-[160px]">
                                    <Label className="text-[11px] font-black uppercase tracking-widest text-primary mb-4 block">Valor Final do Tratamento</Label>
                                    <div className="relative">
                                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground font-black text-xs uppercase">R$</span>
                                        <Input
                                            type="number"
                                            className="pl-12 h-16 bg-background border-primary/10 focus:border-primary transition-all text-3xl font-black tabular-nums shadow-sm"
                                            placeholder="0,00"
                                            value={procedures[0]?.value || ''}
                                            onChange={e => setProcedures([{ id: 'val', name: 'Total', value: Number(e.target.value) }])}
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Upload de PDF do orçamento */}
                        <div className="space-y-3">
                            <Label className="text-[11px] font-black uppercase tracking-widest text-muted-foreground">
                                Anexar Documento PDF (opcional)
                            </Label>
                            <div className="flex items-center gap-3">
                                <Input
                                    type="file"
                                    accept=".pdf,application/pdf"
                                    id="budget-file-input"
                                    className="hidden"
                                    onChange={e => setBudgetFile(e.target.files?.[0] || null)}
                                />
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="gap-2 text-xs font-bold uppercase h-10"
                                    onClick={() => document.getElementById('budget-file-input')?.click()}
                                >
                                    <UploadCloud className="h-4 w-4" />
                                    {budgetFile ? 'Trocar arquivo' : 'Selecionar PDF'}
                                </Button>
                                {budgetFile && (
                                    <div className="flex items-center gap-2 bg-muted/40 px-3 py-2 rounded-lg border border-border/50">
                                        <FileText className="h-4 w-4 text-primary flex-shrink-0" />
                                        <span className="text-xs text-foreground font-medium truncate max-w-[200px]">{budgetFile.name}</span>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-6 w-6 text-destructive"
                                            onClick={() => setBudgetFile(null)}
                                        >
                                            <Trash2 className="h-3 w-3" />
                                        </Button>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                    <DialogFooter className="p-6 border-t border-border bg-muted/5 gap-3">
                        <Button variant="outline" onClick={() => { setOpenBudget(false); setBudgetFile(null); }} disabled={isSubmitting} className="h-12 px-8 font-bold uppercase text-xs tracking-widest">Descartar</Button>
                        <Button 
                            onClick={handleSaveBudget} 
                            loading={isSubmitting} 
                            disabled={totalValue === 0 || !observations}
                            className="h-12 px-8 font-bold uppercase text-xs tracking-widest min-w-[240px] shadow-lg shadow-primary/20"
                        >
                            Gerar e Salvar Orçamento
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Confirmation Dialog for Budget Deletion */}
            <ConfirmActionDialog
                open={!!budgetToDelete}
                onOpenChange={(open) => !open && setBudgetToDelete(null)}
                onConfirm={handleDeleteBudget}
                isLoading={isSubmitting}
                title="Confirmar Exclusão"
                description="Tem certeza que deseja excluir este orçamento? Esta ação não pode ser desfeita."
                confirmText="Excluir"
            />

            {/* Edit Treatment Dialog */}
            <Dialog open={openEditTreatment} onOpenChange={setOpenEditTreatment}>
                <DialogContent className="max-w-[95vw] md:max-w-7xl h-[92vh] flex flex-col p-0 overflow-hidden gap-0 border-none shadow-2xl">
                    <DialogHeader className="p-6 border-b border-border flex-shrink-0">
                        <DialogTitle className="flex items-center gap-2">
                            <Pencil className="h-5 w-5 text-primary" />
                            Editar Tratamento Clínico
                        </DialogTitle>
                    </DialogHeader>

                    <div className="flex-1 overflow-y-auto min-h-0 overscroll-contain">
                        <div className="p-6">
                            {patient && dentist && treatmentDetails && (
                                <TreatmentForm
                                    patientPublicId={patient.publicId}
                                    partnerPublicId={dentist.publicId}
                                    initialData={treatmentDetails}
                                    onSuccess={handleTreatmentSuccess}
                                    onCancel={() => setOpenEditTreatment(false)}
                                />
                            )}
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}
