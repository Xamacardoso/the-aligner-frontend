"use client"

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { fetchPatients, createPatient, updatePatient, removePatient } from '@/lib/api';
import { Patient } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Pencil, Trash2, Eye } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';

const emptyPatient = (cpfParceiro: string): Patient => ({
    cpf: '',
    nome: '',
    nascimento: '',
    cpfParceiro,
    cnpjParceiro: '',
    queixaPrincipal: '',
    descricaoCaso: '',
    descricaoObjetivosTratamento: '',
    objetivoTratamento: '',
    apinhamento: '',
    observacoes: '',
    inicioTratamento: '',
    objetivosTratamentoObj: {
        linhaMediaSuperior: 'manter', linhaMeidaInferior: 'manter',
        overjet: 'manter', overbite: 'manter',
        formaArcoSuperior: 'manter', formaArcoInferior: 'manter',
    } as any,
    apinhamentoObj: {
        superiorAnterior: 'projetar_expandir', superiorPosterior: 'projetar_expandir',
        inferiorAnterior: 'projetar_expandir', inferiorPosterior: 'projetar_expandir',
    } as any,
});

export default function DentistaPatientsPage() {
    const router = useRouter();
    const { toast } = useToast();

    // FIX: Because we haven't implemented Clerk Auth yet, we use a mock dentist CPF.
    const dentistCpf = '12345678901';

    const [patients, setPatients] = useState<Patient[]>([]);
    const [open, setOpen] = useState(false);
    const [form, setForm] = useState<Patient>(emptyPatient(dentistCpf));
    const [isEditing, setIsEditing] = useState(false);
    const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

    const loadData = async () => {
        const data = await fetchPatients(dentistCpf);
        setPatients(data);
    };

    useEffect(() => {
        loadData();
    }, [dentistCpf]);

    const openCreate = () => { setIsEditing(false); setForm(emptyPatient(dentistCpf)); setOpen(true); };
    const openEdit = (p: Patient) => {
        setIsEditing(true);
        let objT = emptyPatient(dentistCpf).objetivosTratamentoObj;
        let apiT = emptyPatient(dentistCpf).apinhamentoObj;
        try { objT = { ...objT, ...JSON.parse(p.objetivoTratamento || '{}') }; } catch (e) { }
        try { apiT = { ...apiT, ...JSON.parse(p.apinhamento || '{}') }; } catch (e) { }
        setForm({ ...p, objetivosTratamentoObj: objT, apinhamentoObj: apiT });
        setOpen(true);
    };

    const setF = <K extends keyof Patient>(key: K, val: Patient[K]) => setForm(f => ({ ...f, [key]: val }));

    const handleSave = async () => {
        const payload = { ...form };
        payload.objetivoTratamento = JSON.stringify(payload.objetivosTratamentoObj || {});
        payload.apinhamento = JSON.stringify(payload.apinhamentoObj || {});

        if (isEditing) {
            await updatePatient(payload.cpf, payload);
            toast({ title: "Sucesso", description: "Paciente atualizado." });
        } else {
            await createPatient(form);
            toast({ title: "Sucesso", description: "Paciente criado." });
        }
        await loadData();
        setOpen(false);
    };

    const handleDelete = async (cpf: string) => {
        await removePatient(cpf);
        toast({ title: "Sucesso", description: "Paciente removido.", variant: "destructive" });
        await loadData();
        setDeleteConfirm(null);
    };

    return (
        <div className="p-8 h-[calc(100vh-80px)] overflow-hidden flex flex-col">
            <div className="flex items-center justify-between mb-6 flex-shrink-0">
                <div>
                    <h1 className="text-xl font-semibold text-foreground">Meus Pacientes</h1>
                    <p className="text-sm text-muted-foreground">Gerencie os pacientes vinculados a você</p>
                </div>
                <Button size="sm" onClick={openCreate} className="gap-1.5">
                    <Plus className="h-4 w-4" /> Novo Paciente
                </Button>
            </div>

            <div className="bg-card rounded-lg border border-border overflow-hidden flex-1 flex flex-col min-h-0">
                <ScrollArea className="flex-1">
                    <Table>
                        <TableHeader className="sticky top-0 bg-card z-10 shadow-sm">
                            <TableRow>
                                <TableHead>CPF</TableHead>
                                <TableHead>Nome</TableHead>
                                <TableHead>Nascimento</TableHead>
                                <TableHead className="w-28"></TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {patients.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                                        Nenhum paciente cadastrado.
                                    </TableCell>
                                </TableRow>
                            )}
                            {patients.map(p => (
                                <TableRow key={p.cpf}>
                                    <TableCell>{p.cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4")}</TableCell>
                                    <TableCell className="font-medium">{p.nome}</TableCell>
                                    <TableCell>{p.nascimento ? new Date(p.nascimento).toLocaleDateString('pt-BR') : '-'}</TableCell>
                                    <TableCell>
                                        <div className="flex gap-1 justify-end">
                                            <Button variant="ghost" size="icon" onClick={() => router.push(`/dentista/paciente/${p.cpf}`)}>
                                                <Eye className="h-4 w-4" />
                                            </Button>
                                            <Button variant="ghost" size="icon" onClick={() => openEdit(p)}>
                                                <Pencil className="h-4 w-4" />
                                            </Button>
                                            <Button variant="ghost" size="icon" onClick={() => setDeleteConfirm(p.cpf)}>
                                                <Trash2 className="h-4 w-4 text-destructive" />
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </ScrollArea>
            </div>

            {/* Patient Form Dialog */}
            <Dialog open={open} onOpenChange={setOpen}>
                <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col">
                    <DialogHeader className="flex-shrink-0">
                        <DialogTitle>{form.nascimento && form.nome ? 'Editar Paciente' : 'Novo Paciente'}</DialogTitle>
                    </DialogHeader>

                    <div className="flex-1 overflow-y-auto pr-2 py-4 space-y-6">
                        {/* Identificação */}
                        <section className="space-y-4">
                            <h3 className="font-medium text-sm text-muted-foreground border-b pb-1">Identificação</h3>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <Label>CPF *</Label>
                                    <Input
                                        value={form.cpf}
                                        onChange={e => setF('cpf', e.target.value.replace(/\D/g, '').slice(0, 11))}
                                        placeholder="Apenas números"
                                        disabled={patients.some(p => p.cpf === form.cpf) && form.nome.length > 0} // simple heuristic to disable CPF edit
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <Label>Nome Completo *</Label>
                                    <Input value={form.nome} onChange={e => setF('nome', e.target.value)} />
                                </div>
                                <div className="space-y-1.5">
                                    <Label>Data de Nascimento</Label>
                                    <Input type="date" value={form.nascimento || ''} onChange={e => setF('nascimento', e.target.value)} />
                                </div>
                                <div className="space-y-1.5">
                                    <Label>Data de Início do Tratamento</Label>
                                    <Input type="date" value={form.inicioTratamento || ''} onChange={e => setF('inicioTratamento', e.target.value)} />
                                </div>
                            </div>
                        </section>

                        {/* Informações Clínicas */}
                        <section className="space-y-4">
                            <h3 className="font-medium text-sm text-muted-foreground border-b pb-1">Informações Clínicas</h3>
                            <div className="space-y-4">
                                <div className="space-y-1.5">
                                    <Label>Queixa Principal</Label>
                                    <Textarea rows={2} value={form.queixaPrincipal || ''} onChange={e => setF('queixaPrincipal', e.target.value)} />
                                </div>
                                <div className="space-y-1.5">
                                    <Label>Descrição do Caso</Label>
                                    <Textarea rows={3} value={form.descricaoCaso || ''} onChange={e => setF('descricaoCaso', e.target.value)} />
                                </div>
                                <div className="space-y-1.5">
                                    <Label>Descrição dos Objetivos de Tratamento</Label>
                                    <Textarea rows={2} value={form.descricaoObjetivosTratamento || ''} onChange={e => setF('descricaoObjetivosTratamento', e.target.value)} placeholder="Ex: Ampliar maxila, corrigir mordida..." />
                                </div>

                                {/* Detailed Objectives */}
                                <div className="space-y-4 border-t pt-4 border-border">
                                    <h4 className="text-sm font-medium text-foreground">Objetivos Detalhados</h4>
                                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                        {[
                                            { k: 'linhaMediaSuperior', l: 'L. Média Superior' },
                                            { k: 'linhaMeidaInferior', l: 'L. Média Inferior' },
                                            { k: 'overjet', l: 'Overjet' },
                                            { k: 'overbite', l: 'Overbite' },
                                            { k: 'formaArcoSuperior', l: 'F. Arco Sup.' },
                                            { k: 'formaArcoInferior', l: 'F. Arco Inf.' },
                                        ].map(opt => (
                                            <div key={opt.k} className="space-y-1.5">
                                                <Label className="text-xs">{opt.l}</Label>
                                                <Select
                                                    value={form.objetivosTratamentoObj?.[opt.k as keyof typeof form.objetivosTratamentoObj] || "manter"}
                                                    onValueChange={v => setForm(f => ({ ...f, objetivosTratamentoObj: { ...f.objetivosTratamentoObj!, [opt.k]: v } }))}
                                                >
                                                    <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Selecione" /></SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="manter">Manter</SelectItem>
                                                        <SelectItem value="corrigir">Corrigir</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Detailed Crowding */}
                                <div className="space-y-4 border-t pt-4 border-border">
                                    <h4 className="text-sm font-medium text-foreground">Apinhamento</h4>
                                    <div className="grid grid-cols-2 gap-4">
                                        {[
                                            { k: 'superiorAnterior', l: 'Superior Anterior' },
                                            { k: 'superiorPosterior', l: 'Superior Posterior' },
                                            { k: 'inferiorAnterior', l: 'Inferior Anterior' },
                                            { k: 'inferiorPosterior', l: 'Inferior Posterior' },
                                        ].map(opt => (
                                            <div key={opt.k} className="space-y-1.5">
                                                <Label className="text-xs">{opt.l}</Label>
                                                <Select
                                                    value={form.apinhamentoObj?.[opt.k as keyof typeof form.apinhamentoObj] || "projetar_expandir"}
                                                    onValueChange={v => setForm(f => ({ ...f, apinhamentoObj: { ...f.apinhamentoObj!, [opt.k]: v } }))}
                                                >
                                                    <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="-" /></SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="projetar_expandir">Projetar/Exp</SelectItem>
                                                        <SelectItem value="inclinar">Inclinar</SelectItem>
                                                        <SelectItem value="ipr">IPR</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </section>

                        {/* Parceiro */}
                        <section className="space-y-4">
                            <h3 className="font-medium text-sm text-muted-foreground border-b pb-1">Vinculo de Clínicas (Parceiro)</h3>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <Label>CNPJ do Parceiro (Opcional)</Label>
                                    <Input value={form.cnpjParceiro || ''} onChange={e => setF('cnpjParceiro', e.target.value.replace(/\D/g, '').slice(0, 14))} placeholder="CNPJ da clínica executante" />
                                </div>
                            </div>
                        </section>

                        {/* Outros */}
                        <section className="space-y-4">
                            <h3 className="font-medium text-sm text-muted-foreground border-b pb-1">Adicionais</h3>
                            <div className="space-y-1.5">
                                <Label>Outras Observações</Label>
                                <Textarea rows={3} value={form.observacoes || ''} onChange={e => setF('observacoes', e.target.value)} />
                            </div>
                        </section>
                    </div>

                    <DialogFooter className="flex-shrink-0 pt-4 border-t mt-4 gap-2 border-border">
                        <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
                        <Button onClick={handleSave} disabled={!form.cpf || !form.nome}>
                            Salvar Paciente
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Delete Confirm */}
            <Dialog open={!!deleteConfirm} onOpenChange={val => !val && setDeleteConfirm(null)}>
                <DialogContent>
                    <DialogHeader><DialogTitle>Confirmar exclusão</DialogTitle></DialogHeader>
                    <p className="text-sm text-muted-foreground">Tem certeza que deseja excluir permanentemente este paciente?</p>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setDeleteConfirm(null)}>Cancelar</Button>
                        <Button variant="destructive" onClick={() => deleteConfirm && handleDelete(deleteConfirm)}>Excluir Paciente</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
