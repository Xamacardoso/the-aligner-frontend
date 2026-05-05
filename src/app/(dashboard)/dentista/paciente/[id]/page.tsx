"use client"

/**
 * @page DentistaPatientDetailPage
 * @description Página de detalhes de um paciente para o DENTISTA.
 *
 * Regras de negócio aplicadas:
 * - Dentista NÃO pode criar orçamentos (removido botão "Novo Orçamento")
 * - Dentista PODE aprovar ou declinar orçamentos pendentes
 * - Dentista NÃO pode excluir/cancelar orçamentos
 * - Dentista vê seções "Exames Ortodônticos" (upload+download) e "Documentos Finais" (read-only)
 * - Dentista NÃO vê seção "Setups do Paciente"
 * - Dentista pode criar, editar e excluir tratamentos
 */

import { useState, use, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
    partnerService,
    patientService,
    treatmentService,
    budgetService,
    clinicalService
} from '@/lib/api';
import {
    Budget,
    PatientDetails,
    PartnerDetails,
    TreatmentListItem,
    TreatmentDetails
} from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { ArrowLeft, Plus, FileText, ClipboardList, Stethoscope, Pencil, User, Loader2, AlertCircle, Download } from 'lucide-react';
import { TreatmentForm } from '@/components/treatment/TreatmentForm';
import { TreatmentAccordion } from '@/components/treatment/TreatmentAccordion';
import { ConfirmActionDialog } from '@/components/ConfirmActionDialog';
import { useAppAuth } from '@/hooks/use-app-auth';
import { logger } from '@/lib/logger';

const statusLabel: Record<string, string> = {
    pendente: 'Pendente',
    aprovado: 'Aprovado',
    declinado: 'Declinado',
    cancelado: 'Cancelado',
};
const statusClass: Record<string, string> = {
    pendente: 'bg-muted text-muted-foreground',
    aprovado: 'bg-green-100 text-green-700',
    declinado: 'bg-red-100 text-red-700',
    cancelado: 'bg-gray-100 text-gray-500',
};

interface PageProps {
    params: Promise<{ id: string }>; // The id here is the publicId of the patient
}

export default function DentistaPatientDetailPage({ params }: PageProps) {
    const router = useRouter();
    const { id: publicId } = use(params);

    const [mounted, setMounted] = useState(false);
    const [patient, setPatient] = useState<PatientDetails | null>(null);
    const [dentist, setDentist] = useState<PartnerDetails | null>(null);

    const [treatments, setTreatments] = useState<TreatmentListItem[]>([]);
    const [selectedTreatmentId, setSelectedTreatmentId] = useState<string | null>(null);
    const [treatmentDetails, setTreatmentDetails] = useState<TreatmentDetails | null>(null);

    const [budgets, setBudgets] = useState<Budget[]>([]);
    const [viewingBudget, setViewingBudget] = useState<Budget | null>(null);

    const [openCreateTreatment, setOpenCreateTreatment] = useState(false);
    const [openEditTreatment, setOpenEditTreatment] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [isLoadingDetails, setIsLoadingDetails] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const { toast } = useToast();
    const { token, user: activeUser, isLoaded } = useAppAuth();

    const loadData = async (silent = false) => {
        if (!publicId || !isLoaded || !token) return;
        if (!silent) setIsLoading(true);
        try {
            const foundP = await patientService.findOne(publicId, token);
            setPatient(foundP);

            if (foundP) {
                const partnerPublicId = foundP.partnerPublicId;
                const [treatmentsData, dentistData] = await Promise.all([
                    treatmentService.findByPatient(publicId, partnerPublicId, token || undefined),
                    partnerService.findOne(partnerPublicId, token || undefined)
                ]);
                setTreatments(treatmentsData);
                setDentist(dentistData);

                if (treatmentsData.length > 0 && !selectedTreatmentId) {
                    setSelectedTreatmentId(treatmentsData[0].publicId);
                }
            }
        } catch (err) {
            logger.error('Erro ao carregar dados do paciente (dentista)', { publicId, err });
            toast({ title: "Erro ao carregar dados do paciente", variant: "destructive" });
        } finally {
            if (!silent) setIsLoading(false);
        }
    };

    const loadTreatmentData = async (treatmentId: string, silent = false) => {
        if (!treatmentId || !token) return;

        if (!silent && treatmentDetails?.publicId === treatmentId) return;

        if (!silent) setIsLoadingDetails(true);
        try {
            const details = await treatmentService.findOne(treatmentId, token);
            if (!details || !details.publicId) {
                logger.error('Detalhes inválidos retornados pela API (dentista)', { treatmentId, details });
                return;
            }
            setTreatmentDetails(details);
            const b = await budgetService.findByTreatment(treatmentId, token || undefined);
            setBudgets(b);
        } catch (err: any) {
            logger.error(`Falha ao carregar tratamento "${treatmentId}" (dentista)`, { treatmentId, err });
            if (err.message?.includes('404') || err.message?.includes('não encontrado')) {
                toast({
                    title: "Sincronizando dados...",
                    description: "Houve um pequeno atraso na resposta do servidor. Tentando novamente...",
                    variant: "default"
                });
                setTimeout(() => loadTreatmentData(treatmentId, true), 1500);
            } else {
                toast({ title: "Erro ao carregar detalhes", variant: "destructive" });
            }
        } finally {
            if (!silent) setIsLoadingDetails(false);
        }
    };

    useEffect(() => {
        if (isLoaded && token) {
            setMounted(true);
            loadData();
        }
    }, [publicId, isLoaded, token]);

    useEffect(() => {
        if (selectedTreatmentId) {
            loadTreatmentData(selectedTreatmentId);
        } else {
            setTreatmentDetails(null);
            setBudgets([]);
        }
    }, [selectedTreatmentId]);

    if (!mounted) return null;

    if (isLoading) return (
        <div className="flex flex-col items-center justify-center h-[50vh] space-y-4">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-sm font-medium text-muted-foreground animate-pulse uppercase tracking-widest">Carregando ficha do paciente...</p>
        </div>
    );

    if (!patient) return (
        <div className="flex flex-col items-center justify-center h-[50vh] space-y-4">
            <AlertCircle className="h-10 w-10 text-destructive/50" />
            <div className="text-center">
                <h3 className="text-lg font-bold text-foreground">Paciente não encontrado</h3>
                <p className="text-sm text-muted-foreground">O registro pode ter sido removido ou o ID é inválido.</p>
            </div>
            <Button variant="outline" onClick={() => router.push('/dentista/pacientes')}>
                Voltar para a Lista
            </Button>
        </div>
    );

    // ---- Ações do Dentista ----

    const handleApproveBudget = async (bid: string) => {
        setIsSubmitting(true);
        try {
            await budgetService.approve(bid, token || undefined);
            toast({ title: "Orçamento aprovado!" });
            if (selectedTreatmentId) loadTreatmentData(selectedTreatmentId, true);
            setViewingBudget(null);
        } catch (err) {
            toast({ title: "Erro ao aprovar", variant: "destructive" });
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDeclineBudget = async (bid: string) => {
        setIsSubmitting(true);
        try {
            await budgetService.decline(bid, token || undefined);
            toast({
                title: "Orçamento declinado",
                description: "O status do orçamento foi alterado para declinado."
            });
            if (selectedTreatmentId) loadTreatmentData(selectedTreatmentId, true);
            setViewingBudget(null);
        } catch (err) {
            toast({ title: "Erro ao declinar", variant: "destructive" });
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDeleteTreatment = async (tid: string) => {
        setIsSubmitting(true);
        try {
            await treatmentService.remove(tid, token || undefined);
            toast({
                title: "Tratamento removido",
                description: "O tratamento e seus orçamentos foram excluídos permanentemente."
            });
            loadData();
            setSelectedTreatmentId(null);
            setTreatmentDetails(null);
        } catch (err: any) {
            toast({
                title: "Erro ao remover tratamento",
                description: err.message,
                variant: "destructive"
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleTreatmentSuccess = (data: any) => {
        const actualTreatment = data?.treatment ? data.treatment : data;
        const isEdit = openEditTreatment;

        setOpenCreateTreatment(false);
        setOpenEditTreatment(false);

        if (!actualTreatment || !actualTreatment.publicId) {
            loadData();
            return;
        }

        if (isEdit) {
            setTreatments(prev => prev.map(t => t.publicId === actualTreatment.publicId ? actualTreatment : t));
            setTreatmentDetails(actualTreatment);
        } else {
            setTreatments(prev => [actualTreatment, ...prev]);
            setSelectedTreatmentId(actualTreatment.publicId);
            setTreatmentDetails(actualTreatment);
        }

        loadData(true);
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

            {/* Patient data (read-only) */}
            <div className="bg-card rounded-lg border border-border p-5 mb-6">
                <h2 className="text-sm font-semibold text-foreground mb-4">Dados do Paciente</h2>
                <div className="grid grid-cols-2 gap-3 text-sm">
                    {[
                        ['CPF', patient.cpf],
                        ['Data de Nascimento', patient.nascimento ? new Date(patient.nascimento).toLocaleDateString('pt-BR') : '—'],
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
                    <Button
                        size="sm"
                        onClick={() => setOpenCreateTreatment(true)}
                        className="gap-2 font-bold uppercase text-[10px] h-9 px-4"
                    >
                        <Stethoscope className="h-4 w-4" /> Novo Tratamento
                    </Button>
                </div>

                <TreatmentAccordion
                    treatments={treatments}
                    selectedTreatmentId={selectedTreatmentId}
                    onSelect={setSelectedTreatmentId}
                    treatmentDetails={treatmentDetails}
                    budgets={budgets}
                    onEditTreatment={() => setOpenEditTreatment(true)}
                    onDeleteTreatment={handleDeleteTreatment}
                    /* Dentista NÃO cria orçamentos */
                    onAddBudget={undefined}
                    onViewBudget={setViewingBudget}
                    /* Dentista NÃO exclui orçamentos */
                    onDeleteBudget={() => {}}
                    isLoadingDetails={isLoadingDetails}
                    userRole="dentista"
                />
            </div>

            {/* Budget View Modal — Dentista pode Aprovar/Declinar + ver PDF */}
            <Dialog open={!!viewingBudget} onOpenChange={v => !v && setViewingBudget(null)}>
                <DialogContent className="max-w-lg">
                    <DialogHeader>
                        <DialogTitle>Detalhes do Orçamento</DialogTitle>
                    </DialogHeader>
                    {viewingBudget && (
                        <div className="space-y-6 py-2">
                            <div className="flex items-center justify-between border-b pb-4 border-border">
                                <div>
                                    <p className="text-xs font-semibold text-muted-foreground uppercase">Status</p>
                                    <span className={`text-xs px-2.5 py-1 rounded-full font-semibold inline-block mt-1 ${statusClass[viewingBudget?.status || 'pendente']}`}>
                                        {statusLabel[viewingBudget?.status || 'pendente']}
                                    </span>
                                </div>
                                <div className="text-right">
                                    <p className="text-xs font-semibold text-muted-foreground uppercase">Valor Total</p>
                                    <p className="text-xl font-bold text-foreground mt-0.5">
                                        {Number(viewingBudget.valor).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                                    </p>
                                </div>
                            </div>

                            <div className="space-y-3">
                                <p className="text-xs font-semibold text-muted-foreground uppercase">Descrição / Procedimentos</p>
                                <div className="bg-muted/30 rounded-md p-3 border border-border">
                                    <p className="text-sm text-foreground whitespace-pre-wrap">{viewingBudget.descricao}</p>
                                </div>
                            </div>

                            {/* Arquivos Anexados — Dentista pode visualizar/baixar */}
                            {viewingBudget.arquivos && viewingBudget.arquivos.length > 0 && (
                                <div className="space-y-3">
                                    <p className="text-xs font-semibold text-muted-foreground uppercase">Documentos Anexados ({viewingBudget.arquivos.length})</p>
                                    <div className="flex flex-col gap-2 max-h-[250px] overflow-y-auto pr-2 custom-scrollbar">
                                        {viewingBudget.arquivos.map((file) => (
                                            <div key={file.r2key} className="flex items-center gap-3 p-3 bg-muted/30 rounded-md border border-border">
                                                <FileText className="h-5 w-5 text-primary flex-shrink-0" />
                                                <div className="flex-1 overflow-hidden">
                                                    <p className="text-sm text-foreground truncate" title={file.nomeOriginal}>
                                                        {file.nomeOriginal}
                                                    </p>
                                                    <p className="text-[10px] text-muted-foreground uppercase">{file.formato}</p>
                                                </div>
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    className="gap-1.5 text-xs h-8"
                                                    onClick={() => window.open(file.downloadUrl, '_blank')}
                                                >
                                                    <Download className="h-3.5 w-3.5" /> Baixar
                                                </Button>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Ações do Dentista: Aprovar / Declinar */}
                            {viewingBudget?.status === 'pendente' && (
                                <div className="grid grid-cols-2 gap-3 pt-4 border-t border-border">
                                    <Button
                                        variant="outline"
                                        className="w-full text-red-600 hover:text-red-700 hover:bg-red-50"
                                        onClick={() => viewingBudget && handleDeclineBudget(viewingBudget.publicId)}
                                        loading={isSubmitting}
                                    >
                                        Declinar Orçamento
                                    </Button>
                                    <Button
                                        className="w-full bg-green-600 hover:bg-green-700 text-white"
                                        onClick={() => viewingBudget && handleApproveBudget(viewingBudget.publicId)}
                                        loading={isSubmitting}
                                    >
                                        Aprovar Orçamento
                                    </Button>
                                </div>
                            )}
                        </div>
                    )}
                    <DialogFooter>
                        <Button variant="secondary" onClick={() => setViewingBudget(null)} className="h-11 px-10 font-bold uppercase text-xs tracking-widest">Fechar</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* New Treatment Dialog */}
            <Dialog open={openCreateTreatment} onOpenChange={setOpenCreateTreatment}>
                <DialogContent className="max-w-[95vw] md:max-w-7xl h-[92vh] flex flex-col p-0 overflow-hidden gap-0">
                    <DialogHeader className="p-6 border-b border-border flex-shrink-0">
                        <DialogTitle className="flex items-center gap-2">
                            <Stethoscope className="h-5 w-5 text-primary" />
                            Novo Tratamento Clínico
                        </DialogTitle>
                    </DialogHeader>

                    <div className="flex-1 overflow-y-auto min-h-0 overscroll-contain">
                        <div className="p-6">
                            {patient && dentist && (
                                <TreatmentForm
                                    patientPublicId={patient.publicId}
                                    partnerPublicId={dentist.publicId}
                                    onSuccess={handleTreatmentSuccess}
                                    onCancel={() => setOpenCreateTreatment(false)}
                                />
                            )}
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Edit Treatment Dialog */}
            <Dialog open={openEditTreatment} onOpenChange={setOpenEditTreatment}>
                <DialogContent className="max-w-[95vw] md:max-w-7xl h-[92vh] flex flex-col p-0 overflow-hidden gap-0">
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
