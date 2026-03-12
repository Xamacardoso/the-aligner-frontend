"use client";

import { useState, useEffect } from "react";
import {
    partnerService,
    clinicalService
} from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { FormSection } from "@/components/forms/FormSection";
import { PartnerDetails } from "@/lib/types";
import { Loader2, User, Building, Award, Phone } from "lucide-react";
import { useAppAuth } from "@/hooks/use-app-auth";

interface PartnerFormProps {
    initialData?: PartnerDetails;
    onSuccess?: () => void;
    onCancel?: () => void;
}

export function PartnerForm({
    initialData,
    onSuccess,
    onCancel
}: PartnerFormProps) {
    const { toast } = useToast();
    const { token } = useAppAuth();
    const [loading, setLoading] = useState(false);
    const [ufs, setUfs] = useState<{ id: number, nome: string, sigla: string }[]>([]);
    const [specialties, setSpecialties] = useState<{ id: number, nome: string }[]>([]);
    const [degrees, setDegrees] = useState<{ id: number, nome: string }[]>([]);
    const [commTypes, setCommTypes] = useState<{ id: number, descricao: string }[]>([]);

    const isEditing = !!initialData;

    const [form, setForm] = useState({
        cpf: initialData?.cpf || '',
        nome: initialData?.nome || '',
        email: initialData?.email || '',
        senha: '',
        cro: initialData?.cro || '',
        croUf: initialData?.croUf || '',
        telefone: initialData?.telefone || '',
        titulacaoId: 0,
        especialidadesIds: [] as number[],
        comunicacoesIds: [] as number[],

        // Estabelecimento
        cnpj: initialData?.cnpj || '',
        razaoSocial: initialData?.razaoSocial || '',
        endereco: initialData?.endereco || '',
        telefone_estabelecimento: initialData?.telefone_estabelecimento || '',
        complemento: initialData?.complemento || '',
        cep: initialData?.cep || '',
        bairro: initialData?.bairro || '',
        cidade: initialData?.cidade || '',
        uf_estabelecimento: initialData?.uf_estabelecimento || '',
    });

    useEffect(() => {
        async function loadAuxData() {
            try {
                const [ufsRes, specRes, degRes, commRes] = await Promise.all([
                    clinicalService.getUfs(),
                    clinicalService.getSpecialties(),
                    clinicalService.getDegrees(),
                    clinicalService.getCommunicationTypes()
                ]);
                setUfs(ufsRes);
                setSpecialties(specRes);
                setDegrees(degRes);
                setCommTypes(commRes);

                // Map initial labels to IDs if editing
                if (initialData) {
                    const foundDegree = degRes.find((d: any) => d.nome === initialData.titulacao);
                    const foundSpecIds = specRes
                        .filter((s: any) => initialData.especialidades?.includes(s.nome))
                        .map((s: any) => s.id);
                    const foundCommIds = commRes
                        .filter((c: any) => initialData.comunicacoes?.includes(c.descricao))
                        .map((c: any) => c.id);

                    setForm(f => ({
                        ...f,
                        titulacaoId: foundDegree?.id || 0,
                        especialidadesIds: foundSpecIds,
                        comunicacoesIds: foundCommIds
                    }));
                }
            } catch (err) {
                console.error("Erro ao carregar dados auxiliares", err);
            }
        }
        loadAuxData();
    }, [initialData]);

    const handleSave = async () => {
        // Basic validation
        if (!form.cpf || !form.nome || !form.email || (!isEditing && !form.senha) || !form.cro || !form.croUf || !form.titulacaoId) {
            toast({
                title: "Campos obrigatórios",
                description: "Por favor, preencha todos os campos marcados com *.",
                variant: "destructive"
            });
            return;
        }

        setLoading(true);
        try {
            const payload = {
                ...form,
                especialidadesIds: form.especialidadesIds,
                comunicacoesIds: form.comunicacoesIds
            };

            // Remove empty fields for establishment if they are not provided
            if (!payload.cnpj) delete (payload as any).cnpj;
            if (!payload.razaoSocial) delete (payload as any).razaoSocial;
            if (!payload.endereco) delete (payload as any).endereco;
            if (!payload.telefone_estabelecimento) delete (payload as any).telefone_estabelecimento;

            if (isEditing) {
                // Remove password if not changing
                if (!form.senha) delete (payload as any).senha;
                await partnerService.update(form.cpf, payload, token || undefined);
                toast({ title: "Parceiro atualizado com sucesso!" });
            } else {
                await partnerService.create(payload, token || undefined);
                toast({ title: "Parceiro criado com sucesso!" });
            }

            if (onSuccess) onSuccess();
        } catch (err: any) {
            toast({
                title: "Erro ao salvar",
                description: err.message || "Ocorreu um erro ao processar a solicitação.",
                variant: "destructive"
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-8">
            <FormSection title="Dados Pessoais e Acesso">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                        <Input
                            placeholder="Nome do dentista parceiro"
                            value={form.nome}
                            onChange={e => setForm(f => ({ ...f, nome: e.target.value }))}
                        />
                    </div>
                    <div className="space-y-1.5">
                        <Label>E-mail *</Label>
                        <Input
                            type="email"
                            placeholder="email@exemplo.com"
                            value={form.email}
                            onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                        />
                    </div>
                    <div className="space-y-1.5">
                        <Label>{isEditing ? 'Nova Senha (deixe vazio para não alterar)' : 'Senha de Acesso *'}</Label>
                        <Input
                            type="password"
                            placeholder="Mínimo 6 caracteres"
                            value={form.senha}
                            onChange={e => setForm(f => ({ ...f, senha: e.target.value }))}
                        />
                    </div>
                    <div className="space-y-1.5">
                        <Label>Telefone Pessoal</Label>
                        <Input
                            placeholder="DDD + Número"
                            value={form.telefone}
                            onChange={e => setForm(f => ({ ...f, telefone: e.target.value.replace(/\D/g, '').slice(0, 11) }))}
                        />
                    </div>
                </div>
            </FormSection>

            <FormSection title="Registro Profissional">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-1.5">
                        <Label>CRO *</Label>
                        <Input
                            placeholder="Número do registro"
                            value={form.cro}
                            onChange={e => setForm(f => ({ ...f, cro: e.target.value }))}
                        />
                    </div>
                    <div className="space-y-1.5">
                        <Label>UF do CRO *</Label>
                        <select
                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                            value={form.croUf}
                            onChange={e => setForm(f => ({ ...f, croUf: e.target.value }))}
                        >
                            <option value="">Selecione...</option>
                            {ufs.map(uf => (
                                <option key={uf.id} value={uf.sigla}>{uf.sigla} - {uf.nome}</option>
                            ))}
                        </select>
                    </div>
                </div>
            </FormSection>

            <FormSection
                title="Titulação Principal"
                description="Escolha sua maior titulação *"
            >
                <RadioGroup
                    className="grid grid-cols-1 md:grid-cols-3 gap-4"
                    value={form.titulacaoId.toString()}
                    onValueChange={val => setForm(f => ({ ...f, titulacaoId: parseInt(val) }))}
                >
                    {degrees.map(deg => (
                        <div key={deg.id} className="flex items-center space-x-2 bg-background/50 p-2 rounded-lg border border-border/40 hover:border-primary/50 transition-colors">
                            <RadioGroupItem value={deg.id.toString()} id={`deg-${deg.id}`} />
                            <Label htmlFor={`deg-${deg.id}`} className="flex-1 cursor-pointer text-xs font-medium">{deg.nome}</Label>
                        </div>
                    ))}
                </RadioGroup>
            </FormSection>

            <FormSection
                title="Especialidades"
                description="Selecione todas que se aplicam"
            >
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    {specialties.map(spec => (
                        <div key={spec.id} className="flex items-center space-x-2 bg-background/50 p-2 rounded-lg border border-border/40 hover:border-primary/50 transition-colors">
                            <Checkbox
                                id={`spec-${spec.id}`}
                                checked={form.especialidadesIds.includes(spec.id)}
                                onCheckedChange={(checked) => {
                                    if (checked) {
                                        setForm(f => ({ ...f, especialidadesIds: [...f.especialidadesIds, spec.id] }));
                                    } else {
                                        setForm(f => ({ ...f, especialidadesIds: f.especialidadesIds.filter(id => id !== spec.id) }));
                                    }
                                }}
                            />
                            <Label htmlFor={`spec-${spec.id}`} className="flex-1 cursor-pointer text-[10px] font-semibold uppercase tracking-tight">{spec.nome}</Label>
                        </div>
                    ))}
                </div>
            </FormSection>

            <FormSection title="Dados do Estabelecimento / Clínica">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                        <Label>Razão Social</Label>
                        <Input
                            placeholder="Nome da clínica"
                            value={form.razaoSocial}
                            onChange={e => setForm(f => ({ ...f, razaoSocial: e.target.value }))}
                        />
                    </div>
                    <div className="space-y-1.5">
                        <Label>CNPJ</Label>
                        <Input
                            placeholder="Apenas números"
                            value={form.cnpj}
                            onChange={e => setForm(f => ({ ...f, cnpj: e.target.value.replace(/\D/g, '').slice(0, 14) }))}
                        />
                    </div>
                    <div className="col-span-full space-y-1.5">
                        <Label>Endereço Completo</Label>
                        <Input
                            placeholder="Rua, número, etc"
                            value={form.endereco}
                            onChange={e => setForm(f => ({ ...f, endereco: e.target.value }))}
                        />
                    </div>
                    <div className="space-y-1.5">
                        <Label>Bairro</Label>
                        <Input value={form.bairro} onChange={e => setForm(f => ({ ...f, bairro: e.target.value }))} />
                    </div>
                    <div className="space-y-1.5">
                        <Label>CEP</Label>
                        <Input
                            placeholder="Apenas números"
                            value={form.cep}
                            onChange={e => setForm(f => ({ ...f, cep: e.target.value.replace(/\D/g, '').slice(0, 8) }))}
                        />
                    </div>
                    <div className="space-y-1.5">
                        <Label>Cidade</Label>
                        <Input value={form.cidade} onChange={e => setForm(f => ({ ...f, cidade: e.target.value }))} />
                    </div>
                    <div className="space-y-1.5">
                        <Label>UF do Estabelecimento</Label>
                        <select
                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                            value={form.uf_estabelecimento}
                            onChange={e => setForm(f => ({ ...f, uf_estabelecimento: e.target.value }))}
                        >
                            <option value="">Selecione...</option>
                            {ufs.map(uf => (
                                <option key={uf.id} value={uf.sigla}>{uf.sigla} - {uf.nome}</option>
                            ))}
                        </select>
                    </div>
                </div>
            </FormSection>

            <FormSection
                title="Preferências de Comunicação"
                description="Como prefere ser contatado"
            >
                <div className="flex flex-wrap gap-4">
                    {commTypes.map(ct => (
                        <div key={ct.id} className="flex items-center space-x-2">
                            <Checkbox
                                id={`comm-${ct.id}`}
                                checked={form.comunicacoesIds.includes(ct.id)}
                                onCheckedChange={(checked) => {
                                    if (checked) {
                                        setForm(f => ({ ...f, comunicacoesIds: [...f.comunicacoesIds, ct.id] }));
                                    } else {
                                        setForm(f => ({ ...f, comunicacoesIds: f.comunicacoesIds.filter(id => id !== ct.id) }));
                                    }
                                }}
                            />
                            <Label htmlFor={`comm-${ct.id}`} className="cursor-pointer text-xs font-medium">{ct.descricao}</Label>
                        </div>
                    ))}
                </div>
            </FormSection>

            <div className="flex justify-end gap-3 pt-6">
                <Button variant="ghost" onClick={onCancel} disabled={loading}>Cancelar</Button>
                <Button onClick={handleSave} loading={loading} className="min-w-[150px]">
                    {isEditing ? "Salvar Alterações" : "Cadastrar Parceiro"}
                </Button>
            </div>
        </div>
    );
}
