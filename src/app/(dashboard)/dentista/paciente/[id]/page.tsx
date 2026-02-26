"use client"

import { useState, use, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { fetchPatient, fetchDentists, fetchBudgets, createBudget, deleteBudget, approveBudget, declineBudget } from '@/lib/api';
import { Budget, BudgetProcedure, Patient, Dentist } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { ArrowLeft, Plus, Trash2, FileText } from 'lucide-react';
import { FileManagement } from '@/components/FileManagement';

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
    params: Promise<{ id: string }>; // The id here is the CPF because of the folder structure
}

export default function DentistaPatientDetailPage({ params }: PageProps) {
    const router = useRouter();
    const { id: cpf } = use(params);

    const [patient, setPatient] = useState<Patient | null>(null);
    const [dentist, setDentist] = useState<Dentist | null>(null);

    const [budgets, setBudgets] = useState<Budget[]>([]);
    const [openBudget, setOpenBudget] = useState(false);
    const [viewingBudget, setViewingBudget] = useState<Budget | null>(null);
    const [procedures, setProcedures] = useState<BudgetProcedure[]>([{ id: generateId(), name: '', value: 0 }]);
    const [observations, setObservations] = useState('');
    const { toast } = useToast();

    const loadData = async () => {
        if (!cpf) return;
        // FIX: Using mock provider CPF until Clerk Auth is implemented
        const dentistCpf = '22222222222';
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
        toast({ title: "Orçamento excluído", variant: "destructive" });
        const b = await fetchBudgets(patient.cpf);
        setBudgets(b);
    };

    const handleApproveBudget = async (bid: string) => {
        const ok = await approveBudget(bid);
        if (ok) {
            toast({ title: "Orçamento aprovado!" });
            const b = await fetchBudgets(patient.cpf);
            setBudgets(b);
            setViewingBudget(null);
        } else {
            toast({ title: "Erro ao aprovar", variant: "destructive" });
        }
    };

    const handleDeclineBudget = async (bid: string) => {
        const ok = await declineBudget(bid);
        if (ok) {
            toast({ title: "Orçamento declinado" });
            const b = await fetchBudgets(patient.cpf);
            setBudgets(b);
            setViewingBudget(null);
        } else {
            toast({ title: "Erro ao declinar", variant: "destructive" });
        }
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

            <FileManagement patientCpf={patient.cpf} />

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
                                    <Button variant="outline" size="sm" onClick={() => setViewingBudget(b)} className="h-8 text-xs">
                                        Visualizar
                                    </Button>
                                    <Button variant="ghost" size="icon" onClick={() => handleDeleteBudget(b.id)}>
                                        <Trash2 className="h-4 w-4 text-destructive" />
                                    </Button>
                                </div>
                            </div>
                            <div className="text-xs text-muted-foreground line-clamp-1">
                                {b.procedures.length > 0 ? b.procedures.map(p => p.name).join(', ') : b.observations?.substring(0, 50)}
                            </div>
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
                                        {viewingBudget.totalValue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                                    </p>
                                </div>
                            </div>

                            <div className="space-y-3">
                                <p className="text-xs font-semibold text-muted-foreground uppercase">Procedimentos</p>
                                <div className="bg-muted/30 rounded-md p-3 space-y-2 border border-border">
                                    {viewingBudget.procedures.length > 0 ? (
                                        viewingBudget.procedures.map(p => (
                                            <div key={p.id} className="flex justify-between text-sm">
                                                <span>{p.name}</span>
                                                <span className="font-medium">{Number(p.value).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
                                            </div>
                                        ))
                                    ) : (
                                        <p className="text-sm text-foreground whitespace-pre-wrap">{viewingBudget.observations}</p>
                                    )}
                                </div>
                            </div>

                            {viewingBudget.procedures.length > 0 && viewingBudget.observations && (
                                <div className="space-y-1.5">
                                    <p className="text-xs font-semibold text-muted-foreground uppercase">Observações Extras</p>
                                    <p className="text-sm text-foreground bg-muted/20 p-3 rounded-md border border-border">
                                        {viewingBudget.observations}
                                    </p>
                                </div>
                            )}

                            {viewingBudget.status === 'pendente' && (
                                <div className="grid grid-cols-2 gap-3 pt-4 border-t border-border">
                                    <Button variant="outline" className="w-full text-red-600 hover:text-red-700 hover:bg-red-50" onClick={() => handleDeclineBudget(viewingBudget.id)}>
                                        Declinar Orçamento
                                    </Button>
                                    <Button className="w-full bg-green-600 hover:bg-green-700 text-white" onClick={() => handleApproveBudget(viewingBudget.id)}>
                                        Aprovar Orçamento
                                    </Button>
                                </div>
                            )}

                            {viewingBudget.justification && (
                                <div className="space-y-1.5 pt-2">
                                    <p className="text-xs font-semibold text-muted-foreground uppercase">Justificativa da Equipe</p>
                                    <p className="text-sm text-foreground p-3 rounded-md bg-amber-50 text-amber-900 border border-amber-200 italic">
                                        "{viewingBudget.justification}"
                                    </p>
                                </div>
                            )}
                        </div>
                    )}
                    <DialogFooter>
                        <Button variant="secondary" onClick={() => setViewingBudget(null)}>Fechar</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
