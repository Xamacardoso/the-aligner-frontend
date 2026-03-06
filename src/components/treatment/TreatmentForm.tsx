"use client";

import { useState, useEffect } from "react";
import {
    treatmentService,
    clinicalService
} from "@/lib/api";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { CheckCircle2 } from "lucide-react";
import { FormSection } from "@/components/forms/FormSection";

import { TreatmentDetails } from "@/lib/types";

interface TreatmentFormProps {
    patientPublicId: string;
    partnerPublicId: string;
    initialData?: TreatmentDetails; // If provided, we are in edit mode
    onSuccess?: () => void;
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
    const [loading, setLoading] = useState(false);
    const [clinicalObjectives, setClinicalObjectives] = useState<{ id: number, nome: string }[]>([]);
    const [crowdingTypes, setCrowdingTypes] = useState<{ id: number, nome: string }[]>([]);

    const [form, setForm] = useState({
        queixaPrincipal: initialData?.queixaPrincipal || '',
        descricaoCaso: initialData?.descricaoCaso || '',
        observacoesAdicionais: initialData?.observacoesAdicionais || '',
        dataInicio: initialData?.dataInicio ? new Date(initialData.dataInicio).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
        objetivos: {} as Record<string, number>, // cat -> id
        apinhamentos: initialData?.apinhamentos?.map(a => a.id) || [] as number[]
    });

    useEffect(() => {
        async function loadAuxData() {
            try {
                const [objs, crows] = await Promise.all([
                    clinicalService.getTreatmentObjectives(),
                    clinicalService.getCrowdingTypes()
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
    }, [initialData]);

    const handleSave = async () => {
        const objectiveCategories = Array.from(new Set(clinicalObjectives.map(o => o.nome.split(' - ')[0])));
        if (objectiveCategories.some(cat => !form.objetivos[cat])) {
            toast({
                title: "Atenção",
                description: "Todos os objetivos de tratamento devem ser preenchidos.",
                variant: "destructive"
            });
            return;
        }

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

            if (initialData) {
                await treatmentService.update(initialData.publicId, payload);
                toast({ title: "Tratamento atualizado com sucesso!" });
            } else {
                await treatmentService.create(payload, patientPublicId, partnerPublicId);
                toast({ title: "Tratamento criado com sucesso!" });
            }

            if (onSuccess) onSuccess();
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
        <div className="space-y-8">
            <FormSection title="Informações Iniciais">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                        <Label>Data de Início Estimada</Label>
                        <Input
                            type="date"
                            value={form.dataInicio}
                            onChange={e => setForm(f => ({ ...f, dataInicio: e.target.value }))}
                        />
                    </div>
                    <div className="space-y-1.5">
                        <Label>Queixa Principal</Label>
                        <Input
                            placeholder="Ex: Dentes tortos, dor, estética..."
                            value={form.queixaPrincipal}
                            onChange={e => setForm(f => ({ ...f, queixaPrincipal: e.target.value }))}
                        />
                    </div>
                    <div className="col-span-full space-y-1.5">
                        <Label>Descrição do Caso / Diagnóstico</Label>
                        <Textarea
                            placeholder="Descreva detalhes clínicos do caso..."
                            value={form.descricaoCaso}
                            onChange={e => setForm(f => ({ ...f, descricaoCaso: e.target.value }))}
                            rows={3}
                            className="bg-background/50"
                        />
                    </div>
                </div>
            </FormSection>

            <FormSection
                title="Objetivos de Tratamento"
                description="Obrigatório escolher Manter ou Corrigir em cada item"
            >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                    {Object.entries(groupedObjectives).map(([cat, opts]) => (
                        <div key={cat} className="space-y-2">
                            <Label className="text-xs font-bold text-foreground inline-flex items-center gap-1">
                                {cat}
                                {form.objetivos[cat] && <CheckCircle2 className="h-3 w-3 text-green-500" />}
                            </Label>
                            <RadioGroup
                                className="flex items-center gap-4"
                                value={form.objetivos[cat]?.toString()}
                                onValueChange={(val) => setForm(f => ({
                                    ...f,
                                    objetivos: { ...f.objetivos, [cat]: parseInt(val) }
                                }))}
                            >
                                {opts.map(opt => (
                                    <div key={opt.id} className="flex items-center gap-2">
                                        <RadioGroupItem value={opt.id.toString()} id={`obj-${opt.id}`} />
                                        <label htmlFor={`obj-${opt.id}`} className="text-xs cursor-pointer hover:text-primary transition-colors">{opt.option}</label>
                                    </div>
                                ))}
                            </RadioGroup>
                        </div>
                    ))}
                </div>
            </FormSection>

            <FormSection
                title="Apinhamento"
                description="Selecione até 3 opções por categoria"
            >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {Object.entries(groupedCrowding).map(([cat, opts]) => (
                        <div key={cat} className="space-y-3">
                            <Label className="text-xs font-bold text-foreground border-l-2 border-primary pl-2">{cat}</Label>
                            <div className="space-y-2 pl-2">
                                {opts.map(opt => (
                                    <div key={opt.id} className="flex items-center gap-2">
                                        <Checkbox
                                            id={`crowd-${opt.id}`}
                                            checked={form.apinhamentos.includes(opt.id)}
                                            onCheckedChange={(checked) => {
                                                if (checked) {
                                                    const countInCategory = opts.filter(o => form.apinhamentos.includes(o.id)).length;
                                                    if (countInCategory >= 3) {
                                                        toast({ title: "Limite atingido", description: "Limite de 3 seleções por categoria.", variant: "destructive" });
                                                        return;
                                                    }
                                                    setForm(f => ({ ...f, apinhamentos: [...f.apinhamentos, opt.id] }));
                                                } else {
                                                    setForm(f => ({ ...f, apinhamentos: f.apinhamentos.filter(id => id !== opt.id) }));
                                                }
                                            }}
                                        />
                                        <label htmlFor={`crowd-${opt.id}`} className="text-xs leading-none cursor-pointer">{opt.option}</label>
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
                <Button onClick={handleSave} disabled={loading} className="min-w-[150px]">
                    {loading ? (initialData ? "Salvando..." : "Criando...") : (initialData ? "Salvar Alterações" : "Criar Tratamento")}
                </Button>
            </div>
        </div>
    );
}
