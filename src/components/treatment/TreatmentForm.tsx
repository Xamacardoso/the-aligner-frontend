"use client";

import { useState, useEffect } from "react";
import {
    treatmentService,
    clinicalService
} from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { CheckCircle2 } from "lucide-react";
import { FormSection } from "@/components/forms/FormSection";
import { cn } from "@/lib/utils";
import { useAppAuth } from "@/hooks/use-app-auth";

import { TreatmentDetails } from "@/lib/types";

interface TreatmentFormProps {
    patientPublicId: string;
    partnerPublicId: string;
    initialData?: TreatmentDetails; // If provided, we are in edit mode
    onSuccess?: (data: TreatmentDetails) => void;
    onCancel?: () => void;
}

export function TreatmentForm({
    patientPublicId,
    partnerPublicId,
    initialData,
    onSuccess,
    onCancel
}: TreatmentFormProps) {
    const { toast } = useToast();
    const { token, isLoaded } = useAppAuth();
    const [loading, setLoading] = useState(false);
    const [clinicalObjectives, setClinicalObjectives] = useState<{ id: number, nome: string }[]>([]);
    const [crowdingTypes, setCrowdingTypes] = useState<{ id: number, nome: string }[]>([]);
    const [missingCategories, setMissingCategories] = useState<string[]>([]);

    const [form, setForm] = useState({
        queixaPrincipal: initialData?.queixaPrincipal || '',
        descricaoCaso: initialData?.descricaoCaso || '',
        observacoesAdicionais: initialData?.observacoesAdicionais || '',
        dataInicio: initialData?.dataInicio ? initialData.dataInicio.toString().split('T')[0] : new Date().toLocaleDateString('en-CA'),
        objetivos: {} as Record<string, number>, // cat -> id
        apinhamentos: initialData?.apinhamentos?.map(a => a.id) || [] as number[]
    });

    useEffect(() => {
        async function loadAuxData() {
            if (!isLoaded || !token) return;

            try {
                const [objs, crows] = await Promise.all([
                    clinicalService.getTreatmentObjectives(token),
                    clinicalService.getCrowdingTypes(token)
                ]);
                setClinicalObjectives(objs);
                setCrowdingTypes(crows);

                // If editing, map initial objetivos (ids) to the categories
                if (initialData?.objetivos) {
                    const mappedObjs: Record<string, number> = {};
                    initialData.objetivos.forEach(o => {
                        const cat = o.nome.split(' - ')[0];
                        mappedObjs[cat] = o.id;
                    });
                    setForm(f => ({ ...f, objetivos: mappedObjs }));
                }
            } catch (err) {
                console.error("Erro ao carregar dados clínicos auxiliares", err);
            }
        }
        loadAuxData();
    }, [isLoaded, token, initialData]); 

    useEffect(() => {
        if (initialData) {
            const mappedObjs: Record<string, number> = {};
            if (initialData.objetivos) {
                initialData.objetivos.forEach(o => {
                    const cat = o.nome.split(' - ')[0];
                    mappedObjs[cat] = o.id;
                });
            }

            setForm({
                queixaPrincipal: initialData.queixaPrincipal || '',
                descricaoCaso: initialData.descricaoCaso || '',
                observacoesAdicionais: initialData.observacoesAdicionais || '',
                dataInicio: initialData.dataInicio ? initialData.dataInicio.toString().split('T')[0] : new Date().toLocaleDateString('en-CA'),
                objetivos: mappedObjs,
                apinhamentos: initialData.apinhamentos?.map(a => a.id) || []
            });
            setMissingCategories([]);
        }
    }, [initialData]);

    const handleSave = async () => {
        const objectiveCategories = Array.from(new Set(clinicalObjectives.map(o => o.nome.split(' - ')[0])));
        const missing = objectiveCategories.filter(cat => !form.objetivos[cat]);

        if (missing.length > 0) {
            setMissingCategories(missing);
            toast({
                title: "Campos Obrigatórios",
                description: `Por favor, preencha os itens: ${missing.join(', ')}`,
                variant: "destructive"
            });

            // Scroll to first error
            setTimeout(() => {
                const firstError = document.getElementById(`cat-${missing[0]}`);
                if (firstError) firstError.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }, 100);
            return;
        }

        setMissingCategories([]);

        setLoading(true);
        try {
            const payload = {
                queixaPrincipal: form.queixaPrincipal,
                descricaoCaso: form.descricaoCaso,
                observacoesAdicionais: form.observacoesAdicionais,
                dataInicio: form.dataInicio,
                objetivosIds: Object.values(form.objetivos),
                apinhamentosIds: form.apinhamentos
            };

            let response;
            if (initialData) {
                response = await treatmentService.update(initialData.publicId, payload, token || undefined);
                toast({ title: "Tratamento atualizado com sucesso!" });
            } else {
                response = await treatmentService.create(payload, patientPublicId, partnerPublicId, token || undefined);
                toast({
                    title: "Tratamento criado com sucesso!",
                    description: "O novo tratamento já está disponível na lista."
                });
            }

            if (onSuccess && response) onSuccess(response);
        } catch (err) {
            toast({ title: initialData ? "Erro ao atualizar tratamento" : "Erro ao criar tratamento", variant: "destructive" });
        } finally {
            setLoading(false);
        }
    };

    // Grouping helpers
    const groupedObjectives = clinicalObjectives.reduce((acc, obj) => {
        const [category, option] = obj.nome.split(' - ');
        if (!acc[category]) acc[category] = [];
        acc[category].push({ id: obj.id, option });
        return acc;
    }, {} as Record<string, { id: number, option: string }[]>);

    const groupedCrowding = crowdingTypes.reduce((acc, crow) => {
        const [category, option] = crow.nome.split(' - ');
        if (!acc[category]) acc[category] = [];
        acc[category].push({ id: crow.id, option });
        return acc;
    }, {} as Record<string, { id: number, option: string }[]>);

    return (
        <div className="space-y-8 relative">
            {loading && (
                <div className="absolute inset-0 bg-background/60 backdrop-blur-[2px] z-50 flex flex-col items-center justify-center rounded-xl animate-in fade-in duration-300">
                    <div className="h-12 w-12 rounded-full border-4 border-primary/30 border-t-primary animate-spin mb-4" />
                    <p className="text-sm font-bold uppercase tracking-widest text-primary animate-pulse">
                        {initialData ? "Salvando Alterações..." : "Criando Tratamento..."}
                    </p>
                </div>
            )}

            <FormSection title="Informações Iniciais">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    <div className="md:col-span-1 space-y-1.5">
                        <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Data de Início</Label>
                        <Input
                            type="date"
                            value={form.dataInicio}
                            className="h-11 border-primary/10 focus:border-primary transition-all font-medium"
                            onChange={e => setForm(f => ({ ...f, dataInicio: e.target.value }))}
                        />
                    </div>
                    <div className="md:col-span-3 space-y-1.5">
                        <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Queixa Principal</Label>
                        <Input
                            placeholder="Descreva a queixa principal do paciente (ex: Diastemas, Apinhamento severo...)"
                            value={form.queixaPrincipal}
                            className="h-11 border-primary/10 focus:border-primary transition-all font-medium"
                            onChange={e => setForm(f => ({ ...f, queixaPrincipal: e.target.value }))}
                        />
                    </div>
                    <div className="col-span-full space-y-1.5">
                        <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Descrição do Caso / Diagnóstico</Label>
                        <Textarea
                            placeholder="Forneça detalhes técnicos e diagnóstico clínico..."
                            value={form.descricaoCaso}
                            onChange={e => setForm(f => ({ ...f, descricaoCaso: e.target.value }))}
                            rows={2}
                            className="bg-background/50 border-primary/10 focus:border-primary transition-all resize-none"
                        />
                    </div>
                </div>
            </FormSection>

            <FormSection
                title="Objetivos de Tratamento"
                description="Selecione as ações corretivas ou de manutenção para cada setor"
            >
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-4">
                    {Object.entries(groupedObjectives).map(([cat, opts]) => (
                        <div
                            key={cat}
                            id={`cat-${cat}`}
                            className={cn(
                                "space-y-3 p-3.5 rounded-xl transition-all border border-border/40 bg-muted/10 hover:bg-muted/20 hover:border-primary/20",
                                missingCategories.includes(cat) && "bg-red-50/50 border-red-200"
                            )}>
                            <div className="flex items-center justify-between border-b border-border/40 pb-2 mb-1">
                                <Label className={cn(
                                    "text-[10px] font-black uppercase tracking-tighter inline-flex items-center gap-1.5",
                                    missingCategories.includes(cat) ? "text-red-600" : "text-primary"
                                )}>
                                    {cat}
                                    {form.objetivos[cat] && <CheckCircle2 className="h-3 w-3 text-green-500" />}
                                </Label>
                                {missingCategories.includes(cat) && <span className="text-[8px] font-black text-red-600 bg-red-100 px-1.5 py-0.5 rounded uppercase">Pendente</span>}
                            </div>
                            <RadioGroup
                                className="grid grid-cols-2 gap-2"
                                value={form.objetivos[cat]?.toString()}
                                onValueChange={(val) => {
                                    setForm(f => ({
                                        ...f,
                                        objetivos: { ...f.objetivos, [cat]: parseInt(val) }
                                    }));
                                    setMissingCategories(prev => prev.filter(c => c !== cat));
                                }}
                            >
                                {opts.map(opt => (
                                    <div key={opt.id} className="flex items-center space-x-2">
                                        <RadioGroupItem value={opt.id.toString()} id={`obj-${opt.id}`} className="shrink-0" />
                                        <Label htmlFor={`obj-${opt.id}`} className="text-[11px] font-semibold cursor-pointer truncate leading-none py-1">{opt.option}</Label>
                                    </div>
                                ))}
                            </RadioGroup>
                        </div>
                    ))}
                </div>
            </FormSection>

            <FormSection
                title="Apinhamento e Espaçamento"
                description="Até 3 opções por arcada"
            >
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {Object.entries(groupedCrowding).map(([cat, opts]) => (
                        <div key={cat} className="space-y-4 p-5 rounded-2xl border border-border/50 bg-muted/5 shadow-sm">
                            <Label className="text-[11px] font-black uppercase tracking-widest text-primary border-l-4 border-primary pl-3">{cat}</Label>
                            <div className="grid grid-cols-2 gap-x-6 gap-y-3">
                                {opts.map(opt => (
                                    <div key={opt.id} className="flex items-center gap-3 p-1 rounded-lg hover:bg-background/80 transition-all border border-transparent hover:border-border/40">
                                        <Checkbox
                                            id={`crowd-${opt.id}`}
                                            checked={form.apinhamentos.includes(opt.id)}
                                            onCheckedChange={(checked) => {
                                                if (checked) {
                                                    const countInCategory = opts.filter(o => form.apinhamentos.includes(o.id)).length;
                                                    if (countInCategory >= 3) {
                                                        toast({ title: "Limite atingido", description: "Máximo de 3 seleções nesta seção.", variant: "destructive" });
                                                        return;
                                                    }
                                                    setForm(f => ({ ...f, apinhamentos: [...f.apinhamentos, opt.id] }));
                                                } else {
                                                    setForm(f => ({ ...f, apinhamentos: f.apinhamentos.filter(id => id !== opt.id) }));
                                                }
                                            }}
                                        />
                                        <Label htmlFor={`crowd-${opt.id}`} className="text-xs font-semibold cursor-pointer truncate leading-none">{opt.option}</Label>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            </FormSection>

            <FormSection title="Observações Adicionais">
                <Textarea
                    placeholder="Qualquer outra nota relevante para o tratamento..."
                    value={form.observacoesAdicionais}
                    onChange={e => setForm(f => ({ ...f, observacoesAdicionais: e.target.value }))}
                    rows={2}
                    className="bg-background/50"
                />
            </FormSection>

            <div className="flex justify-end gap-3 pt-6">
                <Button variant="ghost" onClick={onCancel} disabled={loading}>Cancelar</Button>
                <Button onClick={handleSave} loading={loading} className="min-w-[150px]">
                    {initialData ? "Salvar Alterações" : "Criar Tratamento"}
                </Button>
            </div>
        </div>
    );
}
