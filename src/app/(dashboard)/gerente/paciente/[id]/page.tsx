"use client"

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
import { ArrowLeft, Plus, Trash2, FileText, ClipboardList, User, Loader2, Pencil, Calendar } from 'lucide-react';
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

// Generates a mock ID for now
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

    // In gerente view, we might need the partner CPF from somewhere or discover it
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
    const [openEditPatient, setOpenEditPatient] = useState(false);
    const [patientForm, setPatientForm] = useState({ cpf: '', nome: '', nascimento: '' });

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

        // Se já temos os detalhes e não é um refresh forçado (silent), evitamos o fetch redundante
        if (!silent && treatmentDetails?.publicId === tid) {
            return;
        }

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

            // 1. Fechamos o modal primeiro e limpamos o formulário
            setOpenBudget(false);
            setProcedures([{ id: generateId(), name: '', value: 0 }]);
            setObservations('');

            // 2. Atualização otimista e scroll
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
                }, 450);
            }

            // 4. Sincronismo em background (SILENCIOSO)
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
                description: "O orçamento foi removido com sucesso."
            });
            if (selectedTreatmentId) loadTreatmentData(selectedTreatmentId, true);
            setBudgetToDelete(null);
        } catch (err) {
            toast({ title: "Erro ao cancelar", variant: "destructive" });
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
                description: "O tratamento e seus orçamentos foram excluídos com sucesso."
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

    const openEditPatientModal = () => {
        if (!patient) return;
        setPatientForm({
            cpf: patient.cpf,
            nome: patient.nome,
            nascimento: patient.nascimento ? new Date(patient.nascimento).toISOString().split('T')[0] : ''
        });
        setOpenEditPatient(true);
    };

    const handleSavePatient = async () => {
        if (!publicId || !token) return;
        setIsSubmitting(true);
        try {
            await patientService.update(publicId, {
                nomePaciente: patientForm.nome,
                cpfPaciente: patientForm.cpf,
                dataNascimento: patientForm.nascimento
            }, token);
            
            toast({ title: "Paciente atualizado com sucesso!" });
            setOpenEditPatient(false);
            loadData();
        } catch (err: any) {
            toast({
                title: "Erro ao atualizar paciente",
                description: err.message,
                variant: "destructive"
            });
        } finally {
            setIsSubmitting(false);
        }
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
                    <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={openEditPatientModal}
                        className="h-8 gap-2 text-[10px] font-bold uppercase"
                    >
                        <Pencil className="h-3.5 w-3.5" /> Editar Dados
                    </Button>
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
                    onEditTreatment={() => setOpenEditTreatment(true)}
                    onDeleteTreatment={handleDeleteTreatment}
                    onAddBudget={() => setOpenBudget(true)}
                    onViewBudget={setViewingBudget}
                    onDeleteBudget={setBudgetToDelete}
                    isLoadingDetails={isLoadingDetails}
                />
            </div>

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
                                    <span className={`text-xs px-2.5 py-1 rounded-full font-semibold inline-block mt-1 ${statusClass[viewingBudget.status]}`}>
                                        {statusLabel[viewingBudget.status]}
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
                        </div>
                    )}
                    <DialogFooter>
                        <Button variant="secondary" onClick={() => setViewingBudget(null)}>Fechar</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Budget Dialog */}
            <Dialog open={openBudget} onOpenChange={setOpenBudget}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Novo Orçamento</DialogTitle>
                    </DialogHeader>

                    {isSubmitting && (
                        <div className="absolute inset-0 bg-background/50 backdrop-blur-[1px] flex flex-col items-center justify-center z-50 rounded-lg animate-in fade-in duration-300">
                            <Loader2 className="h-8 w-8 animate-spin text-primary" />
                            <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mt-4">Processando...</p>
                        </div>
                    )}
                    {/* Simplified procedure list omitted for Gerente if desired, or kept same */}
                    <div className="space-y-4 py-4 pr-2">
                        <Label>Descrição / Procedimentos</Label>
                        <Textarea
                            rows={10}
                            placeholder="Descreva os itens do orçamento..."
                            value={observations}
                            onChange={e => setObservations(e.target.value)}
                        />
                        <div className="mt-2 text-right">
                            <Label>Valor Total (BRL)</Label>
                            <Input
                                type="number"
                                className="w-40 ml-auto mt-1"
                                placeholder="0.00"
                                onChange={e => setProcedures([{ id: 'val', name: 'Total', value: Number(e.target.value) }])}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setOpenBudget(false)} disabled={isSubmitting}>Cancelar</Button>
                        <Button onClick={handleSaveBudget} loading={isSubmitting} disabled={totalValue === 0}>Salvar Orçamento</Button>
                    </DialogFooter>
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

            {/* Edit Patient Dialog */}
            <Dialog open={openEditPatient} onOpenChange={setOpenEditPatient}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <User className="h-5 w-5 text-primary" />
                            Editar Identificação do Paciente
                        </DialogTitle>
                    </DialogHeader>

                    <div className="py-6 space-y-4">
                        <div className="space-y-1.5">
                            <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">CPF *</Label>
                            <Input
                                value={patientForm.cpf}
                                onChange={e => setPatientForm(f => ({ ...f, cpf: e.target.value.replace(/\D/g, '').slice(0, 11) }))}
                                placeholder="Apenas números"
                                disabled
                                className="bg-muted cursor-not-allowed h-11"
                            />
                        </div>
                        <div className="space-y-1.5">
                            <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Nome Completo *</Label>
                            <Input 
                                value={patientForm.nome} 
                                onChange={e => setPatientForm(f => ({ ...f, nome: e.target.value }))}
                                className="h-11"
                            />
                        </div>
                        <div className="space-y-1.5">
                            <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Data de Nascimento</Label>
                            <div className="relative">
                                <Input 
                                    type="date" 
                                    value={patientForm.nascimento} 
                                    onChange={e => setPatientForm(f => ({ ...f, nascimento: e.target.value }))}
                                    className="h-11"
                                />
                            </div>
                        </div>
                    </div>

                    <DialogFooter className="gap-2 sm:gap-0">
                        <Button variant="outline" onClick={() => setOpenEditPatient(false)} className="h-11 px-8">Cancelar</Button>
                        <Button onClick={handleSavePatient} disabled={!patientForm.nome} loading={isSubmitting} className="h-11 px-8">
                            Atualizar Dados
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
