"use client";

/**
 * @component TreatmentAccordion
 * @description Componente principal de exibição de tratamentos clínicos.
 * Exibe um accordion com cada tratamento listado, e ao expandir mostra:
 * - Detalhes clínicos (descrição, objetivos, apinhamentos)
 * - 3 seções de arquivos com controle de acesso por role:
 *   1. "Exames Ortodônticos e Modelos Digitais" (exames) — ambos
 *   2. "Setups do Paciente" (setup) — somente gerente
 *   3. "Documentos Finais" (final) — gerente controla, dentista visualiza
 * - Seção de Orçamentos com filtros por status
 *
 * @prop userRole - Role do usuário logado ('gerente' | 'dentista')
 */

import React from "react";
import { FormattedDate } from "../ui/formatted-date";
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
    Loader2,
    FlaskConical,
    FileSearch,
    FileCheck,
} from "lucide-react";
import { TreatmentListItem, TreatmentDetails, Budget, UserRole } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { FileManagement } from "@/components/FileManagement";
import { ClinicalVisualizer } from "./ClinicalVisualizer";
import { CollapsibleSection } from "@/components/CollapsibleSection";
import { ConfirmActionDialog } from "@/components/ConfirmActionDialog";
import { BudgetFileUpload } from "@/components/budget/BudgetFileUpload";

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
    onEdit?: () => void;
    onDeleteTreatment?: (id: string) => void;
    onAddBudget?: () => void;
    onViewBudget: (b: Budget) => void;
    onDeleteBudget: (id: string) => void;
    onBudgetUpdated?: () => void;
    canUpload?: boolean;
    /** Role do usuário logado */
    userRole: UserRole;
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
    onDeleteBudget,
    onBudgetUpdated,
    canUpload = false,
    userRole,
}: TreatmentItemContentProps) {
    const [examesFilesOpen, setExamesFilesOpen] = React.useState(false);
    const [setupFilesOpen, setSetupFilesOpen] = React.useState(false);
    const [finalFilesOpen, setFinalFilesOpen] = React.useState(false);
    const [budgetsOpen, setBudgetsOpen] = React.useState(false);
    const [isUploadingExames, setIsUploadingExames] = React.useState(false);
    const [isUploadingSetup, setIsUploadingSetup] = React.useState(false);
    const [isUploadingFinal, setIsUploadingFinal] = React.useState(false);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = React.useState(false);
    const [statusFilter, setStatusFilter] = React.useState<'todos' | 'pendente' | 'aprovado' | 'declinado' | 'cancelado'>('todos');

    const isGerente = userRole === 'gerente';
    const isDentista = userRole === 'dentista';

    const filteredBudgets = budgets.filter(b => statusFilter === 'todos' || b.status === statusFilter);

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-top-2 duration-300">
            <ConfirmActionDialog
                open={isDeleteDialogOpen}
                onOpenChange={setIsDeleteDialogOpen}
                onConfirm={() => {
                    onDeleteTreatment?.(treatment.publicId);
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

                {(onEdit || onDeleteTreatment) && (
                    <div className="flex justify-end items-start gap-2">
                        {onEdit && (
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
                        )}
                        {onDeleteTreatment && (
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
                        )}
                    </div>
                )}
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

            {/* ========================================== */}
            {/* SEÇÃO 1: Exames Ortodônticos e Modelos Digitais */}
            {/* Acesso: Upload e download para AMBOS (dentista e gerente) */}
            {/* ========================================== */}
            <CollapsibleSection
                title="Exames Ortodônticos e Modelos Digitais"
                icon={<FlaskConical className="h-4 w-4" />}
                open={examesFilesOpen}
                onOpenChange={setExamesFilesOpen}
                headerRight={
                    <Button
                        size="sm"
                        variant="outline"
                        className="h-7 gap-1.5 text-[10px] font-bold uppercase transition-all"
                        disabled={isUploadingExames}
                        onClick={(e) => {
                            e.stopPropagation();
                            document.getElementById(`file-upload-${treatment.publicId}-exames`)?.click();
                        }}
                    >
                        {isUploadingExames ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                            <Plus className="h-3.5 w-3.5" />
                        )}
                        {isUploadingExames ? "Enviando..." : "Upload"}
                    </Button>
                }
            >
                <FileManagement
                    treatmentPublicId={treatment.publicId}
                    tipo="exames"
                    noCard
                    onUploadSuccess={() => setExamesFilesOpen(true)}
                    onUploadingChange={setIsUploadingExames}
                />
            </CollapsibleSection>

            {/* ========================================== */}
            {/* SEÇÃO 2: Setups do Paciente */}
            {/* Acesso: Somente GERENTE (leitura, escrita, exclusão) */}
            {/* Dentista NÃO vê esta seção */}
            {/* ========================================== */}
            {isGerente && (
                <CollapsibleSection
                    title="Setups do Paciente"
                    icon={<FileSearch className="h-4 w-4" />}
                    open={setupFilesOpen}
                    onOpenChange={setSetupFilesOpen}
                    headerRight={
                        <Button
                            size="sm"
                            variant="outline"
                            className="h-7 gap-1.5 text-[10px] font-bold uppercase transition-all"
                            disabled={isUploadingSetup}
                            onClick={(e) => {
                                e.stopPropagation();
                                document.getElementById(`file-upload-${treatment.publicId}-setup`)?.click();
                            }}
                        >
                            {isUploadingSetup ? (
                                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            ) : (
                                <Plus className="h-3.5 w-3.5" />
                            )}
                            {isUploadingSetup ? "Enviando..." : "Upload"}
                        </Button>
                    }
                >
                    <FileManagement
                        treatmentPublicId={treatment.publicId}
                        tipo="setup"
                        noCard
                        onUploadSuccess={() => setSetupFilesOpen(true)}
                        onUploadingChange={setIsUploadingSetup}
                    />
                </CollapsibleSection>
            )}

            {/* ========================================== */}
            {/* SEÇÃO 3: Documentos Finais */}
            {/* Acesso: Gerente controla tudo, Dentista somente visualiza/baixa */}
            {/* ========================================== */}
            <CollapsibleSection
                title="Documentos Finais"
                icon={<FileCheck className="h-4 w-4" />}
                open={finalFilesOpen}
                onOpenChange={setFinalFilesOpen}
                headerRight={
                    isGerente ? (
                        <Button
                            size="sm"
                            variant="outline"
                            className="h-7 gap-1.5 text-[10px] font-bold uppercase transition-all"
                            disabled={isUploadingFinal}
                            onClick={(e) => {
                                e.stopPropagation();
                                document.getElementById(`file-upload-${treatment.publicId}-final`)?.click();
                            }}
                        >
                            {isUploadingFinal ? (
                                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            ) : (
                                <Plus className="h-3.5 w-3.5" />
                            )}
                            {isUploadingFinal ? "Enviando..." : "Upload"}
                        </Button>
                    ) : undefined
                }
            >
                <FileManagement
                    treatmentPublicId={treatment.publicId}
                    tipo="final"
                    noCard
                    onUploadSuccess={() => setFinalFilesOpen(true)}
                    onUploadingChange={setIsUploadingFinal}
                    readOnly={isDentista}
                    canDelete={isGerente}
                />
            </CollapsibleSection>

            {/* ========================================== */}
            {/* Seção de Orçamentos */}
            {/* ========================================== */}
            <CollapsibleSection
                title="Orçamentos do Tratamento"
                icon={<FileText className="h-4 w-4" />}
                open={budgetsOpen}
                onOpenChange={setBudgetsOpen}
                headerRight={
                    /* Somente GERENTE pode criar novos orçamentos */
                    isGerente && onAddBudget ? (
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
                    ) : undefined
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
                                            <FormattedDate date={b.dataCriacao} placeholder="" />
                                        </span>
                                    </div>
                                    {/* Indicador de arquivos anexados */}
                                    {b.arquivos && b.arquivos.length > 0 && (
                                        <Badge variant="outline" className="text-[8px] font-bold h-5 uppercase gap-1 bg-primary/5 text-primary border-primary/20">
                                            <FileText className="h-2.5 w-2.5" /> 
                                            {b.arquivos.length} {b.arquivos.length === 1 ? 'Arquivo' : 'Arquivos'}
                                        </Badge>
                                    )}
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

                                    {/* Gerente pode anexar arquivos em orçamentos pendentes */}
                                    {b.status === 'pendente' && isGerente && (
                                        <BudgetFileUpload
                                            budgetPublicId={b.publicId}
                                            onSuccess={onBudgetUpdated}
                                            hasFile={(b.arquivos?.length || 0) > 0}
                                        />
                                    )}

                                    {/* Gerente pode excluir orçamentos pendentes */}
                                    {b.status === 'pendente' && isGerente && (
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => onDeleteBudget(b.publicId)}
                                            className="h-7 w-7 text-destructive hover:bg-destructive/10 transition-colors"
                                            title="Excluir orçamento"
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
    onEditTreatment?: () => void;
    onDeleteTreatment?: (id: string) => void;
    onAddBudget?: () => void;
    onViewBudget: (budget: Budget) => void;
    onDeleteBudget: (id: string) => void;
    onBudgetUpdated?: () => void;
    isLoadingDetails?: boolean;
    canUpload?: boolean;
    /** Role do usuário logado, controla visibilidade das seções */
    userRole: UserRole;
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
    onBudgetUpdated,
    isLoadingDetails = false,
    canUpload = false,
    userRole,
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
                                onBudgetUpdated={onBudgetUpdated}
                                canUpload={canUpload}
                                userRole={userRole}
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
