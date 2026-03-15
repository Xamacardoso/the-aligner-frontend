"use client";

import React from "react";
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import {
    Pencil,
    Plus,
    Trash2,
    FileText,
    Calendar,
    Stethoscope,
    AlertCircle,
    Files,
    Loader2
} from "lucide-react";
import { TreatmentListItem, TreatmentDetails, Budget } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { FileManagement } from "@/components/FileManagement";
import { ClinicalVisualizer } from "./ClinicalVisualizer";
import { CollapsibleSection } from "@/components/CollapsibleSection";
import { ConfirmActionDialog } from "@/components/ConfirmActionDialog";

/**
 * Cores e rótulos para os status de orçamento
 */
const statusLabel: Record<string, string> = {
    pendente: 'Pendente',
    aprovado: 'Aprovado',
    declinado: 'Declinado',
    cancelado: 'Cancelado',
};

const statusClass: Record<string, string> = {
    pendente: 'bg-yellow-100 text-yellow-700',
    aprovado: 'bg-green-100 text-green-700',
    declinado: 'bg-red-100 text-red-700',
    cancelado: 'bg-gray-100 text-gray-500',
};

const formatDate = (dateValue: string | Date | null | undefined) => {
    if (!dateValue) return 'Início não definido';
    const dateStr = dateValue instanceof Date ? dateValue.toISOString() : dateValue;
    const [y, m, d] = dateStr.split('T')[0].split('-').map(Number);
    return `${d.toString().padStart(2, '0')}/${m.toString().padStart(2, '0')}/${y}`;
};

interface TreatmentItemContentProps {
    treatment: TreatmentListItem;
    details: TreatmentDetails;
    budgets: Budget[];
    onEdit: () => void;
    onDeleteTreatment: (id: string) => void;
    onAddBudget: () => void;
    onViewBudget: (b: Budget) => void;
    onDeleteBudget: (id: string) => void;
}

/**
 * Componente interno para gerenciar o estado colapsável de cada tratamento individualmente.
 */
function TreatmentItemContent({
    treatment,
    details,
    budgets,
    onEdit,
    onDeleteTreatment,
    onAddBudget,
    onViewBudget,
    onDeleteBudget
}: TreatmentItemContentProps) {
    const [filesOpen, setFilesOpen] = React.useState(false);
    const [budgetsOpen, setBudgetsOpen] = React.useState(false);
    const [isUploading, setIsUploading] = React.useState(false);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = React.useState(false);
    const [statusFilter, setStatusFilter] = React.useState<'todos' | 'pendente' | 'aprovado' | 'declinado' | 'cancelado'>('todos');

    const filteredBudgets = budgets.filter(b => statusFilter === 'todos' || b.status === statusFilter);

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-top-2 duration-300">
            <ConfirmActionDialog
                open={isDeleteDialogOpen}
                onOpenChange={setIsDeleteDialogOpen}
                onConfirm={() => {
                    onDeleteTreatment(treatment.publicId);
                    setIsDeleteDialogOpen(false);
                }}
                title="Excluir Tratamento"
                description="Tem certeza que deseja excluir este tratamento permanentemente? Todos os orçamentos vinculados também serão removidos."
                confirmText="Excluir Tratamento"
            />
            {/* Detalhes Clínicos */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
                {details.descricaoCaso && (
                    <div className="space-y-1">
                        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Descrição do Caso</p>
                        <p className="text-sm text-foreground bg-muted/30 p-3 rounded-lg border border-border/50 italic">
                            "{details.descricaoCaso}"
                        </p>
                    </div>
                )}

                <div className="flex justify-end items-start gap-2">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={(e) => {
                            e.stopPropagation();
                            onEdit();
                        }}
                        className="h-8 gap-1.5 font-bold uppercase text-[10px]"
                    >
                        <Pencil className="h-3.5 w-3.5" /> Editar
                    </Button>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={(e) => {
                            e.stopPropagation();
                            setIsDeleteDialogOpen(true);
                        }}
                        className="h-8 gap-1.5 font-bold uppercase text-[10px] text-destructive hover:bg-destructive/10 border-destructive/20"
                    >
                        <Trash2 className="h-3.5 w-3.5" /> Excluir
                    </Button>
                </div>
            </div>

            {/* Seção visual melhorada de Objetivos e Apinhamentos */}
            <ClinicalVisualizer
                objetivos={details.objetivos}
                apinhamentos={details.apinhamentos}
            />

            {details.observacoesAdicionais && (
                <div className="space-y-1">
                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Observações Extras</p>
                    <p className="text-sm text-muted-foreground">{details.observacoesAdicionais}</p>
                </div>
            )}

            {/* Seção de Arquivos e Exames */}
            <CollapsibleSection
                title="Arquivos e Exames"
                icon={<Files className="h-4 w-4" />}
                open={filesOpen}
                onOpenChange={setFilesOpen}
                headerRight={
                    <Button
                        size="sm"
                        variant="outline"
                        className="h-7 gap-1.5 text-[10px] font-bold uppercase transition-all"
                        disabled={isUploading}
                        onClick={(e) => {
                            e.stopPropagation();
                            // Aciona o input oculto dentro do FileManagement
                            document.getElementById(`file-upload-${treatment.publicId}`)?.click();
                        }}
                    >
                        {isUploading ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                            <Plus className="h-3.5 w-3.5" />
                        )}
                        {isUploading ? "Enviando..." : "Upload"}
                    </Button>
                }
            >
                <FileManagement
                    patientCpf={treatment.publicId}
                    noCard
                    onUploadSuccess={() => setFilesOpen(true)}
                    onUploadingChange={setIsUploading}
                />
            </CollapsibleSection>

            {/* Seção de Orçamentos */}
            <CollapsibleSection
                title="Orçamentos do Tratamento"
                icon={<FileText className="h-4 w-4" />}
                open={budgetsOpen}
                onOpenChange={setBudgetsOpen}
                headerRight={
                    <Button
                        size="sm"
                        onClick={(e) => {
                            e.stopPropagation();
                            onAddBudget();
                        }}
                        className="h-7 gap-1.5 text-[10px] font-bold uppercase"
                    >
                        <Plus className="h-3.5 w-3.5" /> Novo Orçamento
                    </Button>
                }
            >
                {budgets.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-4 pb-2 border-b border-border/50">
                        {(['todos', 'pendente', 'aprovado', 'declinado', 'cancelado'] as const).map((s) => (
                            <button
                                key={s}
                                onClick={() => setStatusFilter(s)}
                                className={cn(
                                    "px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider transition-all border",
                                    statusFilter === s
                                        ? "bg-primary text-primary-foreground border-primary shadow-sm"
                                        : "bg-muted/50 text-muted-foreground border-transparent hover:bg-muted"
                                )}
                            >
                                {s === 'todos' ? 'Todos' : statusLabel[s]}
                                {s !== 'todos' && ` (${budgets.filter(b => b.status === s).length})`}
                            </button>
                        ))}
                    </div>
                )}

                {filteredBudgets.length === 0 ? (
                    <p className="text-xs text-muted-foreground italic bg-muted/20 p-4 rounded-lg border border-dashed text-center">
                        {statusFilter === 'todos' 
                            ? "Nenhum orçamento para este tratamento." 
                            : `Nenhum orçamento com status "${statusLabel[statusFilter]}" encontrado.`}
                    </p>
                ) : (
                    <div className="grid grid-cols-1 gap-2">
                        {filteredBudgets.map(b => (
                            <div
                                key={b.publicId}
                                id={`budget-${b.publicId}`}
                                className="group flex flex-col md:flex-row md:items-center justify-between p-3 bg-muted/40 rounded-xl border border-border/40 hover:border-primary/30 transition-all scroll-mt-20"
                            >
                                <div className="flex items-center gap-3">
                                    <Badge className={cn("text-[8px] font-bold h-5 uppercase", statusClass[b.status])}>
                                        {statusLabel[b.status]}
                                    </Badge>
                                    <div className="flex flex-col">
                                        <span className="text-xs font-bold text-foreground">
                                            {Number(b.valor).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                                        </span>
                                        <span className="text-[9px] text-muted-foreground">
                                            {b.dataCriacao ? new Date(b.dataCriacao).toLocaleDateString('pt-BR') : ''}
                                        </span>
                                    </div>
                                </div>

                                <div className="flex items-center gap-2 mt-2 md:mt-0">
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => onViewBudget(b)}
                                        className="h-7 text-[10px] font-bold uppercase text-primary hover:text-primary hover:bg-primary/10"
                                    >
                                        Visualizar
                                    </Button>
                                     {b.status === 'pendente' && (
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => onDeleteBudget(b.publicId)}
                                            className="h-7 w-7 text-destructive hover:bg-destructive/10 transition-colors"
                                            title="Cancelar orçamento"
                                        >
                                            <Trash2 className="h-3.5 w-3.5" />
                                        </Button>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </CollapsibleSection>
        </div>
    );
}

interface TreatmentAccordionProps {
    treatments: TreatmentListItem[];
    selectedTreatmentId: string | null;
    onSelect: (id: string) => void;
    treatmentDetails: TreatmentDetails | null;
    budgets: Budget[];
    onEditTreatment: () => void;
    onDeleteTreatment: (id: string) => void;
    onAddBudget: () => void;
    onViewBudget: (budget: Budget) => void;
    onDeleteBudget: (id: string) => void;
    isLoadingDetails?: boolean;
}

export function TreatmentAccordion({
    treatments,
    selectedTreatmentId,
    onSelect,
    treatmentDetails,
    budgets,
    onEditTreatment,
    onDeleteTreatment,
    onAddBudget,
    onViewBudget,
    onDeleteBudget,
    isLoadingDetails = false
}: TreatmentAccordionProps) {
    if (treatments.length === 0) {
        return (
            <div className="bg-muted/20 rounded-xl p-8 text-center border border-dashed border-border">
                <AlertCircle className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                <p className="text-sm text-muted-foreground italic">Nenhum tratamento registrado para este paciente.</p>
            </div>
        );
    }

    return (
        <Accordion
            type="single"
            collapsible
            value={selectedTreatmentId || ""}
            onValueChange={(value) => {
                onSelect(value);
            }}
            className="space-y-3"
        >
            {treatments.map((t) => (
                <AccordionItem
                    key={t.publicId}
                    value={t.publicId}
                    className="bg-card border border-border rounded-xl px-4 overflow-hidden shadow-sm hover:shadow-md transition-shadow"
                >
                    <AccordionTrigger className="hover:no-underline py-4">
                        <div className="flex items-center gap-4 text-left">
                            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary flex-shrink-0">
                                <Stethoscope className="h-5 w-5" />
                            </div>
                            <div>
                                <p className="text-sm font-bold text-foreground">
                                    {t.queixaPrincipal || "Sem queixa principal definida"}
                                </p>
                                <div className="flex items-center gap-2 mt-1">
                                    <Badge variant="outline" className="text-[10px] font-bold uppercase tracking-wider h-5">
                                        <Calendar className="h-3 w-3 mr-1" />
                                        {formatDate(t.dataInicio)}
                                    </Badge>
                                </div>
                            </div>
                        </div>
                    </AccordionTrigger>

                    <AccordionContent className="pt-2 pb-6">
                        {isLoadingDetails && selectedTreatmentId === t.publicId ? (
                            <div className="flex justify-center py-8">
                                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                            </div>
                        ) : treatmentDetails && selectedTreatmentId === t.publicId ? (
                            <TreatmentItemContent
                                treatment={t}
                                details={treatmentDetails}
                                budgets={budgets}
                                onEdit={onEditTreatment}
                                onDeleteTreatment={onDeleteTreatment}
                                onAddBudget={onAddBudget}
                                onViewBudget={onViewBudget}
                                onDeleteBudget={onDeleteBudget}
                            />
                        ) : (
                            <div className="py-8 text-center text-muted-foreground text-sm">
                                Selecione um tratamento para ver os detalhes
                            </div>
                        )}
                    </AccordionContent>
                </AccordionItem>
            ))}
        </Accordion>
    );
}
