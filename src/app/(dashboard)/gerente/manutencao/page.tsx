"use client";

import { useEffect, useState } from 'react';
import { 
    Settings, 
    Plus, 
    Pencil, 
    Trash2, 
    Archive,
    RotateCcw,
    Loader2, 
    Search,
    Target,
    Users as UsersIcon,
    GraduationCap,
    MessageSquare,
    MapPin
} from 'lucide-react';
import { 
    Tabs, 
    TabsContent, 
    TabsList, 
    TabsTrigger 
} from '@/components/ui/tabs';
import { 
    Card, 
    CardContent, 
    CardDescription, 
    CardHeader, 
    CardTitle 
} from '@/components/ui/card';
import { 
    Table, 
    TableBody, 
    TableCell, 
    TableHead, 
    TableHeader, 
    TableRow 
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
    Dialog, 
    DialogContent, 
    DialogDescription, 
    DialogFooter, 
    DialogHeader, 
    DialogTitle 
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { useAppAuth } from '@/hooks/use-app-auth';
import { maintenanceService, AuxiliaryItem } from '@/lib/api';
import { ConfirmActionDialog } from '@/components/ConfirmActionDialog';

type CategoryType = 'specialties' | 'objectives' | 'crowding' | 'degrees' | 'communication' | 'ufs';

export default function MaintenancePage() {
    const { token } = useAppAuth();
    const { toast } = useToast();
    const [loading, setLoading] = useState(false);
    const [data, setData] = useState<Record<CategoryType, AuxiliaryItem[]>>({
        specialties: [],
        objectives: [],
        crowding: [],
        degrees: [],
        communication: [],
        ufs: []
    });
    const [searchTerm, setSearchTerm] = useState('');
    
    // Modal state
    const [openModal, setOpenModal] = useState(false);
    const [modalAction, setModalAction] = useState<'create' | 'edit'>('create');
    const [currentCategory, setCurrentCategory] = useState<CategoryType>('specialties');
    const [currentItem, setCurrentItem] = useState<AuxiliaryItem | null>(null);
    const [formData, setFormData] = useState({ nome: '', descricao: '', sigla: '' });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [actionItem, setActionItem] = useState<{ id: number; action: 'delete' | 'restore' } | null>(null);

    const categories = [
        { id: 'specialties', label: 'Especialidades', icon: <GraduationCap className="h-4 w-4" /> },
        { id: 'objectives', label: 'Objetivos', icon: <Target className="h-4 w-4" /> },
        { id: 'crowding', label: 'Apinhamentos', icon: <Target className="h-4 w-4" /> },
        { id: 'degrees', label: 'Titulações', icon: <UsersIcon className="h-4 w-4" /> },
        { id: 'communication', label: 'Comunicação', icon: <MessageSquare className="h-4 w-4" /> },
        { id: 'ufs', label: 'UFs/Estados', icon: <MapPin className="h-4 w-4" /> },
    ];

    const loadData = async (cat: CategoryType) => {
        setLoading(true);
        try {
            let res;
            if (cat === 'specialties') res = await maintenanceService.getSpecialties(token!);
            else if (cat === 'objectives') res = await maintenanceService.getObjectives(token!);
            else if (cat === 'crowding') res = await maintenanceService.getCrowding(token!);
            else if (cat === 'degrees') res = await maintenanceService.getDegrees(token!);
            else if (cat === 'communication') res = await maintenanceService.getCommunication(token!);
            else if (cat === 'ufs') res = await maintenanceService.getUfs(token!);
            
            if (res) setData(prev => ({ ...prev, [cat]: res }));
        } catch (err) {
            toast({ title: "Erro ao carregar dados", variant: "destructive" });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (token) {
            loadData(currentCategory);
        }
    }, [token, currentCategory]);

    const handleOpenCreate = () => {
        setModalAction('create');
        setCurrentItem(null);
        setFormData({ nome: '', descricao: '', sigla: '' });
        setOpenModal(true);
    };

    const handleOpenEdit = (item: AuxiliaryItem) => {
        setModalAction('edit');
        setCurrentItem(item);
        setFormData({ 
            nome: item.nome || '', 
            descricao: item.descricao || '', 
            sigla: item.sigla || '' 
        });
        setOpenModal(true);
    };

    const handleSave = async () => {
        setIsSubmitting(true);
        try {
            if (modalAction === 'create') {
                if (currentCategory === 'specialties') await maintenanceService.createSpecialty({ nome: formData.nome }, token!);
                else if (currentCategory === 'objectives') await maintenanceService.createObjective({ nome: formData.nome }, token!);
                else if (currentCategory === 'crowding') await maintenanceService.createCrowding({ nome: formData.nome }, token!);
                else if (currentCategory === 'degrees') await maintenanceService.createDegree({ nome: formData.nome }, token!);
                else if (currentCategory === 'communication') await maintenanceService.createCommunication({ descricao: formData.descricao }, token!);
                else if (currentCategory === 'ufs') await maintenanceService.createUf({ nome: formData.nome, sigla: formData.sigla }, token!);
            } else {
                const id = currentItem!.id;
                if (currentCategory === 'specialties') await maintenanceService.updateSpecialty(id, { nome: formData.nome }, token!);
                else if (currentCategory === 'objectives') await maintenanceService.updateObjective(id, { nome: formData.nome }, token!);
                else if (currentCategory === 'crowding') await maintenanceService.updateCrowding(id, { nome: formData.nome }, token!);
                else if (currentCategory === 'degrees') await maintenanceService.updateDegree(id, { nome: formData.nome }, token!);
                else if (currentCategory === 'communication') await maintenanceService.updateCommunication(id, { descricao: formData.descricao }, token!);
                else if (currentCategory === 'ufs') await maintenanceService.updateUf(id, { nome: formData.nome, sigla: formData.sigla }, token!);
            }
            
            toast({ title: `Item ${modalAction === 'create' ? 'criado' : 'atualizado'} com sucesso!` });
            setOpenModal(false);
            loadData(currentCategory);
        } catch (err: any) {
            toast({ 
                title: "Erro ao salvar", 
                description: err.message, 
                variant: "destructive" 
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    const executeAction = async () => {
        if (!actionItem) return;
        setIsSubmitting(true);
        const { id, action } = actionItem;
        
        try {
            if (action === 'delete') {
                if (currentCategory === 'specialties') await maintenanceService.deleteSpecialty(id, token!);
                else if (currentCategory === 'objectives') await maintenanceService.deleteObjective(id, token!);
                else if (currentCategory === 'crowding') await maintenanceService.deleteCrowding(id, token!);
                else if (currentCategory === 'degrees') await maintenanceService.deleteDegree(id, token!);
                else if (currentCategory === 'communication') await maintenanceService.deleteCommunication(id, token!);
                else if (currentCategory === 'ufs') await maintenanceService.deleteUf(id, token!);
                toast({ title: "Item arquivado com sucesso!" });
            } else {
                if (currentCategory === 'specialties') await maintenanceService.restoreSpecialty(id, token!);
                else if (currentCategory === 'objectives') await maintenanceService.restoreObjective(id, token!);
                else if (currentCategory === 'crowding') await maintenanceService.restoreCrowding(id, token!);
                else if (currentCategory === 'degrees') await maintenanceService.restoreDegree(id, token!);
                else if (currentCategory === 'communication') await maintenanceService.restoreCommunication(id, token!);
                else if (currentCategory === 'ufs') await maintenanceService.restoreUf(id, token!);
                toast({ title: "Item reativado com sucesso!" });
            }
            loadData(currentCategory);
            setActionItem(null);
        } catch (err: any) {
            toast({ 
                title: `Erro ao ${action === 'delete' ? 'arquivar' : 'reativar'}`, 
                description: err.message || "Ocorreu um erro inesperado.",
                variant: "destructive" 
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    const filteredItems = data[currentCategory].filter(item => {
        const val = (item.nome || item.descricao || item.sigla || '').toLowerCase();
        return val.includes(searchTerm.toLowerCase());
    });

    return (
        <div className="p-8 max-w-6xl mx-auto space-y-8 animate-in fade-in duration-500">
            <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-black text-foreground flex items-center gap-3">
                        <Settings className="h-8 w-8 text-primary" />
                        Painel de Manutenção
                    </h1>
                    <p className="text-muted-foreground font-medium mt-1">
                        Gerencie as tabelas auxiliares e configurações globais do sistema.
                    </p>
                </div>
                <Button onClick={handleOpenCreate} className="h-12 px-6 font-bold uppercase text-xs tracking-widest gap-2 shadow-lg shadow-primary/20">
                    <Plus className="h-4 w-4" /> Adicionar Novo Item
                </Button>
            </header>

            <Tabs defaultValue="specialties" onValueChange={(v) => setCurrentCategory(v as CategoryType)} className="space-y-6">
                <TabsList className="bg-muted/50 p-1 border border-border h-auto flex flex-wrap justify-start gap-1">
                    {categories.map(cat => (
                        <TabsTrigger 
                            key={cat.id} 
                            value={cat.id}
                            className="flex items-center gap-2 px-4 py-2.5 data-[state=active]:bg-background data-[state=active]:shadow-sm font-bold uppercase text-[10px] tracking-widest"
                        >
                            {cat.icon}
                            {cat.label}
                        </TabsTrigger>
                    ))}
                </TabsList>

                {categories.map(cat => (
                    <TabsContent key={cat.id} value={cat.id} className="mt-0 focus-visible:outline-none focus-visible:ring-0">
                        <Card className="border-none shadow-xl shadow-foreground/5 bg-background/50 backdrop-blur-sm overflow-hidden">
                            <CardHeader className="border-b border-border bg-muted/20 pb-4">
                                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                    <div className="space-y-1">
                                        <CardTitle className="text-xl font-bold">{cat.label}</CardTitle>
                                        <CardDescription>Lista de todos os registros de {cat.label.toLowerCase()} cadastrados.</CardDescription>
                                    </div>
                                    <div className="relative w-full md:w-64">
                                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                        <Input
                                            placeholder="Buscar..."
                                            value={searchTerm}
                                            onChange={(e) => setSearchTerm(e.target.value)}
                                            className="pl-9 h-10 border-primary/10 bg-background/50 focus:border-primary transition-all"
                                        />
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent className="p-0">
                                {loading && data[cat.id as CategoryType].length === 0 ? (
                                    <div className="p-12 flex flex-col items-center justify-center text-muted-foreground italic">
                                        <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
                                        Carregando dados...
                                    </div>
                                ) : (
                                    <Table>
                                        <TableHeader className="bg-muted/10">
                                            <TableRow className="border-border hover:bg-transparent">
                                                <TableHead className="w-20 font-black uppercase text-[10px] tracking-widest text-primary px-6">ID</TableHead>
                                                <TableHead className="font-black uppercase text-[10px] tracking-widest text-primary">
                                                    {cat.id === 'communication' ? 'Descrição' : 'Nome'}
                                                </TableHead>
                                                {cat.id === 'ufs' && (
                                                    <TableHead className="w-32 font-black uppercase text-[10px] tracking-widest text-primary text-center">Sigla</TableHead>
                                                )}
                                                <TableHead className="w-32 font-black uppercase text-[10px] tracking-widest text-primary text-right px-6">Ações</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {filteredItems.map((item) => (
                                                <TableRow key={item.id} className="border-border hover:bg-muted/5 transition-colors group">
                                                    <TableCell className="px-6 font-bold tabular-nums text-muted-foreground">
                                                        #{item.id}
                                                    </TableCell>
                                                    <TableCell className="font-semibold text-foreground flex items-center gap-3">
                                                        {item.nome || item.descricao}
                                                        {(item as any).deletedAt && (
                                                            <span className="text-[8px] font-black bg-destructive/10 text-destructive px-1.5 py-0.5 rounded-full uppercase tracking-tighter">Inativo</span>
                                                        )}
                                                    </TableCell>
                                                    {cat.id === 'ufs' && (
                                                        <TableCell className="text-center font-black text-primary uppercase bg-primary/5 rounded-md py-1">
                                                            {item.sigla}
                                                        </TableCell>
                                                    )}
                                                    <TableCell className="px-6 text-right">
                                                        <div className="flex items-center justify-end gap-1 transition-opacity">
                                                            <Button 
                                                                variant="ghost" 
                                                                size="icon" 
                                                                onClick={() => handleOpenEdit(item)}
                                                                className="h-9 w-9 text-primary hover:bg-primary/10 hover:text-primary transition-all"
                                                                title="Editar"
                                                            >
                                                                <Pencil className="h-4 w-4" />
                                                            </Button>
                                                            {(item as any).deletedAt ? (
                                                                <Button 
                                                                    variant="ghost" 
                                                                    size="icon" 
                                                                    onClick={() => setActionItem({ id: item.id, action: 'restore' })}
                                                                    className="h-9 w-9 text-green-600 hover:bg-green-600/10 hover:text-green-700 transition-all"
                                                                    title="Reativar"
                                                                >
                                                                    <RotateCcw className="h-4 w-4" />
                                                                </Button>
                                                            ) : (
                                                                <Button 
                                                                    variant="ghost" 
                                                                    size="icon" 
                                                                    onClick={() => setActionItem({ id: item.id, action: 'delete' })}
                                                                    className="h-9 w-9 text-destructive/60 hover:bg-destructive/10 hover:text-destructive transition-all"
                                                                    title="Arquivar"
                                                                >
                                                                    <Archive className="h-4 w-4" />
                                                                </Button>
                                                            )}
                                                        </div>
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                            {filteredItems.length === 0 && !loading && (
                                                <TableRow>
                                                    <TableCell colSpan={cat.id === 'ufs' ? 4 : 3} className="h-32 text-center text-muted-foreground italic">
                                                        Nenhum resultado encontrado.
                                                    </TableCell>
                                                </TableRow>
                                            )}
                                        </TableBody>
                                    </Table>
                                )}
                            </CardContent>
                        </Card>
                    </TabsContent>
                ))}
            </Tabs>

            {/* Modal for Add/Edit */}
            <Dialog open={openModal} onOpenChange={setOpenModal}>
                <DialogContent className="max-w-md border-none shadow-2xl p-0 overflow-hidden">
                    <DialogHeader className="p-6 border-b border-border bg-muted/10">
                        <DialogTitle className="flex items-center gap-2 text-xl font-bold">
                            {modalAction === 'create' ? <Plus className="h-5 w-5 text-primary" /> : <Pencil className="h-5 w-5 text-primary" />}
                            {modalAction === 'create' ? 'Adicionar Novo' : 'Editar'} {categories.find(c => c.id === currentCategory)?.label}
                        </DialogTitle>
                        <DialogDescription>
                            Preencha os campos abaixo para {modalAction === 'create' ? 'cadastrar um novo' : 'atualizar o'} registro.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="p-6 space-y-4">
                        {currentCategory === 'communication' ? (
                            <div className="space-y-2">
                                <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Descrição *</Label>
                                <Input
                                    value={formData.descricao}
                                    onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                                    placeholder="Ex: WhatsApp, E-mail..."
                                    className="h-11 border-primary/10 focus:border-primary transition-all shadow-sm"
                                />
                            </div>
                        ) : (
                            <>
                                <div className="space-y-2">
                                    <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Nome *</Label>
                                    <Input
                                        value={formData.nome}
                                        onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                                        placeholder={`Nome da ${currentCategory === 'specialties' ? 'especialidade' : 'categoria'}...`}
                                        className="h-11 border-primary/10 focus:border-primary transition-all shadow-sm"
                                    />
                                </div>
                                {currentCategory === 'ufs' && (
                                    <div className="space-y-2">
                                        <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Sigla *</Label>
                                        <Input
                                            value={formData.sigla}
                                            onChange={(e) => setFormData({ ...formData, sigla: e.target.value.toUpperCase().slice(0, 2) })}
                                            placeholder="Ex: SP, RJ..."
                                            className="h-11 border-primary/10 focus:border-primary transition-all shadow-sm uppercase font-bold"
                                        />
                                    </div>
                                )}
                            </>
                        )}
                    </div>

                    <DialogFooter className="p-6 border-t border-border bg-muted/5 gap-3">
                        <Button variant="outline" onClick={() => setOpenModal(false)} className="h-11 px-8 font-bold uppercase text-xs tracking-widest">
                            Cancelar
                        </Button>
                        <Button 
                            onClick={handleSave} 
                            loading={isSubmitting}
                            disabled={
                                currentCategory === 'communication' ? !formData.descricao :
                                currentCategory === 'ufs' ? (!formData.nome || !formData.sigla) :
                                !formData.nome
                            }
                            className="h-11 px-8 font-bold uppercase text-xs tracking-widest shadow-lg shadow-primary/20"
                        >
                            Salvar Alterações
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Confirm Action Dialog */}
            <ConfirmActionDialog
                open={!!actionItem}
                onOpenChange={val => !val && setActionItem(null)}
                onConfirm={executeAction}
                isLoading={isSubmitting}
                title={actionItem?.action === 'delete' ? "Arquivar Item" : "Reativar Item"}
                description={
                    actionItem?.action === 'delete' 
                        ? "Tem certeza que deseja arquivar este item? Ele deixará de aparecer em novos formulários, mas permanecerá nos registros existentes."
                        : "Tem certeza que deseja reativar este item? Ele voltará a aparecer nos formulários e listagens ativas."
                }
                confirmText={actionItem?.action === 'delete' ? "Sim, arquivar" : "Sim, reativar"}
            />
        </div>
    );
}
