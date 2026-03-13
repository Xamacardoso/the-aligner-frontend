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
import { Plus, Pencil, Trash2, Eye, Search } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import { ConfirmActionDialog } from '@/components/ConfirmActionDialog';
import {
    Pagination,
    PaginationContent,
    PaginationItem,
    PaginationLink,
    PaginationNext,
    PaginationPrevious,
} from "@/components/ui/pagination";
import { useAppAuth } from '@/hooks/use-app-auth';

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

    const { user, token, isLoaded } = useAppAuth();
    const dentistPublicId = user?.id; // Usando o ID (CPF) do usuário logado

    const [mounted, setMounted] = useState(false);
    const [patients, setPatients] = useState<PatientListItem[]>([]);
    const [open, setOpen] = useState(false);
    const [form, setForm] = useState<PatientForm>(emptyForm);
    const [isEditing, setIsEditing] = useState(false);
    const [selectedPublicId, setSelectedPublicId] = useState<string | null>(null);
    const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
    const [totalItems, setTotalItems] = useState(0);
    const [currentPage, setCurrentPage] = useState(1);
    const [searchTerm, setSearchTerm] = useState('');
    const itemsPerPage = 10;
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        if (isLoaded && token && user?.publicId) {
            setMounted(true);
            const debounceTimer = setTimeout(() => {
                loadData(currentPage, searchTerm);
            }, 300);
            return () => clearTimeout(debounceTimer);
        }
    }, [isLoaded, token, user?.publicId, currentPage, searchTerm]);

    const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSearchTerm(e.target.value);
        setCurrentPage(1); // Reset to first page on search
    };

    const loadData = async (page: number = currentPage, search: string = searchTerm) => {
        try {
            if (!user?.publicId || !token) return;
            const data = await patientService.findMyPatients(page, itemsPerPage, search, token);
            setPatients(data.items);
            setTotalItems(data.total);
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
        setIsSubmitting(true);
        try {
            if (isEditing && selectedPublicId) {
                await patientService.update(selectedPublicId, {
                    nomePaciente: form.nome,
                    cpfPaciente: form.cpf,
                    dataNascimento: form.nascimento
                }, token || undefined);
                toast({
                    title: "Paciente atualizado",
                    description: `${form.nome} foi atualizado com sucesso.`
                });
            } else {
                await patientService.create({
                    cpfPaciente: form.cpf,
                    nomePaciente: form.nome,
                    dataNascimento: form.nascimento,
                }, user?.publicId || '', token || undefined);
                toast({
                    title: "Paciente cadastrado",
                    description: `${form.nome} foi adicionado à sua lista.`
                });
            }
            await loadData(currentPage);
            setOpen(false);
        } catch (err: any) {
            toast({
                title: "Erro ao salvar",
                description: err.message || "Verifique os dados e tente novamente.",
                variant: "destructive"
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = async (pid: string) => {
        setIsSubmitting(true);
        try {
            await patientService.remove(pid, token || undefined);
            toast({
                title: "Paciente removido",
                description: "O registro do paciente foi excluído permanentemente.",
                variant: "default"
            });
            await loadData(currentPage);
            setDeleteConfirm(null);
        } catch (err: any) {
            toast({
                title: "Erro ao remover",
                description: err.message || "Não foi possível remover o paciente.",
                variant: "destructive"
            });
        } finally {
            setIsSubmitting(false);
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
                <div className="flex items-center gap-3">
                    <div className="relative w-72">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Buscar por nome ou CPF..."
                            value={searchTerm}
                            onChange={handleSearch}
                            className="pl-9 h-9"
                        />
                    </div>
                    <Button size="sm" onClick={openCreate} className="gap-1.5">
                        <Plus className="h-4 w-4" /> Novo Paciente
                    </Button>
                </div>
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
                {totalItems > itemsPerPage && (
                    <div className="p-4 border-t border-border flex justify-center bg-card">
                        <Pagination>
                            <PaginationContent>
                                <PaginationItem>
                                    <PaginationPrevious
                                        href="#"
                                        onClick={(e) => {
                                            e.preventDefault();
                                            if (currentPage > 1) setCurrentPage(p => p - 1);
                                        }}
                                        className={currentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                                    />
                                </PaginationItem>
                                {Array.from({ length: Math.ceil(totalItems / itemsPerPage) }).map((_, i) => (
                                    <PaginationItem key={i}>
                                        <PaginationLink
                                            href="#"
                                            onClick={(e) => {
                                                e.preventDefault();
                                                setCurrentPage(i + 1);
                                            }}
                                            isActive={currentPage === i + 1}
                                        >
                                            {i + 1}
                                        </PaginationLink>
                                    </PaginationItem>
                                ))}
                                <PaginationItem>
                                    <PaginationNext
                                        href="#"
                                        onClick={(e) => {
                                            e.preventDefault();
                                            if (currentPage < Math.ceil(totalItems / itemsPerPage)) setCurrentPage(p => p + 1);
                                        }}
                                        className={currentPage === Math.ceil(totalItems / itemsPerPage) ? "pointer-events-none opacity-50" : "cursor-pointer"}
                                    />
                                </PaginationItem>
                            </PaginationContent>
                        </Pagination>
                    </div>
                )}
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
                                disabled={isEditing}
                                className={isEditing ? "bg-muted cursor-not-allowed" : ""}
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
                        <Button onClick={handleSave} disabled={!form.cpf || !form.nome} loading={isSubmitting}>
                            Salvar Paciente
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Delete Confirm */}
            <ConfirmActionDialog
                open={!!deleteConfirm}
                onOpenChange={val => !val && setDeleteConfirm(null)}
                onConfirm={() => deleteConfirm && handleDelete(deleteConfirm)}
                isLoading={isSubmitting}
                title="Excluir Paciente"
                description="Tem certeza que deseja excluir permanentemente este paciente e todos os seus tratamentos? Esta ação não pode ser desfeita."
                confirmText="Excluir Paciente"
            />
        </div>
    );
}
