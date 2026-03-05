"use client"

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { patientService } from '@/lib/api';
import { PatientListItem } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Plus, Pencil, Trash2, Eye } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';

interface PatientForm {
    cpf: string;
    nome: string;
    nascimento: string;
}

const emptyForm: PatientForm = {
    cpf: '',
    nome: '',
    nascimento: '',
};

export default function DentistaPatientsPage() {
    const router = useRouter();
    const { toast } = useToast();

    // FIX: Mock dentist ID until Clerk Auth
    const dentistPublicId = '05c99d96-f9c7-4a63-8b31-77a7710fd1a2';

    const [mounted, setMounted] = useState(false);
    const [patients, setPatients] = useState<PatientListItem[]>([]);
    const [open, setOpen] = useState(false);
    const [form, setForm] = useState<PatientForm>(emptyForm);
    const [isEditing, setIsEditing] = useState(false);
    const [selectedPublicId, setSelectedPublicId] = useState<string | null>(null);
    const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

    useEffect(() => {
        setMounted(true);
        loadData();
    }, [dentistPublicId]);

    const loadData = async () => {
        try {
            const data = await patientService.findByPartner(dentistPublicId);
            setPatients(data);
        } catch (err) {
            console.error(err);
        }
    };

    const openCreate = () => {
        setIsEditing(false);
        setForm(emptyForm);
        setSelectedPublicId(null);
        setOpen(true);
    };

    const openEdit = (p: PatientListItem) => {
        setIsEditing(true);
        setSelectedPublicId(p.publicId);
        setForm({
            cpf: p.cpf,
            nome: p.nome,
            nascimento: p.nascimento ? new Date(p.nascimento).toISOString().split('T')[0] : '',
        });
        setOpen(true);
    };

    const handleSave = async () => {
        try {
            if (isEditing && selectedPublicId) {
                // Mock dentist CPF for update logic if needed
                const dCpf = '22222222222';
                await patientService.update(selectedPublicId, dCpf, {
                    nomePaciente: form.nome,
                    cpfPaciente: form.cpf,
                    dataNascimento: form.nascimento
                });
                toast({ title: "Sucesso", description: "Paciente atualizado." });
            } else {
                await patientService.create({
                    cpfPaciente: form.cpf,
                    nomePaciente: form.nome,
                    dataNascimento: form.nascimento,
                }, dentistPublicId);
                toast({ title: "Sucesso", description: "Paciente criado." });
            }
            await loadData();
            setOpen(false);
        } catch (err: any) {
            toast({
                title: "Erro ao salvar",
                description: err.message || "Verifique os dados.",
                variant: "destructive"
            });
        }
    };

    const handleDelete = async (pid: string) => {
        try {
            const dCpf = '22222222222';
            await patientService.remove(pid, dCpf);
            toast({ title: "Sucesso", description: "Paciente removido.", variant: "destructive" });
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
                                <TableRow
                                    key={p.publicId}
                                    className="cursor-pointer hover:bg-muted/50 transition-colors"
                                    onClick={() => router.push(`/dentista/paciente/${p.publicId}`)}
                                >
                                    <TableCell>{p.cpf?.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4")}</TableCell>
                                    <TableCell className="font-medium">{p.nome}</TableCell>
                                    <TableCell>{p.nascimento ? new Date(p.nascimento).toLocaleDateString('pt-BR') : '-'}</TableCell>
                                    <TableCell>
                                        <div className="flex gap-1 justify-end">
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    router.push(`/dentista/paciente/${p.publicId}`);
                                                }}
                                                title="Ver informações do paciente"
                                            >
                                                <Eye className="h-4 w-4" />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    openEdit(p);
                                                }}
                                                title="Editar identificação"
                                            >
                                                <Pencil className="h-4 w-4" />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setDeleteConfirm(p.publicId);
                                                }}
                                                title="Excluir paciente"
                                            >
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
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle>{isEditing ? 'Editar Identificação' : 'Novo Paciente'}</DialogTitle>
                    </DialogHeader>

                    <div className="py-4 space-y-4">
                        <div className="space-y-1.5">
                            <Label>CPF *</Label>
                            <Input
                                value={form.cpf}
                                onChange={e => setForm(f => ({ ...f, cpf: e.target.value.replace(/\D/g, '').slice(0, 11) }))}
                                placeholder="Apenas números"
                            />
                        </div>
                        <div className="space-y-1.5">
                            <Label>Nome Completo *</Label>
                            <Input value={form.nome} onChange={e => setForm(f => ({ ...f, nome: e.target.value }))} />
                        </div>
                        <div className="space-y-1.5">
                            <Label>Data de Nascimento</Label>
                            <Input type="date" value={form.nascimento} onChange={e => setForm(f => ({ ...f, nascimento: e.target.value }))} />
                        </div>
                    </div>

                    <DialogFooter>
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
                    <p className="text-sm text-muted-foreground">Tem certeza que deseja excluir permanentemente este paciente e todos os seus tratamentos?</p>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setDeleteConfirm(null)}>Cancelar</Button>
                        <Button variant="destructive" onClick={() => deleteConfirm && handleDelete(deleteConfirm)}>Excluir Paciente</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
