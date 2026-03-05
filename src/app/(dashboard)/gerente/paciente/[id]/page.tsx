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
import { ArrowLeft, Plus, Trash2, FileText, ClipboardList } from 'lucide-react';
import { FileManagement } from '@/components/FileManagement';
import { useToast } from '@/hooks/use-toast';

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
    params: Promise<{ id: string }>; // publicId of the patient
}

export default function GerentePatientDetailPage({ params }: PageProps) {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { id: publicId } = use(params);
    const { toast } = useToast();

    // In gerente view, we might need the partner CPF from somewhere or discover it
    const [patient, setPatient] = useState<PatientDetails | null>(null);
    const [dentist, setDentist] = useState<PartnerDetails | null>(null);

    const [treatments, setTreatments] = useState<TreatmentListItem[]>([]);
    const [selectedTreatmentId, setSelectedTreatmentId] = useState<string | null>(null);
    const [treatmentDetails, setTreatmentDetails] = useState<TreatmentDetails | null>(null);

    const [budgets, setBudgets] = useState<Budget[]>([]);
    const [openBudget, setOpenBudget] = useState(false);
    const [procedures, setProcedures] = useState<{ id: string, name: string, value: number }[]>([{ id: generateId(), name: '', value: 0 }]);
    const [observations, setObservations] = useState('');

    const loadData = async () => {
        if (!publicId) return;
        try {
            // Managers might not have a "partnerCpf" in their context, but we can try to find it
            // For now, assume it's passed or we use a discovery method.
            // Using a mock or discovering via some other API if needed.
            // Let's try to fetch with a broad context if backend allows or just use a param.
            const pCpf = searchParams.get('partnerCpf') || '22222222222';
            const foundP = await patientService.findOne(publicId, pCpf);
            setPatient(foundP);
            if (foundP) {
                const partner = await partnerService.findOne(foundP.partnerPublicId);
                setDentist(partner);

                const ts = await treatmentService.findByPatient(foundP.publicId, foundP.partnerPublicId);
                setTreatments(ts);
                if (ts.length > 0) setSelectedTreatmentId(ts[0].publicId);
            }
        } catch (err) {
            console.error(err);
        }
    };

    const loadTreatmentData = async (tid: string) => {
        try {
            const details = await treatmentService.findOne(tid);
            setTreatmentDetails(details);
            const b = await budgetService.findByTreatment(tid);
            setBudgets(b);
        } catch (err) {
            console.error(err);
        }
    };

    useEffect(() => {
        loadData();
    }, [publicId]);

    useEffect(() => {
        if (selectedTreatmentId) loadTreatmentData(selectedTreatmentId);
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
        let descricao = procedures.map(p => `${p.name}: R$ ${p.value}`).join('; ');
        if (observations) descricao += `\nObs: ${observations}`;

        try {
            await budgetService.create({
                tratamentoPublicId: selectedTreatmentId,
                valor: totalValue,
                descricao: descricao.substring(0, 400)
            });
            toast({ title: "Orçamento criado" });
            loadTreatmentData(selectedTreatmentId);
            setOpenBudget(false);
            setProcedures([{ id: generateId(), name: '', value: 0 }]);
            setObservations('');
        } catch (err) {
            toast({ title: "Erro ao criar", variant: "destructive" });
        }
    };

    const handleDeleteBudget = async (bid: string) => {
        try {
            await budgetService.cancel(bid);
            toast({ title: "Orçamento cancelado" });
            if (selectedTreatmentId) loadTreatmentData(selectedTreatmentId);
        } catch (err) {
            toast({ title: "Erro ao cancelar", variant: "destructive" });
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
                <div>
                    <h1 className="text-xl font-semibold text-foreground">{patient.nome}</h1>
                    <p className="text-sm text-muted-foreground">Dentista Responsável: {dentist?.nome ?? '—'}</p>
                </div>
                {selectedTreatmentId && (
                    <Button size="sm" onClick={() => setOpenBudget(true)} className="gap-1.5" title="Criar um novo orçamento para este tratamento">
                        <Plus className="h-4 w-4" /> Novo Orçamento
                    </Button>
                )}
            </div>

            {/* Identity */}
            <div className="bg-card rounded-lg border border-border p-5 mb-6">
                <h2 className="text-sm font-semibold text-foreground mb-4">Identificação do Paciente</h2>
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

            {/* Treatments Selection */}
            <div className="mb-6">
                <h2 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                    <ClipboardList className="h-4 w-4 text-primary" />
                    Tratamentos ({treatments.length})
                </h2>
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
                        </Button>
                    ))}
                </div>
            </div>

            {treatmentDetails && (
                <>
                    <div className="bg-card rounded-lg border border-border p-5 mb-6">
                        <h2 className="text-sm font-semibold text-foreground mb-4">Caso Clínico</h2>
                        {treatmentDetails.queixaPrincipal && (
                            <div className="mb-4">
                                <p className="text-xs font-semibold text-foreground uppercase">Queixa</p>
                                <p className="text-sm text-muted-foreground">{treatmentDetails.queixaPrincipal}</p>
                            </div>
                        )}
                        {treatmentDetails.descricaoCaso && (
                            <div className="mb-4">
                                <p className="text-xs font-semibold text-foreground uppercase">Descrição</p>
                                <p className="text-sm text-muted-foreground whitespace-pre-wrap">{treatmentDetails.descricaoCaso}</p>
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
                            <p className="text-sm text-muted-foreground p-5">Nenhum orçamento criado.</p>
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
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => handleDeleteBudget(b.publicId)}
                                                title="Cancelar este orçamento"
                                            >
                                                <Trash2 className="h-4 w-4 text-destructive" />
                                            </Button>
                                        </div>
                                    </div>
                                    <div className="text-xs text-muted-foreground line-clamp-2">
                                        {b.descricao}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </>
            )}

            {/* Budget Dialog */}
            <Dialog open={openBudget} onOpenChange={setOpenBudget}>
                <DialogContent>
                    <DialogHeader><DialogTitle>Novo Orçamento</DialogTitle></DialogHeader>
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
                        <Button variant="outline" onClick={() => setOpenBudget(false)}>Cancelar</Button>
                        <Button onClick={handleSaveBudget}>Salvar</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
