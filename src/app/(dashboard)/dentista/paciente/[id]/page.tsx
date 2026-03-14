"use client"

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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ArrowLeft, Plus, Trash2, FileText, ClipboardList, Stethoscope, CheckCircle2, Pencil, User, Loader2, AlertCircle } from 'lucide-react';
import { FileManagement } from '@/components/FileManagement';
import { Separator } from '@/components/ui/separator';
import { TreatmentForm } from '@/components/treatment/TreatmentForm';
import { TreatmentAccordion } from '@/components/treatment/TreatmentAccordion';
import { ConfirmActionDialog } from '@/components/ConfirmActionDialog';
import { useAppAuth } from '@/hooks/use-app-auth';

const formatNestedObj = (jsonStr: string) => {
    try {
        const obj = JSON.parse(jsonStr);
        return (
            <ul className="list-disc pl-4 mt-1 space-y-0.5 text-sm text-foreground">
                {Object.entries(obj).map(([k, v]) => (
                    <li key={k}>
                        <span className="capitalize">{k.replace(/([A-Z])/g, ' $1')}</span>: <strong>{v as string}</strong>
                    </li>
                ))}
            </ul>
        );
    } catch {
        return <p className="text-sm text-foreground mt-1">{jsonStr}</p>;
    }
};

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

// Generates a mock ID for now
const generateId = () => Math.random().toString(36).substr(2, 9);

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
    const [openBudget, setOpenBudget] = useState(false);
    const [viewingBudget, setViewingBudget] = useState<Budget | null>(null);
    const [procedures, setProcedures] = useState<{ id: string, name: string, value: number }[]>([{ id: generateId(), name: '', value: 0 }]);
    const [observations, setObservations] = useState('');

    const [openCreateTreatment, setOpenCreateTreatment] = useState(false);
    const [openEditTreatment, setOpenEditTreatment] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [isLoadingDetails, setIsLoadingDetails] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [budgetToDelete, setBudgetToDelete] = useState<string | null>(null);

    const { toast } = useToast();
    const { token, user: activeUser, isLoaded } = useAppAuth();

    const loadData = async (silent = false) => {
        if (!publicId || !isLoaded || !token) return;
        if (!silent) setIsLoading(true);
        try {
            // First, get the patient to find the partnerPublicId
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
            console.error(err);
            toast({ title: "Erro ao carregar dados do paciente", variant: "destructive" });
        } finally {
            if (!silent) setIsLoading(false);
        }
    };

    const loadTreatmentData = async (treatmentId: string, silent = false) => {
        if (!treatmentId || !token) {
            return;
        }

        // Se já temos os detalhes e não é um refresh forçado (silent), evitamos o fetch redundante
        if (!silent && treatmentDetails?.publicId === treatmentId) {
            return;
        }

        if (!silent) setIsLoadingDetails(true);
        try {
            const details = await treatmentService.findOne(treatmentId, token);

            if (!details || !details.publicId) {
                console.error('[ERROR] Detalhes inválidos retornados pela API:', details);
                return;
            }

            setTreatmentDetails(details);
            const b = await budgetService.findByTreatment(treatmentId, token || undefined);
            setBudgets(b);
        } catch (err: any) {
            console.error(`[ERROR] Falha ao carregar tratamento "${treatmentId}":`, err);

            // Tratamento especial para 404 intermitente (pode ser delay de escrita em DBs distribuídos/replicados)
            if (err.message?.includes('404') || err.message?.includes('não encontrado')) {
                toast({
                    title: "Sincronizando dados...",
                    description: "Houve um pequeno atraso na resposta do servidor. Tentando novamente...",
                    variant: "default"
                });
                // Tentativa de retry único após 1.5s
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

    const totalValue = procedures.reduce((s, p) => s + Number(p.value || 0), 0);

    const addProcedure = () => setProcedures(ps => [...ps, { id: generateId(), name: '', value: 0 }]);
    const removeProcedure = (pid: string) => setProcedures(ps => ps.filter(p => p.id !== pid));
    const updateProcedure = (pid: string, field: 'name' | 'value', val: string | number) => {
        setProcedures(ps => ps.map(p => p.id === pid ? { ...p, [field]: field === 'value' ? Number(val) : val } : p));
    };

    const handleSaveBudget = async () => {
        if (!selectedTreatmentId) return;

        setIsSubmitting(true);
        let descricao = procedures.map(p => `${p.name}: R$ ${p.value}`).join('; ');
        if (observations) {
            descricao += `\nObs: ${observations}`;
        }

        try {
            const newBudget = await budgetService.create({
                tratamentoPublicId: selectedTreatmentId,
                valor: totalValue,
                descricao: descricao.substring(0, 400)
            }, token || undefined);

            // 1. Fechamos o modal primeiro para garantir a UI fluida e limpar estado
            setOpenBudget(false);
            setProcedures([{ id: generateId(), name: '', value: 0 }]);
            setObservations('');

            // 2. Atualizamos a lista localmente (otimista)
            if (newBudget && typeof newBudget === 'object' && newBudget.publicId) {
                setBudgets(prev => [newBudget, ...prev]);
                toast({ title: "Orçamento criado com sucesso!" });

                // 3. Foca no novo item (scroll suave) e destaca
                setTimeout(() => {
                    const el = document.getElementById(`budget-${newBudget.publicId}`);
                    if (el) {
                        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                        el.classList.add('ring-2', 'ring-primary', 'bg-primary/5', 'scale-[1.02]');
                        setTimeout(() => el.classList.remove('ring-2', 'ring-primary', 'bg-primary/5', 'scale-[1.02]'), 2000);
                    }
                }, 400);
            }

            // 4. Sincronismo em background (SILENCIOSO - sem loading visual)
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

    const handleCancelBudget = async () => {
        if (!budgetToDelete) return;

        setIsSubmitting(true);
        try {
            await budgetService.cancel(budgetToDelete, token || undefined);
            toast({
                title: "Orçamento cancelado",
                description: "O status do orçamento foi alterado para cancelado."
            });
            if (selectedTreatmentId) loadTreatmentData(selectedTreatmentId);
            setBudgetToDelete(null);
        } catch (err) {
            toast({ title: "Erro ao cancelar orçamento", variant: "destructive" });
        } finally {
            setIsSubmitting(false);
        }
    };

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
        // Extrai o objeto treatment caso ele venha embrulhado pelo backend antiga/erradamente
        const actualTreatment = data?.treatment ? data.treatment : data;
        const isEdit = openEditTreatment;

        console.log('[DEBUG] handleTreatmentSuccess recebido:', actualTreatment);

        // 1. Fechar modais imediatamente
        setOpenCreateTreatment(false);
        setOpenEditTreatment(false);

        if (!actualTreatment || !actualTreatment.publicId) {
            console.error('[ERROR] Objeto de tratamento inválido após sucesso:', actualTreatment);
            loadData(); // Recuperação de emergência
            return;
        }

        // 2. Atualização otimista
        if (isEdit) {
            setTreatments(prev => prev.map(t => t.publicId === actualTreatment.publicId ? actualTreatment : t));
            setTreatmentDetails(actualTreatment);
        } else {
            setTreatments(prev => [actualTreatment, ...prev]);
            setSelectedTreatmentId(actualTreatment.publicId);
            setTreatmentDetails(actualTreatment);
        }

        // 3. Sincronismo silencioso
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
                    onAddBudget={() => setOpenBudget(true)}
                    onViewBudget={setViewingBudget}
                    onDeleteBudget={setBudgetToDelete}
                    isLoadingDetails={isLoadingDetails}
                />
            </div>


            {/* Budget Dialog */}
            <Dialog open={openBudget} onOpenChange={setOpenBudget}>
                <DialogContent className="max-w-lg">
                    <DialogHeader>
                        <DialogTitle>Novo Orçamento</DialogTitle>
                    </DialogHeader>

                    {isSubmitting && (
                        <div className="absolute inset-0 bg-background/50 backdrop-blur-[1px] flex flex-col items-center justify-center z-50 rounded-lg animate-in fade-in duration-300">
                            <Loader2 className="h-8 w-8 animate-spin text-primary" />
                            <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mt-4">Processando...</p>
                        </div>
                    )}
                    <div className="space-y-4 py-2 max-h-[60vh] overflow-y-auto pr-2">
                        <div>
                            <div className="flex items-center justify-between mb-2">
                                <Label>Procedimentos</Label>
                                <Button variant="ghost" size="sm" onClick={addProcedure} className="h-7 gap-1 text-xs">
                                    <Plus className="h-3 w-3" /> Adicionar
                                </Button>
                            </div>
                            <div className="space-y-2">
                                {procedures.map(proc => (
                                    <div key={proc.id} className="flex gap-2 items-center">
                                        <Input
                                            placeholder="Nome do procedimento"
                                            value={proc.name}
                                            className="flex-1"
                                            onChange={e => updateProcedure(proc.id, 'name', e.target.value)}
                                        />
                                        <Input
                                            type="number"
                                            placeholder="Valor"
                                            value={proc.value || ''}
                                            className="w-28"
                                            onChange={e => updateProcedure(proc.id, 'value', e.target.value)}
                                        />
                                        <Button variant="ghost" size="icon" onClick={() => removeProcedure(proc.id)} title="Remover procedimento">
                                            <Trash2 className="h-4 w-4 text-destructive" />
                                        </Button>
                                    </div>
                                ))}
                            </div>
                            <p className="text-sm font-medium text-foreground mt-2 text-right">
                                Total: {totalValue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                            </p>
                        </div>
                        <div className="space-y-1.5">
                            <Label>Observações</Label>
                            <Textarea
                                value={observations}
                                onChange={e => setObservations(e.target.value)}
                                placeholder="Observações sobre o orçamento..."
                                rows={3}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setOpenBudget(false)} disabled={isSubmitting}>Cancelar</Button>
                        <Button onClick={handleSaveBudget} loading={isSubmitting} disabled={procedures.length === 0 || procedures.some(p => !p.name || !p.value)}>Salvar Orçamento</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Budget View Modal */}
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
                        <Button variant="secondary" onClick={() => setViewingBudget(null)}>Fechar</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
            {/* New Treatment Dialog */}
            <Dialog open={openCreateTreatment} onOpenChange={setOpenCreateTreatment}>
                <DialogContent className="max-w-3xl h-[80vh] flex flex-col p-0 overflow-hidden gap-0">
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
                <DialogContent className="max-w-3xl h-[80vh] flex flex-col p-0 overflow-hidden gap-0">
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

            {/* Confirmation Dialog for Budget Cancellation */}
            <ConfirmActionDialog
                open={!!budgetToDelete}
                onOpenChange={(open) => !open && setBudgetToDelete(null)}
                onConfirm={handleCancelBudget}
                isLoading={isSubmitting}
                title="Confirmar Cancelamento"
                description="Tem certeza que deseja cancelar este orçamento? O status será alterado para 'Cancelado', permitindo filtragem posterior."
                confirmText="Confirmar"
            />
        </div>
    );
}
