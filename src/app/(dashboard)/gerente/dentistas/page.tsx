"use client"

import { useState, useEffect } from 'react';
import { partnerService } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Plus, Pencil, Trash2, Eye, User, Phone, Mail, Award, MapPin, Building, MessageSquare, Loader2 } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { PartnerListItem, PartnerDetails } from '@/lib/types';

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
    const [viewDetails, setViewDetails] = useState<PartnerDetails | null>(null);
    const [isDetailsOpen, setIsDetailsOpen] = useState(false);
    const [isLoadingDetails, setIsLoadingDetails] = useState(false);

    const loadData = async () => {
        try {
            const data = await partnerService.findAll();
            setDentists(data);
        } catch (err) {
            console.error(err);
        }
    };

    const handleOpenDetails = async (d: PartnerListItem) => {
        setIsLoadingDetails(true);
        setIsDetailsOpen(true);
        try {
            const details = await partnerService.findOne(d.publicId);
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
        setMounted(true);
        loadData();
    }, []);

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
                <Button size="sm" onClick={openCreate} className="gap-1.5" title="Cadastrar um novo dentista parceiro">
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
