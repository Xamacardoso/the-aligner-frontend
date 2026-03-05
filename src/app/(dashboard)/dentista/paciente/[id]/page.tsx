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
import { ArrowLeft, Plus, Trash2, FileText, ClipboardList, Stethoscope, CheckCircle2 } from 'lucide-react';
import { FileManagement } from '@/components/FileManagement';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';

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
    const [clinicalObjectives, setClinicalObjectives] = useState<{ id: number, nome: string }[]>([]);
    const [crowdingTypes, setCrowdingTypes] = useState<{ id: number, nome: string }[]>([]);

    const [treatmentForm, setTreatmentForm] = useState({
        queixaPrincipal: '',
        descricaoCaso: '',
        observacoesAdicionais: '',
        dataInicio: new Date().toISOString().split('T')[0],
        objetivos: {} as Record<string, number>, // category -> id
        apinhamentos: [] as number[] // selected IDs
    });

    const { toast } = useToast();

    const loadData = async () => {
        if (!publicId) return;
        // FIX: Using mock provider CPF until Clerk Auth is implemented
        const dentistCpf = '22222222222';
        try {
            const foundP = await patientService.findOne(publicId, dentistCpf);
            setPatient(foundP);
            if (foundP) {
                const partner = await partnerService.findOne(foundP.partnerPublicId);
                setDentist(partner);

                // Load treatments
                const ts = await treatmentService.findByPatient(foundP.publicId, foundP.partnerPublicId);
                setTreatments(ts);
                if (ts.length > 0) {
                    setSelectedTreatmentId(ts[0].publicId);
                }
            }
        } catch (err) {
            console.error(err);
        }
    };

    const loadTreatmentData = async (treatmentId: string) => {
        try {
            const details = await treatmentService.findOne(treatmentId);
            setTreatmentDetails(details);
            const b = await budgetService.findByTreatment(treatmentId);
            setBudgets(b);
        } catch (err) {
            console.error(err);
        }
    };

    const loadClinicalAuxData = async () => {
        try {
            const [objs, crows] = await Promise.all([
                clinicalService.getTreatmentObjectives(),
                clinicalService.getCrowdingTypes()
            ]);
            setClinicalObjectives(objs);
            setCrowdingTypes(crows);
        } catch (err) {
            console.error("Erro ao carregar dados clínicos auxiliares", err);
        }
    };

    useEffect(() => {
        setMounted(true);
        loadData();
        loadClinicalAuxData();
    }, [publicId]);

    useEffect(() => {
        if (selectedTreatmentId) {
            loadTreatmentData(selectedTreatmentId);
        }
    }, [selectedTreatmentId]);

    if (!mounted) return null;
    if (!patient) return <div className="p-8 text-muted-foreground">Paciente não encontrado.</div>;

    const totalValue = procedures.reduce((s, p) => s + Number(p.value || 0), 0);

    const addProcedure = () => setProcedures(ps => [...ps, { id: generateId(), name: '', value: 0 }]);
    const removeProcedure = (pid: string) => setProcedures(ps => ps.filter(p => p.id !== pid));
    const updateProcedure = (pid: string, field: 'name' | 'value', val: string | number) => {
        setProcedures(ps => ps.map(p => p.id === pid ? { ...p, [field]: field === 'value' ? Number(val) : val } : p));
    };

    const handleSaveBudget = async () => {
        if (!selectedTreatmentId) return;

        let descricao = procedures.map(p => `${p.name}: R$ ${p.value}`).join('; ');
        if (observations) {
            descricao += `\nObs: ${observations}`;
        }

        try {
            await budgetService.create({
                tratamentoPublicId: selectedTreatmentId,
                valor: totalValue,
                descricao: descricao.substring(0, 400)
            });

            toast({ title: "Orçamento criado com sucesso!" });
            loadTreatmentData(selectedTreatmentId);
            setOpenBudget(false);
            setProcedures([{ id: generateId(), name: '', value: 0 }]);
            setObservations('');
        } catch (err) {
            toast({ title: "Erro ao criar orçamento", variant: "destructive" });
        }
    };

    const handleDeleteBudget = async (bid: string) => {
        try {
            await budgetService.cancel(bid);
            toast({ title: "Orçamento cancelado", variant: "destructive" });
            if (selectedTreatmentId) loadTreatmentData(selectedTreatmentId);
        } catch (err) {
            toast({ title: "Erro ao cancelar orçamento", variant: "destructive" });
        }
    };

    const handleApproveBudget = async (bid: string) => {
        try {
            await budgetService.approve(bid);
            toast({ title: "Orçamento aprovado!" });
            if (selectedTreatmentId) loadTreatmentData(selectedTreatmentId);
            setViewingBudget(null);
        } catch (err) {
            toast({ title: "Erro ao aprovar", variant: "destructive" });
        }
    };

    const handleDeclineBudget = async (bid: string) => {
        try {
            await budgetService.decline(bid);
            toast({ title: "Orçamento declinado" });
            if (selectedTreatmentId) loadTreatmentData(selectedTreatmentId);
            setViewingBudget(null);
        } catch (err) {
            toast({ title: "Erro ao declinar", variant: "destructive" });
        }
    };

    const handleSaveTreatment = async () => {
        if (!patient || !dentist) return;

        // Validation: all objectives must be filled
        const objectiveCategories = Array.from(new Set(clinicalObjectives.map(o => o.nome.split(' - ')[0])));
        if (objectiveCategories.some(cat => !treatmentForm.objetivos[cat])) {
            toast({ title: "Atenção", description: "Todos os objetivos de tratamento devem ser preenchidos.", variant: "destructive" });
            return;
        }

        try {
            await treatmentService.create({
                queixaPrincipal: treatmentForm.queixaPrincipal,
                descricaoCaso: treatmentForm.descricaoCaso,
                observacoesAdicionais: treatmentForm.observacoesAdicionais,
                dataInicio: treatmentForm.dataInicio,
                objetivosIds: Object.values(treatmentForm.objetivos),
                apinhamentosIds: treatmentForm.apinhamentos
            }, patient.publicId, dentist.publicId);

            toast({ title: "Tratamento criado com sucesso!" });
            setOpenCreateTreatment(false);
            loadData(); // Refresh treatments list

            // Reset form
            setTreatmentForm({
                queixaPrincipal: '',
                descricaoCaso: '',
                observacoesAdicionais: '',
                dataInicio: new Date().toISOString().split('T')[0],
                objetivos: {},
                apinhamentos: []
            });
        } catch (err) {
            toast({ title: "Erro ao criar tratamento", variant: "destructive" });
        }
    };

    // Grouping helper
    const groupedObjectives = clinicalObjectives.reduce((acc, obj) => {
        const [category, option] = obj.nome.split(' - ');
        if (!acc[category]) acc[category] = [];
        acc[category].push({ id: obj.id, option });
        return acc;
    }, {} as Record<string, { id: number, option: string }[]>);

    const groupedCrowding = crowdingTypes.reduce((acc, crow) => {
        const [category, option] = crow.nome.split(' - ');
        if (!acc[category]) acc[category] = [];
        acc[category].push({ id: crow.id, option });
        return acc;
    }, {} as Record<string, { id: number, option: string }[]>);

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
                <div>
                    <h1 className="text-xl font-semibold text-foreground">{patient.nome}</h1>
                    <p className="text-sm text-muted-foreground">Dentista: {dentist?.nome ?? '—'}</p>
                </div>
                {selectedTreatmentId && (
                    <Button size="sm" onClick={() => setOpenBudget(true)} className="gap-1.5" title="Criar um novo orçamento para este tratamento">
                        <Plus className="h-4 w-4" /> Novo Orçamento
                    </Button>
                )}
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

            {/* Treatments Selection */}
            <div className="mb-6">
                <div className="flex items-center justify-between mb-3">
                    <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
                        <ClipboardList className="h-4 w-4 text-primary" />
                        Tratamentos ({treatments.length})
                    </h2>
                    <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setOpenCreateTreatment(true)}
                        className="h-8 gap-1.5 text-xs"
                        title="Cadastrar um novo tratamento completo para este paciente"
                    >
                        <Stethoscope className="h-3.5 w-3.5" /> Novo Tratamento
                    </Button>
                </div>
                <div className="flex flex-wrap gap-2">
                    {treatments.map((t) => (
                        <Button
                            key={t.publicId}
                            variant={selectedTreatmentId === t.publicId ? "default" : "outline"}
                            size="sm"
                            onClick={() => setSelectedTreatmentId(t.publicId)}
                            className="text-xs h-8"
                        >
                            {t.dataInicio ? new Date(t.dataInicio).toLocaleDateString('pt-BR') : 'Início não definido'}
                            {t.queixaPrincipal && ` - ${t.queixaPrincipal.substring(0, 20)}...`}
                        </Button>
                    ))}
                    {treatments.length === 0 && (
                        <p className="text-sm text-muted-foreground italic">Nenhum tratamento registrado para este paciente.</p>
                    )}
                </div>
            </div>

            {treatmentDetails && (
                <>
                    <div className="bg-card rounded-lg border border-border p-5 mb-6">
                        <h2 className="text-sm font-semibold text-foreground mb-4">Detalhes do Tratamento Selecionado</h2>

                        {treatmentDetails.queixaPrincipal && (
                            <div className="mb-4">
                                <p className="text-xs font-semibold text-foreground uppercase">Queixa Principal</p>
                                <p className="text-sm text-muted-foreground mt-1">{treatmentDetails.queixaPrincipal}</p>
                            </div>
                        )}

                        {treatmentDetails.descricaoCaso && (
                            <div className="mb-4">
                                <p className="text-xs font-semibold text-foreground uppercase">Descrição do Caso</p>
                                <p className="text-sm text-muted-foreground mt-1">{treatmentDetails.descricaoCaso}</p>
                            </div>
                        )}

                        <div className="grid grid-cols-2 gap-4">
                            {treatmentDetails.objetivos && treatmentDetails.objetivos.length > 0 && (
                                <div>
                                    <p className="text-xs font-semibold text-foreground uppercase">Objetivos</p>
                                    <ul className="list-disc pl-4 mt-1 text-sm text-muted-foreground">
                                        {treatmentDetails.objetivos.map((o: any) => <li key={o.id}>{o.nome}</li>)}
                                    </ul>
                                </div>
                            )}
                            {treatmentDetails.apinhamentos && treatmentDetails.apinhamentos.length > 0 && (
                                <div>
                                    <p className="text-xs font-semibold text-foreground uppercase">Apinhamento</p>
                                    <ul className="list-disc pl-4 mt-1 text-sm text-muted-foreground">
                                        {treatmentDetails.apinhamentos.map((a: any) => <li key={a.id}>{a.nome}</li>)}
                                    </ul>
                                </div>
                            )}
                        </div>

                        {treatmentDetails.observacoesAdicionais && (
                            <div className="mt-4 pt-3 border-t border-border">
                                <p className="text-xs font-semibold text-foreground uppercase">Observações Extras</p>
                                <p className="text-sm text-muted-foreground mt-1">{treatmentDetails.observacoesAdicionais}</p>
                            </div>
                        )}
                    </div>

                    <FileManagement patientCpf={selectedTreatmentId || ''} />

                    {/* Budgets */}
                    <div className="bg-card rounded-lg border border-border overflow-hidden mt-6">
                        <div className="px-5 py-3 border-b border-border flex items-center gap-2">
                            <FileText className="h-4 w-4 text-muted-foreground" />
                            <h2 className="text-sm font-semibold text-foreground">Orçamentos do Tratamento</h2>
                        </div>
                        {budgets.length === 0 ? (
                            <p className="text-sm text-muted-foreground p-5">Nenhum orçamento para este tratamento.</p>
                        ) : (
                            budgets.map(b => (
                                <div key={b.publicId} className="px-5 py-4 border-b border-border last:border-b-0">
                                    <div className="flex items-center justify-between mb-2">
                                        <div className="flex items-center gap-2">
                                            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusClass[b.status]}`}>
                                                {statusLabel[b.status]}
                                            </span>
                                            <span className="text-xs text-muted-foreground">
                                                {b.dataCriacao ? new Date(b.dataCriacao).toLocaleDateString('pt-BR') : ''}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className="text-sm font-semibold text-foreground">
                                                {Number(b.valor).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                                            </span>
                                            <Button variant="outline" size="sm" onClick={() => setViewingBudget(b)} className="h-8 text-xs">
                                                Visualizar
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => handleDeleteBudget(b.publicId)}
                                                title="Cancelar orçamento"
                                            >
                                                <Trash2 className="h-4 w-4 text-destructive" />
                                            </Button>
                                        </div>
                                    </div>
                                    <div className="text-xs text-muted-foreground line-clamp-1">
                                        {b.descricao?.substring(0, 100)}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </>
            )}

            {/* Budget Dialog */}
            <Dialog open={openBudget} onOpenChange={setOpenBudget}>
                <DialogContent className="max-w-lg">
                    <DialogHeader>
                        <DialogTitle>Novo Orçamento</DialogTitle>
                    </DialogHeader>
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
                        <Button variant="outline" onClick={() => setOpenBudget(false)}>Cancelar</Button>
                        <Button onClick={handleSaveBudget} disabled={procedures.length === 0 || procedures.some(p => !p.name || !p.value)}>Salvar Orçamento</Button>
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

                            {viewingBudget.status === 'pendente' && (
                                <div className="grid grid-cols-2 gap-3 pt-4 border-t border-border">
                                    <Button variant="outline" className="w-full text-red-600 hover:text-red-700 hover:bg-red-50" onClick={() => handleDeclineBudget(viewingBudget.publicId)}>
                                        Declinar Orçamento
                                    </Button>
                                    <Button className="w-full bg-green-600 hover:bg-green-700 text-white" onClick={() => handleApproveBudget(viewingBudget.publicId)}>
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
                        <div className="p-6 space-y-8">
                            {/* Básicos */}
                            <section className="space-y-4">
                                <h3 className="text-sm font-bold uppercase tracking-tight text-foreground/70 flex items-center gap-2">
                                    <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                                    Informações Iniciais
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-1.5">
                                        <Label>Data de Início Estimada</Label>
                                        <Input
                                            type="date"
                                            value={treatmentForm.dataInicio}
                                            onChange={e => setTreatmentForm(f => ({ ...f, dataInicio: e.target.value }))}
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <Label>Queixa Principal</Label>
                                        <Input
                                            placeholder="Ex: Dentes tortos, dor, estética..."
                                            value={treatmentForm.queixaPrincipal}
                                            onChange={e => setTreatmentForm(f => ({ ...f, queixaPrincipal: e.target.value }))}
                                        />
                                    </div>
                                    <div className="col-span-full space-y-1.5">
                                        <Label>Descrição do Caso / Diagnóstico</Label>
                                        <Textarea
                                            placeholder="Descreva detalhes clínicos do caso..."
                                            value={treatmentForm.descricaoCaso}
                                            onChange={e => setTreatmentForm(f => ({ ...f, descricaoCaso: e.target.value }))}
                                            rows={3}
                                        />
                                    </div>
                                </div>
                            </section>

                            <Separator />

                            {/* Objetivos de Tratamento */}
                            <section className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <h3 className="text-sm font-bold uppercase tracking-tight text-foreground/70 flex items-center gap-2">
                                        <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                                        Objetivos de Tratamento
                                    </h3>
                                    <span className="text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded-full font-bold uppercase italic">Obrigatório escolher Manter ou Corrigir em cada item</span>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6 bg-muted/30 p-4 rounded-xl border border-border/50">
                                    {Object.entries(groupedObjectives).map(([cat, opts]) => (
                                        <div key={cat} className="space-y-2">
                                            <Label className="text-xs font-bold text-foreground inline-flex items-center gap-1">
                                                {cat}
                                                {treatmentForm.objetivos[cat] && <CheckCircle2 className="h-3 w-3 text-green-500" />}
                                            </Label>
                                            <RadioGroup
                                                className="flex items-center gap-4"
                                                value={treatmentForm.objetivos[cat]?.toString()}
                                                onValueChange={(val) => setTreatmentForm(f => ({
                                                    ...f,
                                                    objetivos: { ...f.objetivos, [cat]: parseInt(val) }
                                                }))}
                                            >
                                                {opts.map(opt => (
                                                    <div key={opt.id} className="flex items-center gap-2">
                                                        <RadioGroupItem value={opt.id.toString()} id={`obj-${opt.id}`} />
                                                        <label htmlFor={`obj-${opt.id}`} className="text-xs cursor-pointer hover:text-primary transition-colors">{opt.option}</label>
                                                    </div>
                                                ))}
                                            </RadioGroup>
                                        </div>
                                    ))}
                                </div>
                            </section>

                            <Separator />

                            {/* Apinhamento */}
                            <section className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <h3 className="text-sm font-bold uppercase tracking-tight text-foreground/70 flex items-center gap-2">
                                        <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                                        Apinhamento
                                    </h3>
                                    <span className="text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded-full font-bold uppercase italic">Selecione até 3 opções por categoria</span>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    {Object.entries(groupedCrowding).map(([cat, opts]) => (
                                        <div key={cat} className="space-y-3">
                                            <Label className="text-xs font-bold text-foreground border-l-2 border-primary pl-2">{cat}</Label>
                                            <div className="space-y-2 pl-2">
                                                {opts.map(opt => (
                                                    <div key={opt.id} className="flex items-center gap-2">
                                                        <Checkbox
                                                            id={`crowd-${opt.id}`}
                                                            checked={treatmentForm.apinhamentos.includes(opt.id)}
                                                            onCheckedChange={(checked) => {
                                                                if (checked) {
                                                                    // Check if already has 3 in this category
                                                                    const countInCategory = opts.filter(o => treatmentForm.apinhamentos.includes(o.id)).length;
                                                                    if (countInCategory >= 3) {
                                                                        toast({ title: "Limite atingido", description: "Limite de 3 seleções por categoria.", variant: "destructive" });
                                                                        return;
                                                                    }
                                                                    setTreatmentForm(f => ({ ...f, apinhamentos: [...f.apinhamentos, opt.id] }));
                                                                } else {
                                                                    setTreatmentForm(f => ({ ...f, apinhamentos: f.apinhamentos.filter(id => id !== opt.id) }));
                                                                }
                                                            }}
                                                        />
                                                        <label htmlFor={`crowd-${opt.id}`} className="text-xs leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer">{opt.option}</label>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </section>

                            <Separator />

                            {/* Observações Extras */}
                            <section className="space-y-2">
                                <Label>Observações Adicionais</Label>
                                <Textarea
                                    placeholder="Qualquer outra nota relevante para o tratamento..."
                                    value={treatmentForm.observacoesAdicionais}
                                    onChange={e => setTreatmentForm(f => ({ ...f, observacoesAdicionais: e.target.value }))}
                                    rows={2}
                                />
                            </section>
                        </div>
                    </div>

                    <DialogFooter className="p-6 border-t border-border bg-muted/20 flex-shrink-0">
                        <Button variant="ghost" onClick={() => setOpenCreateTreatment(false)}>Cancelar</Button>
                        <Button onClick={handleSaveTreatment} className="min-w-[150px]">Criar Tratamento</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
