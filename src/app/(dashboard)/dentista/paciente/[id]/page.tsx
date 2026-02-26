"use client"

import { useState, use, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { fetchPatient, fetchDentists, fetchBudgets, createBudget, deleteBudget } from '@/lib/api';
import { Budget, BudgetProcedure, Patient, Dentist } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { ArrowLeft, Plus, Trash2, FileText } from 'lucide-react';

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
    deferido: 'Deferido',
    indeferido: 'Indeferido',
};
const statusClass: Record<string, string> = {
    pendente: 'bg-muted text-muted-foreground',
    deferido: 'bg-green-100 text-green-700',
    indeferido: 'bg-red-100 text-red-700',
};

// Generates a mock ID for now
const generateId = () => Math.random().toString(36).substr(2, 9);

interface PageProps {
    params: Promise<{ id: string }>; // The id here is the CPF because of the folder structure
}

export default function DentistaPatientDetailPage({ params }: PageProps) {
    const router = useRouter();
    const { id: cpf } = use(params);

    const [patient, setPatient] = useState<Patient | null>(null);
    const [dentist, setDentist] = useState<Dentist | null>(null);

    const [budgets, setBudgets] = useState<Budget[]>([]);
    const [openBudget, setOpenBudget] = useState(false);
    const [procedures, setProcedures] = useState<BudgetProcedure[]>([{ id: generateId(), name: '', value: 0 }]);
    const [observations, setObservations] = useState('');

    const loadData = async () => {
        if (!cpf) return;
        // FIX: Using mock provider CPF until Clerk Auth is implemented
        const dentistCpf = '12345678901';
        const foundP = await fetchPatient(cpf, dentistCpf);
        setPatient(foundP);
        if (foundP) {
            const dentists = await fetchDentists();
            setDentist(dentists.find(d => d.cpf === foundP.cpfParceiro) || null);
            const b = await fetchBudgets(foundP.cpf);
            setBudgets(b);
        }
    };

    useEffect(() => {
        loadData();
    }, [cpf]);


    if (!patient) return <div className="p-8 text-muted-foreground">Paciente não encontrado.</div>;

    const totalValue = procedures.reduce((s, p) => s + Number(p.value || 0), 0);

    const addProcedure = () => setProcedures(ps => [...ps, { id: generateId(), name: '', value: 0 }]);
    const removeProcedure = (pid: string) => setProcedures(ps => ps.filter(p => p.id !== pid));
    const updateProcedure = (pid: string, field: 'name' | 'value', val: string | number) => {
        setProcedures(ps => ps.map(p => p.id === pid ? { ...p, [field]: field === 'value' ? Number(val) : val } : p));
    };

    const handleSaveBudget = async () => {
        let descricao = procedures.map(p => `${p.name}: R$ ${p.value}`).join('; ');
        if (observations) {
            descricao += `\nObs: ${observations}`;
        }
        await createBudget({
            pacienteCpf: patient.cpf,
            valor: totalValue,
            descricao: descricao.substring(0, 255) // max length in DB
        });

        const b = await fetchBudgets(patient.cpf);
        setBudgets(b);
        setOpenBudget(false);
        setProcedures([{ id: generateId(), name: '', value: 0 }]);
        setObservations('');
    };

    const handleDeleteBudget = async (bid: string) => {
        await deleteBudget(bid);
        const b = await fetchBudgets(patient.cpf);
        setBudgets(b);
    };

    return (
        <div className="p-8 max-w-4xl">
            <button onClick={() => router.back()} className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-5 transition-colors">
                <ArrowLeft className="h-4 w-4" /> Voltar
            </button>

            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-xl font-semibold text-foreground">{patient.nome}</h1>
                    <p className="text-sm text-muted-foreground">Dentista: {dentist?.nome ?? '—'}</p>
                </div>
                <Button size="sm" onClick={() => setOpenBudget(true)} className="gap-1.5">
                    <Plus className="h-4 w-4" /> Novo Orçamento
                </Button>
            </div>

            {/* Patient data (read-only) */}
            <div className="bg-card rounded-lg border border-border p-5 mb-6">
                <h2 className="text-sm font-semibold text-foreground mb-4">Dados do Paciente</h2>
                <div className="grid grid-cols-2 gap-3 text-sm">
                    {[
                        ['CPF', patient.cpf],
                        ['Data de Nascimento', patient.nascimento],
                        ['Início Tratamento', patient.inicioTratamento],
                        ['CNPJ Parceiro', patient.cnpjParceiro],
                    ].map(([label, value]) => (
                        <div key={label}>
                            <span className="text-muted-foreground">{label}: </span>
                            <span className="text-foreground">{value || '—'}</span>
                        </div>
                    ))}
                </div>
                {patient.queixaPrincipal && (
                    <div className="mt-4">
                        <p className="text-xs font-semibold text-muted-foreground uppercase">Queixa Principal</p>
                        <p className="text-sm text-foreground mt-1">{patient.queixaPrincipal}</p>
                    </div>
                )}
                {patient.descricaoCaso && (
                    <div className="mt-3">
                        <p className="text-xs font-semibold text-muted-foreground uppercase">Descrição do Caso</p>
                        <p className="text-sm text-foreground mt-1">{patient.descricaoCaso}</p>
                    </div>
                )}
                <div className="grid grid-cols-2 gap-4 mt-3">
                    {patient.objetivoTratamento && (
                        <div>
                            <p className="text-xs font-semibold text-muted-foreground uppercase">Objetivos Detalhados</p>
                            {formatNestedObj(patient.objetivoTratamento)}
                        </div>
                    )}
                    {patient.apinhamento && (
                        <div>
                            <p className="text-xs font-semibold text-muted-foreground uppercase">Apinhamento</p>
                            {formatNestedObj(patient.apinhamento)}
                        </div>
                    )}
                </div>
                {patient.observacoes && (
                    <div className="mt-3 pt-3 border-t border-border">
                        <p className="text-xs font-semibold text-muted-foreground uppercase">Outras Observações</p>
                        <p className="text-sm text-foreground mt-1">{patient.observacoes}</p>
                    </div>
                )}
            </div>

            {/* Budgets */}
            <div className="bg-card rounded-lg border border-border overflow-hidden">
                <div className="px-5 py-3 border-b border-border flex items-center gap-2">
                    <FileText className="h-4 w-4 text-muted-foreground" />
                    <h2 className="text-sm font-semibold text-foreground">Orçamentos</h2>
                </div>
                {budgets.length === 0 ? (
                    <p className="text-sm text-muted-foreground p-5">Nenhum orçamento criado.</p>
                ) : (
                    budgets.map(b => (
                        <div key={b.id} className="px-5 py-4 border-b border-border last:border-b-0">
                            <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-2">
                                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusClass[b.status]}`}>
                                        {statusLabel[b.status]}
                                    </span>
                                    <span className="text-xs text-muted-foreground">{b.createdAt}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="text-sm font-semibold text-foreground">
                                        {b.totalValue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                                    </span>
                                    <Button variant="ghost" size="icon" onClick={() => handleDeleteBudget(b.id)}>
                                        <Trash2 className="h-4 w-4 text-destructive" />
                                    </Button>
                                </div>
                            </div>
                            <ul className="text-xs text-muted-foreground space-y-0.5 mt-2">
                                {b.procedures.map(p => (
                                    <li key={p.id}>• {p.name} — <span className="text-foreground">{Number(p.value).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span></li>
                                ))}
                            </ul>
                            {b.observations && <p className="text-sm text-muted-foreground mt-3 pt-2 border-t border-border">Obs: {b.observations}</p>}
                            {b.justification && <p className="text-sm text-muted-foreground mt-1">Justificativa: {b.justification}</p>}
                        </div>
                    ))
                )}
            </div>

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
                                        <Button variant="ghost" size="icon" onClick={() => removeProcedure(proc.id)}>
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
        </div>
    );
}
