"use client"

import { useState, useEffect } from 'react';
import { fetchDentists, createDentist, updateDentist, removeDentist } from '@/lib/api';
import { Dentist } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';

const emptyDentist = (): Dentist => ({
    cpf: '',
    nome: '',
    cro: '',
    croUf: '',
    email: '',
    telefone: '',
    tipoUsuarioId: 2, // 2 = Parceiro default
});

export default function GerenteDentistasPage() {
    const { toast } = useToast();
    const [dentists, setDentists] = useState<Dentist[]>([]);
    const [open, setOpen] = useState(false);
    const [form, setForm] = useState<Dentist>(emptyDentist());
    const [isEditing, setIsEditing] = useState(false);
    const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

    const loadData = async () => {
        const data = await fetchDentists();
        setDentists(data);
    };

    useEffect(() => {
        loadData();
    }, []);

    const openCreate = () => { setIsEditing(false); setForm(emptyDentist()); setOpen(true); };
    const openEdit = (d: Dentist) => { setIsEditing(true); setForm({ ...d }); setOpen(true); };

    const handleSave = async () => {
        if (isEditing) {
            await updateDentist(form.cpf, form);
            toast({ title: "Sucesso", description: "Parceiro atualizado." });
        } else {
            await createDentist(form);
            toast({ title: "Sucesso", description: "Parceiro criado." });
        }
        await loadData();
        setOpen(false);
    };

    const handleDelete = async (cpf: string) => {
        await removeDentist(cpf);
        toast({ title: "Sucesso", description: "Parceiro removido.", variant: "destructive" });
        await loadData();
        setDeleteConfirm(null);
    };

    // Helper for input updates
    const updateForm = (field: keyof Dentist, value: string | number) => {
        setForm(f => ({ ...f, [field]: value }));
    };

    return (
        <div className="p-8 h-[calc(100vh-80px)] overflow-hidden flex flex-col">
            <div className="flex items-center justify-between mb-6 flex-shrink-0">
                <div>
                    <h1 className="text-xl font-semibold text-foreground">Dentistas Parceiros</h1>
                    <p className="text-sm text-muted-foreground">Gerencie os dentistas parceiros e seus estabelecimentos</p>
                </div>
                <Button size="sm" onClick={openCreate} className="gap-1.5">
                    <Plus className="h-4 w-4" /> Novo Parceiro
                </Button>
            </div>

            <div className="bg-card rounded-lg border border-border overflow-hidden flex-1 flex flex-col min-h-0">
                <ScrollArea className="flex-1">
                    <Table>
                        <TableHeader className="sticky top-0 bg-card z-10 shadow-sm">
                            <TableRow>
                                <TableHead>CPF</TableHead>
                                <TableHead>Nome</TableHead>
                                <TableHead>CRO</TableHead>
                                <TableHead>E-mail</TableHead>
                                <TableHead>Telefone</TableHead>
                                <TableHead className="w-24"></TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {dentists.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                                        Nenhum parceiro cadastrado.
                                    </TableCell>
                                </TableRow>
                            )}
                            {dentists.map(d => (
                                <TableRow key={d.cpf}>
                                    <TableCell>{d.cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4")}</TableCell>
                                    <TableCell className="font-medium">{d.nome}</TableCell>
                                    <TableCell>{d.cro}-{d.croUf}</TableCell>
                                    <TableCell>{d.email}</TableCell>
                                    <TableCell>{d.telefone}</TableCell>
                                    <TableCell>
                                        <div className="flex gap-1 justify-end">
                                            <Button variant="ghost" size="icon" onClick={() => openEdit(d)}>
                                                <Pencil className="h-4 w-4" />
                                            </Button>
                                            <Button variant="ghost" size="icon" onClick={() => setDeleteConfirm(d.cpf)}>
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

            {/* Form Dialog */}
            <Dialog open={open} onOpenChange={setOpen}>
                <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col">
                    <DialogHeader className="flex-shrink-0">
                        <DialogTitle>
                            {/* Se o CRO já veio preenchido pro form (não é edição de CPF) */}
                            {form.cro ? 'Editar Parceiro' : 'Novo Parceiro'}
                        </DialogTitle>
                    </DialogHeader>

                    <div className="flex-1 overflow-y-auto pr-2 py-4 space-y-6">
                        {/* DADOS PESSOAIS */}
                        <div className="space-y-4">
                            <h3 className="font-medium text-sm text-muted-foreground border-b pb-1">Dados Pessoais / Acesso</h3>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <Label htmlFor="cpf">CPF *</Label>
                                    <Input id="cpf" placeholder="Apenas números" value={form.cpf} onChange={e => updateForm('cpf', e.target.value)} disabled={!!form.cro && form.cpf.length > 0} />
                                </div>
                                <div className="space-y-1.5">
                                    <Label htmlFor="nome">Nome Completo *</Label>
                                    <Input id="nome" value={form.nome} onChange={e => updateForm('nome', e.target.value)} />
                                </div>
                                <div className="space-y-1.5">
                                    <Label htmlFor="email">E-mail *</Label>
                                    <Input id="email" type="email" value={form.email} onChange={e => updateForm('email', e.target.value)} />
                                </div>
                                <div className="space-y-1.5">
                                    <Label htmlFor="telefone">Telefone Celular</Label>
                                    <Input id="telefone" value={form.telefone} onChange={e => updateForm('telefone', e.target.value)} />
                                </div>
                                <div className="space-y-1.5">
                                    <Label htmlFor="senha">Senha de Acesso (Login)</Label>
                                    <Input id="senha" type="password" value={form.senha || ''} onChange={e => updateForm('senha', e.target.value)} placeholder="Deixe em branco para manter" />
                                </div>
                            </div>
                        </div>

                        {/* DADOS PROFISSIONAIS */}
                        <div className="space-y-4">
                            <h3 className="font-medium text-sm text-muted-foreground border-b pb-1">Dados Profissionais</h3>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <Label htmlFor="cro">CRO *</Label>
                                    <Input id="cro" value={form.cro} onChange={e => updateForm('cro', e.target.value)} />
                                </div>
                                <div className="space-y-1.5">
                                    <Label htmlFor="croUf">UF do CRO *</Label>
                                    <Input id="croUf" maxLength={2} placeholder="Ex: SP" value={form.croUf} onChange={e => updateForm('croUf', e.target.value.toUpperCase())} />
                                </div>
                                <div className="space-y-1.5">
                                    <Label htmlFor="especialidadeId">Especialidade (ID)</Label>
                                    {/* TODO: Transformar em Select quando as opções da API estiverem prontas */}
                                    <Input id="especialidadeId" type="number" min="1" placeholder="ID da Especialidade" value={form.especialidadeId || ''} onChange={e => updateForm('especialidadeId', parseInt(e.target.value) || 0)} />
                                </div>
                                <div className="space-y-1.5">
                                    <Label htmlFor="titulacaoId">Titulação (ID)</Label>
                                    {/* TODO: Transformar em Select quando as opções da API estiverem prontas */}
                                    <Input id="titulacaoId" type="number" min="1" placeholder="ID da Titulação" value={form.titulacaoId || ''} onChange={e => updateForm('titulacaoId', parseInt(e.target.value) || 0)} />
                                </div>
                            </div>
                        </div>

                        {/* ESTABELECIMENTO */}
                        <div className="space-y-4">
                            <h3 className="font-medium text-sm text-muted-foreground border-b pb-1">Estabelecimento (Opcional)</h3>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1.5 col-span-2">
                                    <Label htmlFor="razaoSocial">Razão Social</Label>
                                    <Input id="razaoSocial" value={form.razaoSocial || ''} onChange={e => updateForm('razaoSocial', e.target.value)} />
                                </div>
                                <div className="space-y-1.5">
                                    <Label htmlFor="cnpj">CNPJ</Label>
                                    <Input id="cnpj" value={form.cnpj || ''} onChange={e => updateForm('cnpj', e.target.value)} />
                                </div>
                                <div className="space-y-1.5">
                                    <Label htmlFor="cep">CEP</Label>
                                    <Input id="cep" value={form.cep || ''} onChange={e => updateForm('cep', e.target.value)} />
                                </div>
                                <div className="space-y-1.5 col-span-2">
                                    <Label htmlFor="endereco">Endereço Completo</Label>
                                    <Input id="endereco" value={form.endereco || ''} onChange={e => updateForm('endereco', e.target.value)} />
                                </div>
                                <div className="space-y-1.5 col-span-2">
                                    <Label htmlFor="complemento">Complemento</Label>
                                    <Input id="complemento" value={form.complemento || ''} onChange={e => updateForm('complemento', e.target.value)} />
                                </div>
                                <div className="space-y-1.5">
                                    <Label htmlFor="bairro">Bairro</Label>
                                    <Input id="bairro" value={form.bairro || ''} onChange={e => updateForm('bairro', e.target.value)} />
                                </div>
                                <div className="space-y-1.5">
                                    <Label htmlFor="cidade">Cidade</Label>
                                    <Input id="cidade" value={form.cidade || ''} onChange={e => updateForm('cidade', e.target.value)} />
                                </div>
                                <div className="space-y-1.5">
                                    <Label htmlFor="uf_estabelecimento">UF Estabelecimento</Label>
                                    <Input id="uf_estabelecimento" maxLength={2} value={form.uf_estabelecimento || ''} onChange={e => updateForm('uf_estabelecimento', e.target.value.toUpperCase())} />
                                </div>
                                <div className="space-y-1.5">
                                    <Label htmlFor="telefone_estabelecimento">Telefone Estabelecimento</Label>
                                    <Input id="telefone_estabelecimento" value={form.telefone_estabelecimento || ''} onChange={e => updateForm('telefone_estabelecimento', e.target.value)} />
                                </div>
                            </div>
                        </div>
                    </div>

                    <DialogFooter className="flex-shrink-0 pt-4 border-t mt-4 gap-2 border-border">
                        <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
                        <Button onClick={handleSave} disabled={!form.cpf || !form.nome || !form.cro || !form.email || !form.croUf}>
                            Salvar Parceiro
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Delete Confirm */}
            <Dialog open={!!deleteConfirm} onOpenChange={val => !val && setDeleteConfirm(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Confirmar exclusão</DialogTitle>
                    </DialogHeader>
                    <p className="text-sm text-muted-foreground">Tem certeza que deseja excluir permanentemente este dentista parceiro? Esta ação não pode ser desfeita e pode afetar os pacientes vinculados a ele.</p>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setDeleteConfirm(null)}>Cancelar</Button>
                        <Button variant="destructive" onClick={() => deleteConfirm && handleDelete(deleteConfirm)}>Excluir Parceiro</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
