"use client"

import { useState, useEffect } from 'react';
import { partnerService } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Plus, Pencil, Trash2, Eye, User, Phone, Mail, Award, MapPin, Building, MessageSquare, Loader2, Search } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { PartnerListItem, PartnerDetails } from '@/lib/types';
import { PartnerForm } from '@/components/partner/PartnerForm';
import { ConfirmActionDialog } from '@/components/ConfirmActionDialog';
import { useAppAuth } from '@/hooks/use-app-auth';
import {
    Pagination,
    PaginationContent,
    PaginationItem,
    PaginationLink,
    PaginationNext,
    PaginationPrevious,
} from "@/components/ui/pagination";

export default function GerenteDentistasPage() {
    const { toast } = useToast();
    const { token, isLoaded } = useAppAuth();
    const [mounted, setMounted] = useState(false);
    const [dentists, setDentists] = useState<PartnerListItem[]>([]);
    const [open, setOpen] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [editData, setEditData] = useState<PartnerDetails | undefined>(undefined);
    const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
    const [viewDetails, setViewDetails] = useState<PartnerDetails | null>(null);
    const [isDetailsOpen, setIsDetailsOpen] = useState(false);
    const [isLoadingDetails, setIsLoadingDetails] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalItems, setTotalItems] = useState(0);
    const [searchTerm, setSearchTerm] = useState('');
    const itemsPerPage = 8;

    const loadData = async (page: number = currentPage, search: string = searchTerm) => {
        if (!isLoaded || !token) return;
        try {
            const data = await partnerService.findAll(page, itemsPerPage, search, token);
            setDentists(data.items);
            setTotalItems(data.total);
        } catch (err) {
            console.error(err);
        }
    };

    const handleOpenDetails = async (d: PartnerListItem) => {
        setIsLoadingDetails(true);
        setIsDetailsOpen(true);
        try {
            const details = await partnerService.findOne(d.publicId, token || undefined);
            setViewDetails(details);
        } catch (err) {
            console.error(err);
            toast({
                title: "Erro",
                description: "Não foi possível carregar os detalhes do dentista.",
                variant: "destructive"
            });
            setIsDetailsOpen(false);
        } finally {
            setIsLoadingDetails(false);
        }
    };

    useEffect(() => {
        if (isLoaded && token) {
            setMounted(true);
            const debounceTimer = setTimeout(() => {
                loadData(currentPage, searchTerm);
            }, 300);
            return () => clearTimeout(debounceTimer);
        }
    }, [isLoaded, token, currentPage, searchTerm]);

    const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSearchTerm(e.target.value);
        setCurrentPage(1); // Reset to first page on search
    };

    const openCreate = () => {
        setIsEditing(false);
        setEditData(undefined);
        setOpen(true);
    };

    const openEdit = async (d: PartnerListItem) => {
        setIsLoadingDetails(true);
        setIsEditing(true);
        setOpen(true);
        try {
            const details = await partnerService.findOne(d.publicId, token || undefined);
            setEditData(details);
        } catch (err) {
            toast({ title: "Erro", description: "Falha ao carregar dados para edição.", variant: "destructive" });
            setOpen(false);
        } finally {
            setIsLoadingDetails(false);
        }
    };

    const handleFormSuccess = () => {
        setOpen(false);
        loadData();
    };

    const handleDelete = async (cpf: string) => {
        setIsSubmitting(true);
        try {
            await partnerService.remove(cpf, token || undefined);
            toast({
                title: "Dentista removido",
                description: "O registro do parceiro foi excluído com sucesso.",
                variant: "default"
            });
            await loadData();
            setDeleteConfirm(null);
        } catch (err: any) {
            toast({
                title: "Erro ao remover",
                description: err.message || "Não foi possível remover o parceiro.",
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
                    <h1 className="text-xl font-semibold text-foreground">Dentistas Parceiros</h1>
                    <p className="text-sm text-muted-foreground">Gerencie os dentistas parceiros e seus estabelecimentos</p>
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
                    <Button size="sm" onClick={openCreate} className="gap-1.5" title="Cadastrar um novo dentista parceiro">
                        <Plus className="h-4 w-4" /> Novo Parceiro
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
                                <TableRow
                                    key={d.publicId}
                                    className="cursor-pointer hover:bg-muted/50 transition-colors"
                                    onClick={() => handleOpenDetails(d)}
                                >
                                    <TableCell>{d.cpf?.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4")}</TableCell>
                                    <TableCell className="font-medium">{d.nome}</TableCell>
                                    <TableCell>{d.cro}-{d.croUf}</TableCell>
                                    <TableCell>{d.email}</TableCell>
                                    <TableCell>{d.telefone}</TableCell>
                                    <TableCell>
                                        <div className="flex gap-1 justify-end">
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleOpenDetails(d);
                                                }}
                                                title="Ver detalhes"
                                            >
                                                <Eye className="h-4 w-4 text-primary" />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    openEdit(d);
                                                }}
                                                title="Editar"
                                            >
                                                <Pencil className="h-4 w-4" />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setDeleteConfirm(d.cpf);
                                                }}
                                                title="Excluir"
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

            {/* Details Modal */}
            <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
                <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col p-0 overflow-hidden border-none shadow-2xl">
                    <DialogHeader className="p-6 bg-gradient-to-r from-primary/10 via-background to-background border-b border-border space-y-4">
                        <div className="flex items-center gap-4">
                            <div className="h-14 w-14 rounded-full bg-primary/20 flex items-center justify-center text-primary border border-primary/20">
                                <User className="h-7 w-7" />
                            </div>
                            <div className="space-y-1">
                                <DialogTitle className="text-2xl font-bold tracking-tight">{isLoadingDetails ? 'Carregando...' : viewDetails?.nome}</DialogTitle>
                                <div className="flex items-center gap-3">
                                    <Badge variant="secondary" className="px-2 py-0.5 text-xs font-medium bg-primary/10 text-primary border-primary/20">
                                        Dentista Parceiro
                                    </Badge>
                                    {viewDetails?.titulacao && (
                                        <Badge variant="outline" className="px-2 py-0.5 text-xs font-medium border-border">
                                            {viewDetails.titulacao}
                                        </Badge>
                                    )}
                                </div>
                            </div>
                        </div>
                    </DialogHeader>

                    <ScrollArea className="flex-1 overflow-y-auto">
                        {isLoadingDetails ? (
                            <div className="flex flex-col items-center justify-center p-12 space-y-4">
                                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                                <p className="text-sm text-muted-foreground animate-pulse">Buscando informações detalhadas...</p>
                            </div>
                        ) : viewDetails ? (
                            <div className="p-6 space-y-8">
                                {/* Informações Profissionais */}
                                <section className="space-y-4">
                                    <div className="flex items-center gap-2 text-primary font-semibold">
                                        <Award className="h-5 w-5" />
                                        <h3 className="text-sm uppercase tracking-wider">Registro e Qualificações</h3>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-muted/30 p-4 rounded-xl border border-border/50">
                                        <div className="space-y-1">
                                            <p className="text-[10px] text-foreground uppercase font-bold tracking-wider">CPF</p>
                                            <p className="text-sm text-muted-foreground">{viewDetails.cpf?.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4")}</p>
                                        </div>
                                        <div className="space-y-1">
                                            <p className="text-[10px] text-foreground uppercase font-bold tracking-wider">CRO</p>
                                            <p className="text-sm text-muted-foreground">{viewDetails.cro} - {viewDetails.croUf}</p>
                                        </div>
                                        {viewDetails.especialidades && viewDetails.especialidades.length > 0 && (
                                            <div className="col-span-1 md:col-span-2 space-y-2">
                                                <p className="text-[10px] text-foreground uppercase font-bold tracking-wider">Especialidades</p>
                                                <div className="flex flex-wrap gap-1.5">
                                                    {viewDetails.especialidades.map((esp, i) => (
                                                        <Badge key={i} variant="outline" className="text-[10px] font-semibold py-0 leading-5">
                                                            {esp}
                                                        </Badge>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </section>

                                <Separator className="bg-border/50" />

                                {/* Contato */}
                                <section className="space-y-4">
                                    <div className="flex items-center gap-2 text-primary font-semibold">
                                        <Phone className="h-5 w-5" />
                                        <h3 className="text-sm uppercase tracking-wider">Canais de Contato</h3>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="flex items-start gap-3 p-3 bg-muted/20 rounded-lg border border-border/30">
                                            <div className="mt-0.5 text-primary/70">
                                                <Mail className="h-4 w-4" />
                                            </div>
                                            <div className="space-y-0.5">
                                                <p className="text-[10px] text-foreground uppercase font-bold tracking-wider">E-mail</p>
                                                <p className="text-sm break-all text-muted-foreground">{viewDetails.email || 'Não informado'}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-start gap-3 p-3 bg-muted/20 rounded-lg border border-border/30">
                                            <div className="mt-0.5 text-primary/70">
                                                <Phone className="h-4 w-4" />
                                            </div>
                                            <div className="space-y-0.5">
                                                <p className="text-[10px] text-foreground uppercase font-bold tracking-wider">Telefone</p>
                                                <p className="text-sm text-muted-foreground">{viewDetails.telefone || 'Não informado'}</p>
                                            </div>
                                        </div>
                                        {viewDetails.comunicacoes && viewDetails.comunicacoes.length > 0 && (
                                            <div className="col-span-1 md:col-span-2 p-3 bg-muted/20 rounded-lg border border-border/30 space-y-2">
                                                <div className="flex items-center gap-2 text-primary/70">
                                                    <MessageSquare className="h-4 w-4" />
                                                    <p className="text-[10px] text-foreground uppercase font-bold tracking-wider">Preferências de Comunicação</p>
                                                </div>
                                                <div className="flex flex-wrap gap-1.5">
                                                    {viewDetails.comunicacoes.map((comm, i) => (
                                                        <span key={i} className="text-xs bg-background px-2 py-0.5 rounded border border-border/50 font-medium">
                                                            {comm}
                                                        </span>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </section>

                                <Separator className="bg-border/50" />

                                {/* Estabelecimento */}
                                <section className="space-y-4">
                                    <div className="flex items-center gap-2 text-primary font-semibold">
                                        <Building className="h-5 w-5" />
                                        <h3 className="text-sm uppercase tracking-wider">Estabelecimento</h3>
                                    </div>
                                    {(viewDetails.razaoSocial || viewDetails.cnpj) && (
                                        <div className="bg-muted/10 p-4 rounded-xl border border-border/50 space-y-4">
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                {viewDetails.razaoSocial && (
                                                    <div className="space-y-1">
                                                        <p className="text-[10px] text-foreground uppercase font-bold tracking-wider">Razão Social</p>
                                                        <p className="text-sm text-muted-foreground font-medium">{viewDetails.razaoSocial}</p>
                                                    </div>
                                                )}
                                                {viewDetails.cnpj && (
                                                    <div className="space-y-1">
                                                        <p className="text-[10px] text-foreground uppercase font-bold tracking-wider">CNPJ</p>
                                                        <p className="text-sm text-muted-foreground">{viewDetails.cnpj}</p>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )}

                                    <div className="flex items-start gap-4 p-4 bg-muted/20 rounded-xl border border-border/30">
                                        <div className="mt-1 p-2 bg-background rounded-full border border-border text-primary/70 shadow-sm">
                                            <MapPin className="h-5 w-5" />
                                        </div>
                                        <div className="flex-1 space-y-3">
                                            <p className="text-[10px] text-foreground uppercase font-bold tracking-wider">Endereço Profissional</p>
                                            {viewDetails.endereco ? (
                                                <div className="space-y-1.5">
                                                    <p className="text-sm text-muted-foreground leading-relaxed">
                                                        {viewDetails.endereco}
                                                        {viewDetails.complemento && `, ${viewDetails.complemento}`}
                                                    </p>
                                                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                                                        {viewDetails.bairro && <span>{viewDetails.bairro}</span>}
                                                        {viewDetails.cep && <span>CEP: {viewDetails.cep}</span>}
                                                        {(viewDetails.cidade || viewDetails.uf_estabelecimento) && (
                                                            <span className="font-semibold text-foreground/80">
                                                                {viewDetails.cidade}{viewDetails.uf_estabelecimento ? ` - ${viewDetails.uf_estabelecimento}` : ''}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            ) : (
                                                <p className="text-sm italic text-muted-foreground">Endereço não cadastrado.</p>
                                            )}
                                        </div>
                                    </div>
                                </section>
                            </div>
                        ) : null}
                    </ScrollArea>

                    <DialogFooter className="p-4 border-t border-border bg-muted/5">
                        <Button variant="ghost" onClick={() => setIsDetailsOpen(false)} className="px-8">Fechar</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Form Dialog */}
            <Dialog open={open} onOpenChange={setOpen}>
                <DialogContent className="max-w-3xl h-[85vh] flex flex-col p-0 overflow-hidden gap-0 border-none shadow-2xl">
                    <DialogHeader className="p-6 border-b border-border bg-muted/5 flex-shrink-0">
                        <DialogTitle className="flex items-center gap-2 text-xl font-bold">
                            {isEditing ? (
                                <>
                                    <Pencil className="h-5 w-5 text-primary" />
                                    Editar Dentista
                                </>
                            ) : (
                                <>
                                    <Plus className="h-5 w-5 text-primary" />
                                    Novo Cadastro de Dentista
                                </>
                            )}
                        </DialogTitle>
                    </DialogHeader>

                    <div className="flex-1 overflow-y-auto min-h-0 bg-background/50">
                        <div className="p-6">
                            {isLoadingDetails && isEditing ? (
                                <div className="flex flex-col items-center justify-center py-12 gap-4">
                                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                                    <p className="text-sm text-muted-foreground">Carregando dados do parceiro...</p>
                                </div>
                            ) : (
                                <PartnerForm
                                    initialData={editData}
                                    onSuccess={handleFormSuccess}
                                    onCancel={() => setOpen(false)}
                                />
                            )}
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Delete Confirm */}
            <ConfirmActionDialog
                open={!!deleteConfirm}
                onOpenChange={val => !val && setDeleteConfirm(null)}
                onConfirm={() => deleteConfirm && handleDelete(deleteConfirm)}
                isLoading={isSubmitting}
                title="Excluir Dentista"
                description="Tem certeza que deseja excluir permanentemente este dentista parceiro? Esta ação não pode ser desfeita."
                confirmText="Excluir Parceiro"
            />
        </div>
    );
}
