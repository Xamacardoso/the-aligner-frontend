"use client"

import { useState, useEffect } from 'react';
import { partnerService } from '@/lib/api';
import { PartnerListItem } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';

interface PartnerForm {
    cpf: string;
    nome: string;
    cro: string;
    croUf: string;
    email: string;
    telefone: string;
}

const emptyForm: PartnerForm = {
    cpf: '',
    nome: '',
    cro: '',
    croUf: '',
    email: '',
    telefone: '',
};

export default function GerenteDentistasPage() {
    const { toast } = useToast();
    const [mounted, setMounted] = useState(false);
    const [dentists, setDentists] = useState<PartnerListItem[]>([]);
    const [open, setOpen] = useState(false);
    const [form, setForm] = useState<PartnerForm>(emptyForm);
    const [isEditing, setIsEditing] = useState(false);
    const [selectedCpf, setSelectedCpf] = useState<string | null>(null);
    const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

    useEffect(() => {
        setMounted(true);
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const data = await partnerService.findAll();
            setDentists(data);
        } catch (err) {
            console.error(err);
        }
    };

    const openCreate = () => {
        setIsEditing(false);
        setForm(emptyForm);
        setOpen(true);
    };

    const openEdit = (d: PartnerListItem) => {
        setIsEditing(true);
        setSelectedCpf(d.cpf);
        setForm({
            cpf: d.cpf,
            nome: d.nome,
            cro: d.cro,
            croUf: d.croUf,
            email: d.email || '',
            telefone: d.telefone || '',
        });
        setOpen(true);
    };

    const handleSave = async () => {
        try {
            if (isEditing && selectedCpf) {
                await partnerService.update(selectedCpf, {
                    nome: form.nome,
                    email: form.email,
                    telefone: form.telefone,
                    cro: form.cro,
                    croUf: form.croUf
                });
                toast({ title: "Sucesso", description: "Parceiro atualizado." });
            } else {
                await partnerService.create({
                    cpf: form.cpf,
                    nome: form.nome,
                    cro: form.cro,
                    croUf: form.croUf,
                    email: form.email,
                    telefone: form.telefone,
                    especialidades: [] // New modeling expects array
                });
                toast({ title: "Sucesso", description: "Parceiro criado." });
            }
            await loadData();
            setOpen(false);
        } catch (err: any) {
            toast({
                title: "Erro ao salvar",
                description: err.message || "Verifique os campos.",
                variant: "destructive"
            });
        }
    };

    const handleDelete = async (cpf: string) => {
        try {
            await partnerService.remove(cpf);
            toast({ title: "Sucesso", description: "Parceiro removido.", variant: "destructive" });
            await loadData();
            setDeleteConfirm(null);
        } catch (err) {
            toast({ title: "Erro ao remover", variant: "destructive" });
        }
    };

    if (!mounted) return null;

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
                                <TableRow key={d.publicId}>
                                    <TableCell>{d.cpf?.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4")}</TableCell>
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
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle>{isEditing ? 'Editar Parceiro' : 'Novo Parceiro'}</DialogTitle>
                    </DialogHeader>

                    <div className="space-y-4 py-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <Label>CPF *</Label>
                                <Input
                                    placeholder="Apenas números"
                                    value={form.cpf}
                                    onChange={e => setForm(f => ({ ...f, cpf: e.target.value.replace(/\D/g, '').slice(0, 11) }))}
                                    disabled={isEditing}
                                />
                            </div>
                            <div className="space-y-1.5">
                                <Label>Nome Completo *</Label>
                                <Input value={form.nome} onChange={e => setForm(f => ({ ...f, nome: e.target.value }))} />
                            </div>
                            <div className="space-y-1.5">
                                <Label>E-mail *</Label>
                                <Input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
                            </div>
                            <div className="space-y-1.5">
                                <Label>Telefone</Label>
                                <Input value={form.telefone} onChange={e => setForm(f => ({ ...f, telefone: e.target.value }))} />
                            </div>
                            <div className="space-y-1.5">
                                <Label>CRO *</Label>
                                <Input value={form.cro} onChange={e => setForm(f => ({ ...f, cro: e.target.value }))} />
                            </div>
                            <div className="space-y-1.5">
                                <Label>UF CRO *</Label>
                                <Input maxLength={2} placeholder="Ex: SP" value={form.croUf} onChange={e => setForm(f => ({ ...f, croUf: e.target.value.toUpperCase() }))} />
                            </div>
                        </div>
                    </div>

                    <DialogFooter>
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
                    <p className="text-sm text-muted-foreground">Tem certeza que deseja excluir permanentemente este dentista parceiro?</p>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setDeleteConfirm(null)}>Cancelar</Button>
                        <Button variant="destructive" onClick={() => deleteConfirm && handleDelete(deleteConfirm)}>Excluir Parceiro</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
